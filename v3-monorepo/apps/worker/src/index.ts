import "dotenv/config";
import { prisma, PostStatus } from "@marklabs/database";
import { FacebookProvider, InstagramProvider, LinkedInProvider, AnalyticsSnapshot, SocialProvider } from "@marklabs/social";
import { Worker, Job } from "bullmq";
import IORedis from "ioredis";
import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 1.0,
});

const REDIS_URL = process.env.REDIS_URL || "redis://127.0.0.1:6379";
const connection = new IORedis(REDIS_URL, { maxRetriesPerRequest: null });
const ANALYTICS_REFRESH_MS = Number(process.env.ANALYTICS_REFRESH_MS || 15 * 60_000);

function log(level: "INFO" | "WARN" | "ERROR", message: string, meta?: Record<string, unknown>) {
  console.log(JSON.stringify({ timestamp: new Date().toISOString(), level, service: "marklabs-worker", message, ...meta }));
}

async function publishPost(postId: string) {
  const post = (await prisma.post.findUnique({
    where: { id: postId },
    include: { socialAccount: true, media: { orderBy: { order: "asc" } } },
  })) as any;
  if (!post) throw new Error("Post não encontrado.");
  if (post.status === PostStatus.PUBLISHED) return;
  await prisma.post.update({ where: { id: post.id }, data: { status: PostStatus.PUBLISHING } });
  
  let provider;
  const appId = process.env.META_APP_ID;
  const appSecret = process.env.META_APP_SECRET;

  if (post.socialAccount.platform === "FACEBOOK") {
    if (!appId || !appSecret) throw new Error("Credenciais Meta não configuradas.");
    provider = new FacebookProvider(appId, appSecret);
  } else if (post.socialAccount.platform === "INSTAGRAM") {
    if (!appId || !appSecret) throw new Error("Credenciais Meta não configuradas.");
    const { InstagramProvider } = await import("@marklabs/social");
    provider = new InstagramProvider(appId, appSecret);
  } else if (post.socialAccount.platform === "LINKEDIN") {
    const { LinkedInProvider } = await import("@marklabs/social");
    provider = new LinkedInProvider(process.env.LINKEDIN_CLIENT_ID!, process.env.LINKEDIN_CLIENT_SECRET!);
  } else {
    throw new Error(`Plataforma não suportada: ${post.socialAccount.platform}`);
  }
  const result = await provider.publish(post.socialAccount.accessToken, post.socialAccount.platformId, {
    content: post.content,
    postType: post.postType as "POST" | "REEL" | "STORY" | "CAROUSEL",
    media: (post.media as Array<{ url: string; type: "IMAGE" | "VIDEO" }>).map((media) => ({
      url: media.url,
      type: media.type,
    })),
  });
  if (!result.success) throw new Error(result.error || "A publicação falhou.");
  await prisma.post.update({ where: { id: post.id }, data: { status: PostStatus.PUBLISHED, platformPostId: result.providerPostId, publishedAt: new Date(), errorMessage: null } });
  log("INFO", "Post publicado", { postId, platformPostId: result.providerPostId });
}

function emptySnapshot(): AnalyticsSnapshot {
  return { followers: 0, impressions: 0, reach: 0, engagement: 0, likes: 0, comments: 0, shares: 0 };
}

async function collectAnalyticsForAccount(account: {
  id: string;
  platform: string;
  platformId: string;
  accessToken: string;
}) {
  const appId = process.env.META_APP_ID;
  const appSecret = process.env.META_APP_SECRET;
  const today = new Date();

  let provider: SocialProvider | null = null;
  if (account.platform === "FACEBOOK" && appId && appSecret) provider = new FacebookProvider(appId, appSecret);
  if (account.platform === "INSTAGRAM" && appId && appSecret) provider = new InstagramProvider(appId, appSecret);

  const metrics =
    provider && account.accessToken
      ? await provider.getAnalytics(account.accessToken, account.platformId).catch((error) => {
          log("WARN", "Analytics fetch failed", {
            socialAccountId: account.id,
            platform: account.platform,
            error: error instanceof Error ? error.message : String(error),
          });
          return emptySnapshot();
        })
      : emptySnapshot();

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

  return metrics;
}

async function refreshAnalytics() {
  const appId = process.env.META_APP_ID;
  const appSecret = process.env.META_APP_SECRET;
  if (!appId || !appSecret) {
    log("WARN", "Skipping analytics refresh because Meta credentials are missing");
    return;
  }

  const accounts = await prisma.socialAccount.findMany({
    where: {
      isActive: true,
      platform: { in: ["FACEBOOK", "INSTAGRAM"] },
    },
    select: {
      id: true,
      platform: true,
      platformId: true,
      accessToken: true,
    },
  });

  for (const account of accounts) {
    if (!account.accessToken) continue;
    try {
      const metrics = await collectAnalyticsForAccount({
        id: account.id,
        platform: account.platform,
        platformId: account.platformId,
        accessToken: account.accessToken,
      });
      log("INFO", "Analytics refreshed", { socialAccountId: account.id, platform: account.platform, metrics });
    } catch (error) {
      log("ERROR", "Failed to persist analytics", {
        socialAccountId: account.id,
        platform: account.platform,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
}

// Criar o Worker do BullMQ para processar publicações de posts
const worker = new Worker(
  "PostQueue",
  async (job: Job) => {
    const { postId } = job.data;
    log("INFO", `Iniciando processamento de job ${job.id}`, { postId });
    try {
      await publishPost(postId);
    } catch (error) {
      const reason = error instanceof Error ? error.message : "Erro desconhecido";
      log("ERROR", `Falha no processamento de job ${job.id}`, { postId, error: reason });
      Sentry.captureException(error, {
        extra: { jobId: job.id, postId },
      });
      throw error; // Repassar erro para o BullMQ gerenciar tentativas/backoff
    }
  },
  { connection }
);

worker.on("completed", (job) => {
  log("INFO", `Job ${job.id} concluído com sucesso`);
});

worker.on("failed", (job, error) => {
  log("ERROR", `Job ${job?.id} falhou: ${error.message}`);
});

log("INFO", "Worker BullMQ iniciado com sucesso!");

refreshAnalytics().catch((error) => {
  log("ERROR", "Initial analytics refresh failed", { error: error instanceof Error ? error.message : String(error) });
});

setInterval(() => {
  refreshAnalytics().catch((error) => {
    log("ERROR", "Scheduled analytics refresh failed", { error: error instanceof Error ? error.message : String(error) });
  });
}, ANALYTICS_REFRESH_MS);

export default worker;
