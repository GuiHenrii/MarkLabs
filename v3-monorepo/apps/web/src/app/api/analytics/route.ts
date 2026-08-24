import { NextResponse } from "next/server";
import { prisma } from "@marklabs/database";
import { apiErrorResponse, requireTeamAccess } from "@/lib/authorization";
import { FacebookProvider, InstagramProvider } from "@marklabs/social";

export async function GET(request: Request) {
  const teamId = new URL(request.url).searchParams.get("teamId");
  if (!teamId) return NextResponse.json({ error: "TeamId é obrigatório." }, { status: 400 });
  try {
    await requireTeamAccess(teamId);
    const socialAccounts = await prisma.socialAccount.findMany({
      where: { teamId, isActive: true }, select: { id: true, platform: true, name: true, platformId: true, accessToken: true },
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0); // Data normalizada sem horário

    // Coleta on-demand caso o banco esteja vazio ou não tenha o registro de hoje
    for (const account of socialAccounts) {
      if (!account.accessToken) continue;

      const hasTodayAnalytics = await prisma.analytics.findFirst({
        where: {
          socialAccountId: account.id,
          date: today,
        },
      });

      if (!hasTodayAnalytics) {
        const appId = process.env.META_APP_ID;
        const appSecret = process.env.META_APP_SECRET;
        let provider = null;

        if (account.platform === "FACEBOOK" && appId && appSecret) {
          provider = new FacebookProvider(appId, appSecret);
        } else if (account.platform === "INSTAGRAM" && appId && appSecret) {
          provider = new InstagramProvider(appId, appSecret);
        }

        if (provider) {
          try {
            const metrics = await provider.getAnalytics(account.accessToken, account.platformId);
            
            await prisma.analytics.upsert({
              where: {
                socialAccountId_date: {
                  socialAccountId: account.id,
                  date: today,
                },
              },
              update: {
                ...metrics,
              },
              create: {
                socialAccountId: account.id,
                date: today,
                ...metrics,
              },
            });
          } catch (err) {
            console.error(`[ANALYTICS SYNC ERROR] Falha ao coletar métricas para ${account.name}:`, err);
          }
        }
      }
    }

    const records = await prisma.analytics.findMany({
      where: { socialAccountId: { in: socialAccounts.map((account) => account.id) } },
      orderBy: { date: "asc" },
      take: 30,
      include: { socialAccount: { select: { platform: true } } },
    });

    const latestFollowers = new Map<string, number>();
    records.forEach(record => {
      latestFollowers.set(record.socialAccountId, record.followers);
    });
    const currentFollowers = Array.from(latestFollowers.values()).reduce((sum, val) => sum + val, 0);

    const summary = records.reduce((total, record) => ({
      reach: total.reach + record.reach,
      engagement: total.engagement + record.engagement,
      shares: total.shares + record.shares,
    }), { reach: 0, engagement: 0, shares: 0 });

    const finalSummary = { ...summary, followers: currentFollowers };

    return NextResponse.json({ summary: finalSummary, records, connectedAccounts: socialAccounts });
  } catch (error) {
    const result = apiErrorResponse(error);
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
}
