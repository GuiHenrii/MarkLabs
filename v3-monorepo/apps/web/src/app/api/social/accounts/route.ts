import { NextResponse } from "next/server";
import { prisma } from "@marklabs/database";
import { apiErrorResponse, requireTeamAccess } from "@/lib/authorization";

export async function GET(request: Request) {
  const teamId = new URL(request.url).searchParams.get("teamId");
  if (!teamId) return NextResponse.json({ error: "TeamId é obrigatório." }, { status: 400 });
  try {
    await requireTeamAccess(teamId);
    const accounts = await prisma.socialAccount.findMany({
      where: { teamId, isActive: true },
      select: { id: true, platform: true, name: true, username: true, avatar: true, createdAt: true },
    });
    return NextResponse.json(accounts);
  } catch (error) {
    const result = apiErrorResponse(error);
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
}

export async function DELETE(request: Request) {
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID é obrigatório." }, { status: 400 });
  try {
    const account = await prisma.socialAccount.findUnique({ where: { id }, select: { teamId: true } });
    if (!account) return NextResponse.json({ error: "Conta não encontrada." }, { status: 404 });
    await requireTeamAccess(account.teamId, "settings:manage");
    await prisma.socialAccount.update({ where: { id }, data: { isActive: false } });
    return NextResponse.json({ success: true });
  } catch (error) {
    const result = apiErrorResponse(error);
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
}
