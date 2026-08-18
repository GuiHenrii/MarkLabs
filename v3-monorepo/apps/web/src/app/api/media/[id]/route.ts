import { NextResponse } from "next/server";
import { prisma } from "@marklabs/database";
import { deleteFromR2 } from "@/lib/r2";
import { apiErrorResponse, requireTeamAccess } from "@/lib/authorization";

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const url = new URL(request.url);
  const teamId = url.searchParams.get("teamId");
  if (!teamId) return NextResponse.json({ error: "TeamId é obrigatório." }, { status: 400 });

  const { id } = await params;

  try {
    await requireTeamAccess(teamId, "settings:manage");
    const media = await prisma.mediaFile.findFirst({ where: { id, teamId } });
    if (!media) return NextResponse.json({ error: "Mídia não encontrada." }, { status: 404 });

    await deleteFromR2(media.publicId);

    await prisma.mediaFile.delete({
      where: {
        id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const result = apiErrorResponse(error);
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
}
