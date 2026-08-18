import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { prisma, type Prisma } from "@marklabs/database";
import { auth } from "@/auth";
import { ApiError, requireCurrentUserId } from "@/lib/authorization";
import { z } from "zod";

const teamInclude = { team: { include: { _count: { select: { members: true, socialAccounts: true } } } } } as const;

function responseError(error: unknown, context: string) {
  console.error(`[${context}]`, error);
  if (error instanceof ApiError) return NextResponse.json({ error: error.message }, { status: error.status });
  return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 });
}

type TeamMembership = Prisma.TeamMemberGetPayload<{ include: typeof teamInclude }>;

function toTeams(memberships: TeamMembership[]) {
  return memberships.map((membership) => ({
    id: membership.team.id, name: membership.team.name, slug: membership.team.slug,
    logo: membership.team.logo, plan: membership.team.plan, role: membership.role,
    membersCount: membership.team._count.members, accountsCount: membership.team._count.socialAccounts,
  }));
}

// Zod schemas for validation
const createTeamSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").max(100, "Nome deve ter no máximo 100 caracteres").trim(),
});

export async function GET() {
  try {
    const userId = await requireCurrentUserId();
    
    let memberships = await prisma.teamMember.findMany({
      where: { userId },
      include: teamInclude
    });
    if (!memberships.length) {
      const user = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } });
      const name = user?.name?.trim() || "Meu workspace";
      const baseSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "workspace";
      await prisma.team.create({ data: { name, slug: `${baseSlug}-${randomUUID().slice(0, 8)}`, members: { create: { userId, role: "ADMIN" } } } });
      memberships = await prisma.teamMember.findMany({ where: { userId }, include: teamInclude });
    }
    return NextResponse.json({ teams: toTeams(memberships) });
  } catch (error) {
    return responseError(error, "TEAMS GET ERROR");
  }
}

export async function POST(request: Request) {
  try {
    console.log('[TEAMS POST] Incoming request to create team');
    const userId = await requireCurrentUserId();
    
    const body = await request.json();
    const validation = createTeamSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error.issues[0].message }, { status: 400 });
    }
    const { name } = validation.data;
    
    const baseSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "workspace";
    const team = await prisma.team.create({ data: { name, slug: `${baseSlug}-${randomUUID().slice(0, 8)}`, members: { create: { userId, role: "ADMIN" } } } });
    return NextResponse.json({ team: { id: team.id, name: team.name, slug: team.slug } }, { status: 201 });
  } catch (error) {
    // Prisma unique constraint (e.g., slug) or other known errors
    console.error('[TEAMS POST ERROR]', error);
    const errAny = error as any;
    if (errAny?.code === 'P2002') {
      return NextResponse.json({ error: 'Conflito de dados (provavelmente slug existente). Tente outro nome.' }, { status: 409 });
    }
    return responseError(error, "TEAMS POST ERROR");
  }
}
