import { NextResponse } from "next/server";
import { prisma, PostStatus } from "@marklabs/database";
import { apiErrorResponse, requireTeamAccess } from "@/lib/authorization";
import { publishPost } from "@/lib/social-publisher";
import { z } from "zod";

function isMediaUrl(value: string) {
  if (!value.trim()) return false;
  if (value.startsWith("/api/media/")) return true;
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export const maxDuration = 120; // Permite até 2 minutos, útil para upload de vídeos para a Meta

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const postSchema = z.object({
      teamId: z.string().min(1, "teamId é obrigatório"),
      socialAccountId: z.string().min(1, "socialAccountId é obrigatório"),
      content: z.string().min(1, "Conteúdo é obrigatório").max(63206, "Conteúdo excede o limite permitido"),
      scheduledAt: z.string().nullable().optional(),
      isPublishNow: z.boolean().optional(),
      postType: z.enum(["POST", "REEL", "STORY", "CAROUSEL"]).optional(),
      media: z.array(z.object({
        url: z.string().refine(isMediaUrl, "URL de mídia inválida"),
        type: z.enum(["IMAGE", "VIDEO"]),
        order: z.number().optional(),
      })).optional(),
    });
    const validation = postSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error.issues[0].message }, { status: 400 });
    }
    const { teamId, socialAccountId, content, scheduledAt, isPublishNow, media, postType } = validation.data;
    const { userId } = await requireTeamAccess(teamId, isPublishNow ? "posts:publish" : "posts:create");
    const account = await prisma.socialAccount.findFirst({ where: { id: socialAccountId, teamId, isActive: true }, select: { id: true } });
    if (!account) return NextResponse.json({ error: "Conta social não encontrada nesta equipe." }, { status: 400 });
    const publishAt = scheduledAt ? new Date(scheduledAt) : null;
    if (scheduledAt && Number.isNaN(publishAt?.getTime())) return NextResponse.json({ error: "Data de agendamento inválida." }, { status: 400 });
    if (publishAt && publishAt <= new Date()) return NextResponse.json({ error: "O agendamento deve ser no futuro." }, { status: 400 });

    const result = await prisma.$transaction(async (tx) => {
      const post = await tx.post.create({
        data: {
          teamId,
          authorId: userId,
          socialAccountId,
          content: content.trim(),
          postType: postType ? (postType as any) : "POST",
          status: publishAt ? PostStatus.SCHEDULED : PostStatus.DRAFT,
          scheduledAt: publishAt,
          ...(media && Array.isArray(media) && media.length > 0
            ? {
                media: {
                  create: media.map((m: any, idx: number) => ({
                    url: m.url,
                    type: m.type === "VIDEO" ? "VIDEO" : "IMAGE",
                    order: typeof m.order === "number" ? m.order : idx,
                  })),
                },
              }
            : {}),
        } as any,
      });
      return { post };
    });

    if (isPublishNow) {
      await publishPost(result.post.id);
      const publishedPost = await prisma.post.findUnique({
        where: { id: result.post.id },
        include: {
          socialAccount: { select: { name: true, platform: true, avatar: true } },
          author: { select: { name: true, image: true } },
          media: true,
        },
      });
      
      if (publishedPost?.status === "FAILED") {
        return NextResponse.json({ error: publishedPost.errorMessage || "Falha ao publicar." }, { status: 400 });
      }
      
      return NextResponse.json(publishedPost, { status: 201 });
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
