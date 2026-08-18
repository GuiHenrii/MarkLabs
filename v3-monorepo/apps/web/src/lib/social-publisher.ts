import { Platform, PostStatus, prisma } from "@marklabs/database";
import { FacebookProvider, InstagramProvider, LinkedInProvider, PublishInput } from "@marklabs/social";

function resolveMediaUrl(url: string) {
  if (/^https?:\/\//i.test(url)) return url;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL;
  if (!baseUrl) return url;
  return new URL(url, baseUrl).toString();
}

function getProvider(platform: Platform) {
  if (platform === Platform.FACEBOOK) {
    const appId = process.env.META_APP_ID;
    const appSecret = process.env.META_APP_SECRET;
    if (!appId || !appSecret) throw new Error("Meta não configurada.");
    return new FacebookProvider(appId, appSecret);
  }

  if (platform === Platform.INSTAGRAM) {
    const appId = process.env.META_APP_ID;
    const appSecret = process.env.META_APP_SECRET;
    if (!appId || !appSecret) throw new Error("Meta não configurada.");
    return new InstagramProvider(appId, appSecret);
  }

  if (platform === Platform.LINKEDIN) {
    const clientId = process.env.LINKEDIN_CLIENT_ID;
    const clientSecret = process.env.LINKEDIN_CLIENT_SECRET;
    if (!clientId || !clientSecret) throw new Error("LinkedIn não configurado.");
    return new LinkedInProvider(clientId, clientSecret);
  }

  throw new Error(`Plataforma ${platform} não suportada.`);
}

export async function publishPost(postId: string) {
  const post = (await prisma.post.findUnique({
    where: { id: postId },
    include: {
      socialAccount: true,
      media: { orderBy: { order: "asc" } },
    },
  })) as any;

  if (!post) throw new Error("Post não encontrado.");
  if (post.status === PostStatus.PUBLISHED) return post;

  const provider = getProvider(post.socialAccount.platform);
  const input: PublishInput = {
    content: post.content,
    postType: post.postType as "POST" | "REEL" | "STORY" | "CAROUSEL",
    media: (post.media as Array<{ url: string; type: "IMAGE" | "VIDEO" }>).map((media) => ({
      url: resolveMediaUrl(media.url),
      type: media.type,
    })),
  };

  await prisma.post.update({
    where: { id: post.id },
    data: { status: PostStatus.PUBLISHING, errorMessage: null },
  });

  const result = await provider.publish(post.socialAccount.accessToken, post.socialAccount.platformId, input);

  if (!result.success) {
    await prisma.post.update({
      where: { id: post.id },
      data: { status: PostStatus.FAILED, errorMessage: result.error ?? "Falha ao publicar." },
    });
    return post;
  }

  await prisma.post.update({
    where: { id: post.id },
    data: {
      status: PostStatus.PUBLISHED,
      publishedAt: new Date(),
      platformPostId: result.providerPostId ?? null,
      errorMessage: null,
    },
  });

  return post;
}

export async function publishDuePosts(limit = 20) {
  const duePosts = await prisma.post.findMany({
    where: {
      status: PostStatus.SCHEDULED,
      scheduledAt: { lte: new Date() },
    },
    take: limit,
    orderBy: { scheduledAt: "asc" },
    select: { id: true },
  });

  const results = [];
  for (const item of duePosts) {
    try {
      results.push({ postId: item.id, ok: true });
      await publishPost(item.id);
    } catch (error) {
      results.push({
        postId: item.id,
        ok: false,
        error: error instanceof Error ? error.message : "Erro desconhecido",
      });
      await prisma.post.update({
        where: { id: item.id },
        data: {
          status: PostStatus.FAILED,
          errorMessage: error instanceof Error ? error.message : "Erro desconhecido",
        },
      });
    }
  }

  return results;
}
