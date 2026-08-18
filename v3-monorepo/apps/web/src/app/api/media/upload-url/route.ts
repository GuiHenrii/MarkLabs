import { NextResponse } from "next/server";
import { apiErrorResponse, requireTeamAccess } from "@/lib/authorization";
import { buildMediaKey, createSignedUploadUrl } from "@/lib/r2";

const MAX_FILE_SIZE = 50 * 1024 * 1024;
const ACCEPTED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif", "video/mp4", "video/webm"]);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { teamId, fileName, contentType, contentLength, folder = "Geral" } = body ?? {};

    if (typeof teamId !== "string" || typeof fileName !== "string" || typeof contentType !== "string" || typeof contentLength !== "number") {
      return NextResponse.json({ error: "TeamId, nome, tipo e tamanho do arquivo são obrigatórios." }, { status: 400 });
    }

    if (!ACCEPTED_TYPES.has(contentType)) {
      return NextResponse.json({ error: "Tipo de arquivo inválido." }, { status: 400 });
    }

    if (contentLength > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "Arquivo maior que 50 MB." }, { status: 400 });
    }

    await requireTeamAccess(teamId, "posts:create");

    const safeFolder = String(folder).replace(/[^a-zA-Z0-9_-]/g, "-").slice(0, 80);
    const key = buildMediaKey(teamId, safeFolder, fileName);
    const signed = await createSignedUploadUrl({ key });

    return NextResponse.json({
      ...signed,
      folder: safeFolder,
      fileName,
      contentType,
    });
  } catch (error) {
    const result = apiErrorResponse(error);
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
}
