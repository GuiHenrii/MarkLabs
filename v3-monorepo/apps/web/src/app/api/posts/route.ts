import { NextResponse } from "next/server";
import { prisma, PostStatus, OutboxStatus } from "@marklabs/database";
import { apiErrorResponse, requireTeamAccess } from "@/lib/authorization";
import { z } from "zod";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const postSchema = z.object({
      teamId: z.string().min(1, "teamId é obrigatório"),
      socialAccountId: z.string().min(1, "socialAccountId é obrigatório"),
      content: z.string().min(1, "Conteúdo é obrigatório").max(63206, "Conteúdo excede o limite permitido"),
      scheduledAt: z.string().nullable().optional(),
      isPublishNow: z.boolean().optional(),
      media: z.array(z.object({
        url: z.string().url("URL de mídia inválida"),
        type: z.enum(["IMAGE", "VIDEO"]),
        order: z.number().optional(),
      })).optional(),
    });
    const validation = postSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error.issues[0].message }, { status: 400 });
    }
    const { teamId, socialAccountId, content, scheduledAt, isPublishNow, media } = validation.data;
    const { userId } = await requireTeamAccess(teamId, isPublishNow ? "posts:publish" : "posts:create");
    const account = await prisma.socialAccount.findFirst({ where: { id: socialAccountId, teamId, isActive: true }, select: { id: true } });
    if (!account) return NextResponse.json({ error: "Conta social não encontrada nesta equipe." }, { status: 400 });
    const publishAt = scheduledAt ? new Date(scheduledAt) : null;
    if (scheduledAt && Number.isNaN(publishAt?.getTime())) return NextResponse.json({ error: "Data de agendamento inválida." }, { status: 400 });
    if (publishAt && publishAt <= new Date()) return NextResponse.json({ error: "O agendamento deve ser no futuro." }, { status: 400 });

    const result = await prisma.$transaction(async (tx) => {
      const post = await tx.post.create({
        data: {
          teamId, authorId: userId, socialAccountId, content: content.trim(),
          status: isPublishNow || publishAt ? PostStatus.SCHEDULED : PostStatus.DRAFT,
          scheduledAt: publishAt,
          ...(media && Array.isArray(media) && media.length > 0 ? {
            media: {
              create: media.map((m: any, idx: number) => ({
                url: m.url,
                type: m.type === "VIDEO" ? "VIDEO" : "IMAGE",
                order: typeof m.order === "number" ? m.order : idx,
              })),
            },
          } : {}),
        },
      });
      const outbox = isPublishNow ? await tx.outboxMessage.create({
        data: { eventType: "PUBLISH_POST", payload: { postId: post.id, teamId }, status: OutboxStatus.PENDING },
      }) : null;
      return { post, outbox };
    });

    if (isPublishNow) {
      const { postQueue } = await import("@/lib/queue");
      await postQueue.add("publish-post", { postId: result.post.id, teamId });
    }

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    const result = apiErrorResponse(error);
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
}

export async function GET(request: Request) {
  const teamId = new URL(request.url).searchParams.get("teamId");
  if (!teamId) return NextResponse.json({ error: "TeamId é obrigatório." }, { status: 400 });
  try {
    await requireTeamAccess(teamId);
    const posts = await prisma.post.findMany({
      where: { teamId },
      include: {
        socialAccount: { select: { name: true, platform: true, avatar: true } },
        author: { select: { name: true, image: true } }, media: true,
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(posts);
  } catch (error) {
    const result = apiErrorResponse(error);
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
}
