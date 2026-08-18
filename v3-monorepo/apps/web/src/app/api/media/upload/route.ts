import { NextResponse } from "next/server";
import { prisma, MediaType } from "@marklabs/database";
import { apiErrorResponse, requireTeamAccess } from "@/lib/authorization";
import { uploadToR2 } from "@/lib/r2";

function getMediaUrl(teamId: string, id: string): string {
  return `/api/media/${id}/file?teamId=${encodeURIComponent(teamId)}`;
}

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type") || "";
    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("file");
      const teamId = formData.get("teamId");
      if (!(file instanceof File) || typeof teamId !== "string") {
        return NextResponse.json({ error: "Arquivo e TeamId são obrigatórios." }, { status: 400 });
      }

      await requireTeamAccess(teamId, "posts:create");
      const folder = String(formData.get("folder") || "Geral").replace(/[^a-zA-Z0-9_-]/g, "-").slice(0, 80);
      const tags = String(formData.get("tags") || "").split(",").map((tag) => tag.trim()).filter(Boolean).slice(0, 20);
      const key = String(formData.get("key") || `marklabs/${teamId}/${folder}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "-").slice(0, 80)}`);
      await uploadToR2(file, key);

      const media = await prisma.mediaFile.create({
        data: {
          teamId,
          name: file.name.slice(0, 255),
          url: getMediaUrl(teamId, key),
          publicId: key,
          type: file.type.startsWith("video/") ? MediaType.VIDEO : MediaType.IMAGE,
          size: file.size,
          width: null,
          height: null,
          folder,
          tags,
        },
      });

      return NextResponse.json({ ...media, url: getMediaUrl(teamId, media.id) }, { status: 201 });
    }

    const body = await request.json();
    const { teamId, name, url, publicId, type, size, width, height, folder = "Geral", tags = [] } = body ?? {};

    if (
      typeof teamId !== "string" ||
      typeof name !== "string" ||
      typeof url !== "string" ||
      typeof publicId !== "string" ||
      typeof type !== "string" ||
      typeof size !== "number"
    ) {
      return NextResponse.json({ error: "Dados de mídia inválidos." }, { status: 400 });
    }

    await requireTeamAccess(teamId, "posts:create");

    const media = await prisma.mediaFile.create({
      data: {
        teamId,
        name: name.slice(0, 255),
        url: url || getMediaUrl(teamId, publicId),
        publicId,
        type: type.startsWith("video/") ? MediaType.VIDEO : MediaType.IMAGE,
        size,
        width: typeof width === "number" ? width : null,
        height: typeof height === "number" ? height : null,
        folder: String(folder).slice(0, 80),
        tags: Array.isArray(tags) ? tags.filter((tag) => typeof tag === "string").slice(0, 20) : [],
      },
    });

    return NextResponse.json({ ...media, url: getMediaUrl(teamId, media.id) }, { status: 201 });
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
    const items = await prisma.mediaFile.findMany({ where: { teamId }, orderBy: { createdAt: "desc" } });
    return NextResponse.json(items.map((item) => ({ ...item, url: getMediaUrl(teamId, item.id) })));
  } catch (error) {
    const result = apiErrorResponse(error);
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
}
