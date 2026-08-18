import { NextResponse } from "next/server";
import { prisma, PostStatus } from "@marklabs/database";
import { FacebookProvider, InstagramProvider } from "@marklabs/social";
import { apiErrorResponse, requireTeamAccess } from "@/lib/authorization";

export async function GET(request: Request) {
  const teamId = new URL(request.url).searchParams.get("teamId");
  if (!teamId) return NextResponse.json({ error: "TeamId é obrigatório." }, { status: 400 });
  try {
    await requireTeamAccess(teamId);
    const [socialAccounts, scheduledPosts, publishedPosts, recentPosts] = await Promise.all([
      prisma.socialAccount.findMany({
        where: { teamId, isActive: true },
        select: { id: true, platform: true, name: true, username: true, avatar: true, platformId: true, accessToken: true, tokenExpiry: true },
        orderBy: { createdAt: "desc" },
      }),
      prisma.post.count({ where: { teamId, status: PostStatus.SCHEDULED } }),
      prisma.post.count({ where: { teamId, status: PostStatus.PUBLISHED } }),
      prisma.post.findMany({ where: { teamId }, take: 5, orderBy: { createdAt: "desc" }, include: { socialAccount: true } }),
    ]);

    const metaAppId = process.env.META_APP_ID;
    const metaAppSecret = process.env.META_APP_SECRET;
    const [facebookProvider, instagramProvider] =
      metaAppId && metaAppSecret
        ? [new FacebookProvider(metaAppId, metaAppSecret), new InstagramProvider(metaAppId, metaAppSecret)]
        : [null, null];

    const liveMetrics = await Promise.all(
      socialAccounts.map(async (account) => {
        if (!account.accessToken) return null;
        try {
          if (account.platform === "FACEBOOK" && facebookProvider) {
            return { accountId: account.id, platform: account.platform, metrics: await facebookProvider.getAnalytics(account.accessToken, account.platformId) };
          }
          if (account.platform === "INSTAGRAM" && instagramProvider) {
            return { accountId: account.id, platform: account.platform, metrics: await instagramProvider.getAnalytics(account.accessToken, account.platformId) };
          }
          return null;
        } catch (error) {
          console.error(`[DASHBOARD METRICS] Failed to load ${account.platform} analytics for account ${account.id}:`, error);
          return null;
        }
      })
    );

    const records = await prisma.analytics.findMany({
      where: { socialAccountId: { in: socialAccounts.map((account) => account.id) } },
      orderBy: { date: "asc" },
    });

    const latestByAccount = new Map<string, (typeof records)[number]>();
    for (const record of records) latestByAccount.set(record.socialAccountId, record);

    const connectedAccounts = socialAccounts.length;
    const latestTotals = liveMetrics.filter(Boolean).map((entry) => entry!.metrics);
    const totals = latestTotals.reduce(
      (acc, record) => ({
        followers: acc.followers + record.followers,
        reach: acc.reach + record.reach,
        engagement: acc.engagement + record.engagement,
        shares: acc.shares + record.shares,
        likes: acc.likes + record.likes,
        comments: acc.comments + record.comments,
        impressions: acc.impressions + record.impressions,
      }),
      { followers: 0, reach: 0, engagement: 0, shares: 0, likes: 0, comments: 0, impressions: 0 }
    );

    const byPlatform = socialAccounts.reduce<Record<string, { followers: number; reach: number; engagement: number }>>(
      (acc, account) => {
        const record = liveMetrics.find((item) => item?.accountId === account.id)?.metrics ?? latestByAccount.get(account.id);
        const key = account.platform.toLowerCase();
        acc[key] ??= { followers: 0, reach: 0, engagement: 0 };
        if (record) {
          acc[key].followers += record.followers;
          acc[key].reach += record.reach;
          acc[key].engagement += record.engagement;
        }
        return acc;
      },
      {}
    );

    const last7Days = [...new Set(records.map((record) => record.date.toISOString().slice(0, 10)))].slice(-7);
    const engagementSeries = last7Days.map((day) => {
      const dayRecords = records.filter((record) => record.date.toISOString().slice(0, 10) === day);
      const row: Record<string, number | string> = {
        day: new Date(`${day}T00:00:00`).toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", ""),
      };
      for (const account of socialAccounts) {
        const platformKey = account.platform.toLowerCase();
        row[platformKey] = dayRecords
          .filter((record) => record.socialAccountId === account.id)
          .reduce((sum, record) => sum + record.engagement, 0);
      }
      return row;
    });

    const monthlyFollowerTotals = new Map<string, number>();
    for (const record of records) {
      const monthKey = record.date.toISOString().slice(0, 7);
      const current = monthlyFollowerTotals.get(monthKey) ?? 0;
      monthlyFollowerTotals.set(monthKey, Math.max(current, record.followers));
    }
    const followersSeries = [...monthlyFollowerTotals.entries()].slice(-6).map(([month, followers]) => ({
      month: new Date(`${month}-01T00:00:00`).toLocaleDateString("pt-BR", { month: "short" }).replace(".", ""),
      seguidores: followers,
    }));

    return NextResponse.json({
      connectedAccounts,
      scheduledPosts,
      publishedPosts,
      recentPosts,
      totals,
      byPlatform,
      engagementSeries,
      followersSeries,
      accounts: socialAccounts,
    });
  } catch (error) {
    const result = apiErrorResponse(error);
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
}
