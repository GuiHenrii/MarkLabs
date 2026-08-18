import { GetObjectCommand } from "@aws-sdk/client-s3";
import { prisma } from "@marklabs/database";
import { apiErrorResponse, requireTeamAccess } from "@/lib/authorization";
import { getR2BucketName, getR2Client } from "@/lib/r2";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const url = new URL(request.url);
  const teamId = url.searchParams.get("teamId");
  if (!teamId) return new Response("TeamId é obrigatório.", { status: 400 });

  const { id } = await params;

  try {
    await requireTeamAccess(teamId);
    const media = await prisma.mediaFile.findFirst({ where: { id, teamId } });
    if (!media) return new Response("Mídia não encontrada.", { status: 404 });

    const client = getR2Client();
    const bucket = getR2BucketName();
    const result = await client.send(new GetObjectCommand({ Bucket: bucket, Key: media.publicId }));
    if (!result.Body) return new Response("Arquivo não encontrado.", { status: 404 });

    const headers = new Headers();
    headers.set("Content-Type", result.ContentType || (media.type === "VIDEO" ? "video/mp4" : "image/jpeg"));
    headers.set("Cache-Control", "public, max-age=31536000, immutable");

    return new Response(result.Body.transformToWebStream(), { headers });
  } catch (error) {
    const result = apiErrorResponse(error);
    return new Response(result.error, { status: result.status });
  }
}
