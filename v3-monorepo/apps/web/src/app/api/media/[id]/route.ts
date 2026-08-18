import { NextResponse } from "next/server";
import { prisma } from "@marklabs/database";
import { apiErrorResponse, requireTeamAccess } from "@/lib/authorization";

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const url = new URL(request.url);
  const teamId = url.searchParams.get("teamId");
  if (!teamId) return NextResponse.json({ error: "TeamId é obrigatório." }, { status: 400 });

  const { id } = await params;

  try {
    await requireTeamAccess(teamId, "settings:manage"); // Ou outra permissão de mídia
    
    // Deleta o registro do banco
    await prisma.mediaFile.delete({
      where: {
        id: id,
        teamId: teamId
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const result = apiErrorResponse(error);
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
}
