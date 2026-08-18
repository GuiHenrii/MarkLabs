import { NextResponse } from "next/server";
import { prisma } from "@marklabs/database";
import { apiErrorResponse, requireTeamAccess } from "@/lib/authorization";
import { sendTeamInviteEmail } from "@/lib/email";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: teamId } = await params;
    const { userId } = await requireTeamAccess(teamId, "settings:manage");

    const { email, role } = await request.json();
    if (!email || !role) {
      return NextResponse.json({ error: "Email e role são obrigatórios." }, { status: 400 });
    }

    const [team, inviter] = await Promise.all([
      prisma.team.findUnique({ where: { id: teamId }, select: { name: true } }),
      prisma.user.findUnique({ where: { id: userId }, select: { name: true, email: true } }),
    ]);

    if (!team) {
      return NextResponse.json({ error: "Equipe não encontrada." }, { status: 404 });
    }

    const teamName = team.name ?? "sua equipe";
    const inviterName = inviter?.name ?? inviter?.email ?? "Um membro da equipe";
    const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
    const inviteUrl = `${baseUrl}/invite?teamId=${teamId}&email=${encodeURIComponent(email)}&role=${role}`;

    const { error } = await sendTeamInviteEmail(email, teamName, inviterName, role, inviteUrl);

    if (error) {
      console.error("[INVITE EMAIL] Erro ao enviar:", error);
      const errorMessage = typeof error === "object" && error && "message" in error ? String((error as { message?: unknown }).message ?? "") : "";
      if (errorMessage.includes("verify a domain") || errorMessage.includes("only send testing emails")) {
        return NextResponse.json(
          {
            error:
              "O Resend está em modo de teste. Para enviar convites para outras pessoas, você precisa verificar um domínio em resend.com/domains e usar esse domínio em EMAIL_FROM.",
          },
          { status: 403 }
        );
      }
      return NextResponse.json(
        {
          error:
            "Erro ao enviar o email de convite. Verifique RESEND_API_KEY e o remetente configurado em EMAIL_FROM.",
        },
        { status: 500 }
      );
    }

    console.log(`[INVITE] Email enviado para ${email} (${role}) na equipe ${teamName}`);
    return NextResponse.json({ success: true, message: "Convite enviado com sucesso!" });
  } catch (error: any) {
    const result = apiErrorResponse(error);
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
}
