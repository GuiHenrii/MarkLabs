import { NextResponse } from "next/server";
import { prisma, PostStatus } from "@marklabs/database";
import { apiErrorResponse, requireTeamAccess } from "@/lib/authorization";

export async function GET(request: Request) {
  const teamId = new URL(request.url).searchParams.get("teamId");
  if (!teamId) return NextResponse.json({ error: "TeamId é obrigatório." }, { status: 400 });
  try {
    await requireTeamAccess(teamId);
    const [connectedAccounts, scheduledPosts, publishedPosts, recentPosts] = await Promise.all([
      prisma.socialAccount.count({ where: { teamId, isActive: true } }),
      prisma.post.count({ where: { teamId, status: PostStatus.SCHEDULED } }),
      prisma.post.count({ where: { teamId, status: PostStatus.PUBLISHED } }),
      prisma.post.findMany({ where: { teamId }, take: 5, orderBy: { createdAt: "desc" }, include: { socialAccount: true } }),
    ]);
    return NextResponse.json({ connectedAccounts, scheduledPosts, publishedPosts, recentPosts });
  } catch (error) {
    const result = apiErrorResponse(error);
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
}
