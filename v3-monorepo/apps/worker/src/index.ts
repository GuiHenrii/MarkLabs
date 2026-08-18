import "dotenv/config";
import { prisma, PostStatus, OutboxStatus } from "@marklabs/database";
import { FacebookProvider } from "@marklabs/social";
import { Worker, Job } from "bullmq";
import IORedis from "ioredis";
import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 1.0,
});

const REDIS_URL = process.env.REDIS_URL || "redis://127.0.0.1:6379";
const connection = new IORedis(REDIS_URL, { maxRetriesPerRequest: null });

function log(level: "INFO" | "WARN" | "ERROR", message: string, meta?: Record<string, unknown>) {
  console.log(JSON.stringify({ timestamp: new Date().toISOString(), level, service: "marklabs-worker", message, ...meta }));
}

async function publishPost(postId: string) {
  const post = await prisma.post.findUnique({ where: { id: postId }, include: { socialAccount: true } });
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
  const result = await provider.publish(post.socialAccount.accessToken, post.socialAccount.platformId, post.content);
  if (!result.success) throw new Error(result.error || "A publicação falhou.");
  await prisma.post.update({ where: { id: post.id }, data: { status: PostStatus.PUBLISHED, platformPostId: result.providerPostId, publishedAt: new Date(), errorMessage: null } });
  log("INFO", "Post publicado", { postId, platformPostId: result.providerPostId });
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
export default worker;
