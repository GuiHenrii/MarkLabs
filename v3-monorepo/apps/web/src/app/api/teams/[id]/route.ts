import { auth } from "@/auth";
import { prisma } from "@marklabs/database";
import { NextResponse } from "next/server";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { name, logo } = body;

    // Verify user has access to this team (is admin)
    const teamMember = await prisma.teamMember.findFirst({
      where: {
        teamId: id,
        userId: session.user.id,
        role: "ADMIN",
      },
    });

    if (!teamMember) {
      return NextResponse.json(
        { error: "Não autorizado a atualizar este time." },
        { status: 403 }
      );
    }

    // Update team
    const updatedTeam = await prisma.team.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(logo && { logo }),
      },
    });

    return NextResponse.json({
      team: {
        id: updatedTeam.id,
        name: updatedTeam.name,
        slug: updatedTeam.slug,
        logo: updatedTeam.logo,
      },
    });
  } catch (error) {
    console.error("[TEAMS PATCH ERROR]", error);
    return NextResponse.json(
      { error: "Erro interno do servidor." },
      { status: 500 }
    );
  }
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }

    const { id } = await params;

    // Verify user has access to this team
    const teamMember = await prisma.teamMember.findFirst({
      where: {
        teamId: id,
        userId: session.user.id,
      },
    });

    if (!teamMember) {
      return NextResponse.json(
        { error: "Não autorizado a acessar este time." },
        { status: 403 }
      );
    }

    const team = await prisma.team.findUnique({
      where: { id },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
          },
        },
        _count: {
          select: {
            members: true,
            socialAccounts: true,
            posts: true,
          },
        },
      },
    });

    if (!team) {
      return NextResponse.json({ error: "Time não encontrado." }, { status: 404 });
    }

    return NextResponse.json({
      team: {
        id: team.id,
        name: team.name,
        slug: team.slug,
        logo: team.logo,
        plan: team.plan,
        membersCount: team._count.members,
        accountsCount: team._count.socialAccounts,
        postsCount: team._count.posts,
        members: team.members.map((member) => ({
          id: member.id,
          userId: member.userId,
          name: member.user.name ?? member.user.email,
          email: member.user.email,
          avatar: member.user.image ?? undefined,
          role: member.role,
          joinedAt: member.createdAt,
        })),
      },
    });
  } catch (error) {
    console.error("[TEAMS GET ERROR]", error);
    return NextResponse.json(
      { error: "Erro interno do servidor." },
      { status: 500 }
    );
  }
}
