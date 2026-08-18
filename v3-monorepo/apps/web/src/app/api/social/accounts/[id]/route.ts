import { NextResponse } from "next/server";
import { prisma } from "@marklabs/database";
import { requireTeamAccess } from "@/lib/authorization";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const accountId = id;
    const account = await prisma.socialAccount.findUnique({
      where: { id: accountId },
      select: { teamId: true },
    });

    if (!account) {
      return NextResponse.json({ error: "Conta não encontrada." }, { status: 404 });
    }

    await requireTeamAccess(account.teamId, "settings:manage");

    await prisma.socialAccount.delete({
      where: { id: accountId },
    });

    return NextResponse.json({ message: "Conta desconectada com sucesso." });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Erro interno." }, { status: 500 });
  }
}
