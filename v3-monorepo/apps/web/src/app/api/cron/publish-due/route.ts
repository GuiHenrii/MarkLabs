import { NextResponse } from "next/server";
import { publishDuePosts } from "@/lib/social-publisher";

export async function POST(request: Request) {
  const secret = request.headers.get("x-cron-secret") ?? new URL(request.url).searchParams.get("secret");
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results = await publishDuePosts();
  return NextResponse.json({ ok: true, results });
}
