import { NextResponse } from "next/server";
import { prisma, MediaType } from "@marklabs/database";
import { cloudinary } from "@/lib/cloudinary";
import { apiErrorResponse, requireTeamAccess } from "@/lib/authorization";

const MAX_FILE_SIZE = 20 * 1024 * 1024;
const ACCEPTED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif", "video/mp4", "video/webm"]);

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const teamId = formData.get("teamId");
    if (!(file instanceof File) || typeof teamId !== "string") return NextResponse.json({ error: "Arquivo e TeamId são obrigatórios." }, { status: 400 });
    if (!ACCEPTED_TYPES.has(file.type) || file.size > MAX_FILE_SIZE) return NextResponse.json({ error: "Arquivo inválido ou maior que 20 MB." }, { status: 400 });
    await requireTeamAccess(teamId, "posts:create");
    const folder = String(formData.get("folder") || "Geral").replace(/[^a-zA-Z0-9_-]/g, "-").slice(0, 80);
    const tags = String(formData.get("tags") || "").split(",").map((tag) => tag.trim()).filter(Boolean).slice(0, 20);
    const base64 = `data:${file.type};base64,${Buffer.from(await file.arrayBuffer()).toString("base64")}`;
    const upload = await cloudinary.uploader.upload(base64, { folder: `marklabs/${teamId}/${folder}`, resource_type: "auto" });
    const media = await prisma.mediaFile.create({ data: {
      teamId, name: file.name.slice(0, 255), url: upload.secure_url, publicId: upload.public_id,
      type: file.type.startsWith("video/") ? MediaType.VIDEO : MediaType.IMAGE, size: file.size,
      width: upload.width ?? null, height: upload.height ?? null, folder, tags,
    }});
    return NextResponse.json(media, { status: 201 });
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
    return NextResponse.json(await prisma.mediaFile.findMany({ where: { teamId }, orderBy: { createdAt: "desc" } }));
  } catch (error) {
    const result = apiErrorResponse(error);
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
}
