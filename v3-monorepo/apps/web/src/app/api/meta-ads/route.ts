import { NextResponse } from "next/server";
import { prisma } from "@marklabs/database";
import { apiErrorResponse, requireTeamAccess } from "@/lib/authorization";

const GRAPH_API = "https://graph.facebook.com/v21.0";

function periodToDates(period: string): { since: string; until: string } {
  const until = new Date();
  const since = new Date();
  if (period === "7 dias") since.setDate(since.getDate() - 7);
  else if (period === "90 dias") since.setDate(since.getDate() - 90);
  else if (period === "6 meses") since.setDate(since.getDate() - 180);
  else since.setDate(since.getDate() - 30); // default 30 dias
  const fmt = (d: Date) => d.toISOString().split("T")[0];
  return { since: fmt(since), until: fmt(until) };
}

async function fetchAdAccounts(accessToken: string): Promise<string[]> {
  const res = await fetch(
    `${GRAPH_API}/me/adaccounts?fields=account_id&limit=10&access_token=${accessToken}`
  );
  if (!res.ok) return [];
  const data = await res.json() as { data?: Array<{ id: string; account_id: string }> };
  return (data.data ?? []).map((a) => a.id); // "act_XXXXXXXXX"
}

async function fetchAccountInsights(accessToken: string, adAccountId: string, since: string, until: string) {
  const fields = "spend,impressions,clicks,ctr,cpm,cpc,reach,actions,date_start";
  const timeRange = JSON.stringify({ since, until });
  const url = `${GRAPH_API}/${adAccountId}/insights?fields=${fields}&time_range=${encodeURIComponent(timeRange)}&time_increment=1&access_token=${accessToken}`;
  const res = await fetch(url);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    console.error("[META ADS INSIGHTS ERROR]", err);
    return [];
  }
  const data = await res.json() as { data?: any[] };
  return data.data ?? [];
}

async function fetchCampaigns(accessToken: string, adAccountId: string, since: string, until: string) {
  const timeRange = JSON.stringify({ since, until });
  const fields = `name,status,insights.time_range(${timeRange}){spend,impressions,clicks,ctr,cpm,cpc,reach,actions}`;
  const url = `${GRAPH_API}/${adAccountId}/campaigns?fields=${encodeURIComponent(fields)}&limit=20&access_token=${accessToken}`;
  const res = await fetch(url);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    console.error("[META ADS CAMPAIGNS ERROR]", err);
    return [];
  }
  const data = await res.json() as { data?: any[] };
  return data.data ?? [];
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const teamId = searchParams.get("teamId");
  const period = searchParams.get("period") || "30 dias";

  if (!teamId) return NextResponse.json({ error: "teamId obrigatório" }, { status: 400 });

  try {
    await requireTeamAccess(teamId);

    // Busca conta Facebook conectada ao time
    const facebookAccount = await prisma.socialAccount.findFirst({
      where: { teamId, platform: "FACEBOOK", isActive: true },
      select: { accessToken: true, name: true },
    });

    if (!facebookAccount?.accessToken) {
      return NextResponse.json({ error: "Nenhuma conta do Facebook conectada a este time." }, { status: 404 });
    }

    const { since, until } = periodToDates(period);

    // Busca as contas de anúncio vinculadas ao token
    const adAccountIds = await fetchAdAccounts(facebookAccount.accessToken);

    if (adAccountIds.length === 0) {
      return NextResponse.json({
        error: "Nenhuma conta de anúncios encontrada. Verifique se o usuário do Facebook tem acesso ao Gerenciador de Anúncios.",
      }, { status: 404 });
    }

    // Usa a primeira conta de anúncio (ou podemos expandir para múltiplas)
    const adAccountId = adAccountIds[0];

    // Busca em paralelo: insights diários + campanhas
    const [dailyInsights, campaigns] = await Promise.all([
      fetchAccountInsights(facebookAccount.accessToken, adAccountId, since, until),
      fetchCampaigns(facebookAccount.accessToken, adAccountId, since, until),
    ]);

    // Normaliza os dados diários para o gráfico
    const chartData = dailyInsights.map((d: any) => ({
      date: new Date(d.date_start).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
      spend: parseFloat(d.spend || "0"),
      impressoes: parseInt(d.impressions || "0"),
      cliques: parseInt(d.clicks || "0"),
      ctr: parseFloat(d.ctr || "0"),
      cpm: parseFloat(d.cpm || "0"),
      cpc: parseFloat(d.cpc || "0"),
    }));

    // Agrega totais do período
    const totals = dailyInsights.reduce((acc: any, d: any) => ({
      spend: acc.spend + parseFloat(d.spend || "0"),
      impressions: acc.impressions + parseInt(d.impressions || "0"),
      clicks: acc.clicks + parseInt(d.clicks || "0"),
    }), { spend: 0, impressions: 0, clicks: 0 });

    // Normaliza campanhas para a tabela
    const campaignData = campaigns.map((c: any) => {
      const ins = c.insights?.data?.[0] ?? {};
      return {
        id: c.id,
        name: c.name,
        status: c.status,
        spend: parseFloat(ins.spend || "0"),
        impressions: parseInt(ins.impressions || "0"),
        clicks: parseInt(ins.clicks || "0"),
        ctr: parseFloat(ins.ctr || "0"),
        cpc: parseFloat(ins.cpc || "0"),
        cpm: parseFloat(ins.cpm || "0"),
        reach: parseInt(ins.reach || "0"),
      };
    }).sort((a: any, b: any) => b.spend - a.spend);

    return NextResponse.json({
      adAccountId,
      period,
      since,
      until,
      chartData,
      totals,
      campaigns: campaignData,
    });
  } catch (error) {
    const result = apiErrorResponse(error);
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
}
