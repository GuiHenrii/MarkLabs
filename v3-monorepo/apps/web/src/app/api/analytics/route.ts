import { NextResponse } from "next/server";
import { prisma } from "@marklabs/database";
import { apiErrorResponse, requireTeamAccess } from "@/lib/authorization";
import { FacebookProvider, InstagramProvider } from "@marklabs/social";

function periodToDays(period: string) {
  if (period === "7 dias") return 7;
  if (period === "90 dias") return 90;
  if (period === "6 meses") return 180;
  return 30;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const teamId = searchParams.get("teamId");
  const accountIds = searchParams.getAll("accountIds");
  const period = searchParams.get("period") ?? "30 dias";

  if (!teamId) return NextResponse.json({ error: "TeamId é obrigatório." }, { status: 400 });

  try {
    await requireTeamAccess(teamId);

    const socialAccounts = await prisma.socialAccount.findMany({
      where: {
        teamId,
        isActive: true,
        ...(accountIds.length > 0 ? { id: { in: accountIds } } : {}),
      },
      select: { id: true, platform: true, name: true, platformId: true, accessToken: true },
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const since = new Date(today);
    since.setDate(since.getDate() - periodToDays(period));

    const metaAppId = process.env.META_APP_ID;
    const metaAppSecret = process.env.META_APP_SECRET;
    const [facebookProvider, instagramProvider] =
      metaAppId && metaAppSecret
        ? [new FacebookProvider(metaAppId, metaAppSecret), new InstagramProvider(metaAppId, metaAppSecret)]
        : [null, null];

    const warnings: string[] = [];

    const liveMetrics = await Promise.all(
      socialAccounts.map(async (account) => {
        if (!account.accessToken) {
          warnings.push(`${account.name}: sem access token.`);
          return null;
        }

        try {
          if (account.platform === "FACEBOOK" && facebookProvider) {
            const metrics = await facebookProvider.getAnalytics(account.accessToken, account.platformId, since);
            if (metrics.warnings?.length) warnings.push(`${account.name}: ${metrics.warnings.join(" ")}`);
            return { accountId: account.id, metrics };
          }

          if (account.platform === "INSTAGRAM" && instagramProvider) {
            const metrics = await instagramProvider.getAnalytics(account.accessToken, account.platformId);
            if (metrics.warnings?.length) warnings.push(`${account.name}: ${metrics.warnings.join(" ")}`);
            return { accountId: account.id, metrics };
          }

          warnings.push(`${account.name}: plataforma sem coletor de analytics.`);
          return null;
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          warnings.push(`${account.name}: falha ao coletar analytics (${message}).`);
          console.error(`[ANALYTICS LIVE ERROR] Falha ao coletar métricas para ${account.name}:`, error);
          return null;
        }
      })
    );

    for (const entry of liveMetrics) {
      if (!entry) continue;
      const { warnings: _warnings, ...persistableMetrics } = entry.metrics;
      await prisma.analytics.upsert({
        where: {
          socialAccountId_date: {
            socialAccountId: entry.accountId,
            date: today,
          },
        },
        update: { ...persistableMetrics },
        create: {
          socialAccountId: entry.accountId,
          date: today,
          ...persistableMetrics,
        },
      });
    }

    const records = await prisma.analytics.findMany({
      where: {
        socialAccountId: { in: socialAccounts.map((account) => account.id) },
        date: { gte: since, lte: today },
      },
      orderBy: { date: "asc" },
      include: { socialAccount: { select: { platform: true } } },
    });

    const latestByAccount = new Map<string, (typeof records)[number]>();
    for (const record of records) latestByAccount.set(record.socialAccountId, record);

    const recordsWithLive = [...records];
    for (const entry of liveMetrics) {
      if (!entry) continue;
      if (!recordsWithLive.some((record) => record.socialAccountId === entry.accountId && record.date.getTime() === today.getTime())) {
        recordsWithLive.push({
          id: `live-${entry.accountId}`,
          socialAccountId: entry.accountId,
          date: today,
          followers: entry.metrics.followers,
          impressions: entry.metrics.impressions,
          reach: entry.metrics.reach,
          engagement: entry.metrics.engagement,
          likes: entry.metrics.likes,
          comments: entry.metrics.comments,
          shares: entry.metrics.shares,
          createdAt: today,
          socialAccount: { platform: socialAccounts.find((account) => account.id === entry.accountId)?.platform ?? null } as any,
        });
      }
    }

    const latestFollowers = new Map<string, number>();
    recordsWithLive.forEach((record) => {
      latestFollowers.set(record.socialAccountId, record.followers);
    });

    const currentFollowers = Array.from(latestFollowers.values()).reduce((sum, val) => sum + val, 0);

    const summary = socialAccounts.reduce(
      (total, account) => {
        const record = liveMetrics.find((item) => item?.accountId === account.id)?.metrics ?? latestByAccount.get(account.id);
        if (!record) return total;
        return {
          reach: total.reach + record.reach,
          engagement: total.engagement + record.engagement,
          shares: total.shares + record.shares,
        };
      },
      { reach: 0, engagement: 0, shares: 0 }
    );

    const recordsByDay = recordsWithLive.sort((a, b) => a.date.getTime() - b.date.getTime());

    return NextResponse.json({
      summary: { ...summary, followers: currentFollowers },
      records: recordsByDay,
      connectedAccounts: socialAccounts,
      warnings: Array.from(new Set(warnings)),
      period,
    });
  } catch (error) {
    const result = apiErrorResponse(error);
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
}
