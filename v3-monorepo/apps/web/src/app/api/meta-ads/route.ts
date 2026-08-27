import { NextResponse } from "next/server";
import { prisma } from "@marklabs/database";
import { apiErrorResponse, requireTeamAccess } from "@/lib/authorization";

const GRAPH_API = "https://graph.facebook.com/v25.0";

function periodToDates(period: string): { since: string; until: string } {
  const until = new Date();
  const since = new Date();
  if (period === "7 dias") since.setDate(since.getDate() - 7);
  else if (period === "90 dias") since.setDate(since.getDate() - 90);
  else if (period === "6 meses") since.setDate(since.getDate() - 180);
  else since.setDate(since.getDate() - 30);
  const fmt = (d: Date) => d.toISOString().split("T")[0];
  return { since: fmt(since), until: fmt(until) };
}

async function fetchAdAccountsDetailed(accessToken: string): Promise<Array<{ id: string; account_id: string; name?: string }>> {
  const res = await fetch(`${GRAPH_API}/me/adaccounts?fields=account_id,name&limit=100&access_token=${accessToken}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    console.error("[META ADS ACCOUNTS ERROR]", err);
    return [];
  }
  const data = (await res.json()) as { data?: Array<{ id: string; account_id: string; name?: string }> };
  return data.data ?? [];
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
  const data = (await res.json()) as { data?: any[] };
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
  const data = (await res.json()) as { data?: any[] };
  return data.data ?? [];
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const teamId = searchParams.get("teamId");
  const period = searchParams.get("period") || "30 dias";
  const accountIds = searchParams.getAll("accountIds");
  const facebookAccountId = searchParams.get("facebookAccountId");
  const adAccountIdParam = searchParams.get("adAccountId");

  if (!teamId) return NextResponse.json({ error: "teamId obrigatório" }, { status: 400 });

  try {
    await requireTeamAccess(teamId);

    const facebookAccounts = await prisma.socialAccount.findMany({
      where: {
        teamId,
        platform: "FACEBOOK",
        isActive: true,
        ...(accountIds.length > 0 ? { id: { in: accountIds } } : {}),
      },
      select: { id: true, accessToken: true, refreshToken: true, name: true },
    });

    const candidateFacebookAccounts = facebookAccountId
      ? facebookAccounts.filter((account) => account.id === facebookAccountId && account.accessToken)
      : facebookAccounts.filter((account) => account.accessToken);
    if (candidateFacebookAccounts.length === 0) {
      return NextResponse.json({ error: "Nenhuma conta do Facebook conectada a este time." }, { status: 404 });
    }

    const { since, until } = periodToDates(period);
    let facebookAccount = candidateFacebookAccounts[0];
    let adAccounts: Array<{ id: string; account_id: string; name?: string }> = [];

    for (const candidate of candidateFacebookAccounts) {
      if (!candidate.accessToken) continue;
      const adsAccessToken = candidate.refreshToken ?? candidate.accessToken;
      const candidateAdAccounts = await fetchAdAccountsDetailed(adsAccessToken);
      if (candidateAdAccounts.length === 0) continue;
      facebookAccount = candidate;
      adAccounts = candidateAdAccounts;
      break;
    }

    const adAccountIds = adAccounts.map((account) => account.id);

    if (adAccountIds.length === 0) {
      return NextResponse.json(
        {
          error:
            "Nenhuma conta de anuncios encontrada neste token do Facebook. Reconecte uma conta com ads_read, ads_management e business_management no Facebook Login de Ads.",
        },
        { status: 404 }
      );
    }


    const adAccountId = adAccountIdParam && adAccountIds.includes(adAccountIdParam) ? adAccountIdParam : adAccountIds[0];
    const [dailyInsights, campaigns] = await Promise.all([
      fetchAccountInsights(facebookAccount.refreshToken ?? facebookAccount.accessToken, adAccountId, since, until),
      fetchCampaigns(facebookAccount.refreshToken ?? facebookAccount.accessToken, adAccountId, since, until),
    ]);

    const chartData = dailyInsights.map((d: any) => ({
      date: new Date(d.date_start).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
      spend: parseFloat(d.spend || "0"),
      impressoes: parseInt(d.impressions || "0"),
      cliques: parseInt(d.clicks || "0"),
      ctr: parseFloat(d.ctr || "0"),
      cpm: parseFloat(d.cpm || "0"),
      cpc: parseFloat(d.cpc || "0"),
    }));

    const totals = dailyInsights.reduce(
      (acc: any, d: any) => ({
        spend: acc.spend + parseFloat(d.spend || "0"),
        impressions: acc.impressions + parseInt(d.impressions || "0"),
        clicks: acc.clicks + parseInt(d.clicks || "0"),
      }),
      { spend: 0, impressions: 0, clicks: 0 }
    );

    const campaignData = campaigns
      .map((c: any) => {
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
      })
      .sort((a: any, b: any) => b.spend - a.spend);

    return NextResponse.json({
      adAccountId,
      sourceFacebookAccountId: facebookAccount.id,
      sourceFacebookAccountName: facebookAccount.name,
      adAccounts,
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
