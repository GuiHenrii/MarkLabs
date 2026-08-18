import { NextResponse } from "next/server";
import { prisma } from "@marklabs/database";
import { apiErrorResponse, requireTeamAccess } from "@/lib/authorization";

export async function GET(request: Request) {
  const teamId = new URL(request.url).searchParams.get("teamId");
  if (!teamId) return NextResponse.json({ error: "TeamId é obrigatório." }, { status: 400 });
  try {
    await requireTeamAccess(teamId);
    const socialAccounts = await prisma.socialAccount.findMany({
      where: { teamId, isActive: true }, select: { id: true, platform: true, name: true },
    });
    const records = await prisma.analytics.findMany({
      where: { socialAccountId: { in: socialAccounts.map((account) => account.id) } },
      orderBy: { date: "asc" }, take: 30,
    });
    const summary = records.reduce((total, record) => ({
      followers: total.followers + record.followers,
      reach: total.reach + record.reach,
      engagement: total.engagement + record.engagement,
      shares: total.shares + record.shares,
    }), { followers: 0, reach: 0, engagement: 0, shares: 0 });
    return NextResponse.json({ summary, records, connectedAccounts: socialAccounts });
  } catch (error) {
    const result = apiErrorResponse(error);
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
}
