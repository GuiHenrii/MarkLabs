import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;
const bucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME || "marklabs";
const publicBaseUrl = process.env.CLOUDFLARE_R2_PUBLIC_URL?.replace(/\/$/, "");

function getClient() {
  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error("Credenciais do Cloudflare R2 não configuradas.");
  }

  return new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });
}

export function getR2Client() {
  return getClient();
}

export function buildMediaKey(teamId: string, folder: string, fileName: string): string {
  const extension = fileName.includes(".") ? fileName.split(".").pop() : "";
  const baseName = fileName.replace(/[^a-zA-Z0-9._-]/g, "-").slice(0, 80);
  const safeName = `${Date.now()}-${baseName}`;
  return `marklabs/${teamId}/${folder}/${safeName}${extension && !safeName.endsWith(`.${extension}`) ? `.${extension}` : ""}`;
}

export function getR2BucketName(): string {
  return bucketName;
}

export function getR2PublicUrl(key: string): string {
  if (publicBaseUrl) return `${publicBaseUrl}/${key}`;
  if (!accountId) throw new Error("CLOUDFLARE_ACCOUNT_ID não configurado.");
  return `https://pub-${bucketName}.${accountId}.r2.dev/${key}`;
}

export async function createSignedUploadUrl(input: {
  key: string;
}) {
  const client = getClient();
  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: input.key,
    CacheControl: "public, max-age=31536000, immutable",
  });

  const uploadUrl = await getSignedUrl(client, command, { expiresIn: 60 * 10 });
  return {
    uploadUrl,
    publicUrl: getR2PublicUrl(input.key),
    key: input.key,
  };
}

export async function createSignedReadUrl(key: string) {
  const client = getClient();
  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: key,
  });

  return getSignedUrl(client, command, { expiresIn: 60 * 30 });
}

export async function resolveR2MediaUrl(urlOrKey: string) {
  if (!urlOrKey) return urlOrKey;
  if (!urlOrKey.includes("r2")) return urlOrKey;

  try {
    const parsed = new URL(urlOrKey);
    const prefix = publicBaseUrl && parsed.origin === publicBaseUrl ? publicBaseUrl : undefined;
    const key = prefix ? parsed.pathname.replace(/^\//, "") : parsed.pathname.replace(/^\/+/, "");
    if (!key) return urlOrKey;
    return await createSignedReadUrl(key);
  } catch {
    return urlOrKey;
  }
}

export async function uploadToR2(file: File, key: string): Promise<void> {
  const client = getClient();
  await client.send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: Buffer.from(await file.arrayBuffer()),
      CacheControl: "public, max-age=31536000, immutable",
    })
  );
}

export async function deleteFromR2(key: string): Promise<void> {
  const client = getClient();
  await client.send(
    new DeleteObjectCommand({
      Bucket: bucketName,
      Key: key,
    })
  );
}
