import { NextResponse } from "next/server";
import { Resend } from "resend";
import { prisma } from "@marklabs/database";
import { apiErrorResponse, requireTeamAccess } from "@/lib/authorization";
import { buildInviteEmail } from "@/lib/emails/invite-template";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: teamId } = await params;
    const { userId } = await requireTeamAccess(teamId, "settings:manage");

    const { email, role } = await request.json();
    if (!email || !role) {
      return NextResponse.json({ error: "Email e role são obrigatórios." }, { status: 400 });
    }

    // Busca dados da equipe e do usuário que está convidando
    const [team, inviter] = await Promise.all([
      prisma.team.findUnique({ where: { id: teamId }, select: { name: true } }),
      prisma.user.findUnique({ where: { id: userId }, select: { name: true, email: true } }),
    ]);

    if (!team) {
      return NextResponse.json({ error: "Equipe não encontrada." }, { status: 404 });
    }

    const teamName = team.name ?? "sua equipe";
    const inviterName = inviter?.name ?? inviter?.email ?? "Um membro da equipe";

    // URL de aceite do convite (direciona para o fluxo de cadastro/login)
    const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
    const inviteUrl = `${baseUrl}/invite?teamId=${teamId}&email=${encodeURIComponent(email)}&role=${role}`;

    // Envia o email via Resend
    const { error } = await resend.emails.send({
      from: "MarkLabs <onboarding@resend.dev>",
      to: [email],
      subject: `${inviterName} te convidou para a equipe ${teamName} no MarkLabs`,
      html: buildInviteEmail({ teamName, inviterName, role, inviteUrl }),
    });

    if (error) {
      console.error("[INVITE EMAIL] Erro ao enviar:", error);
      return NextResponse.json({ error: "Erro ao enviar o email de convite." }, { status: 500 });
    }

    console.log(`[INVITE] Email enviado para ${email} (${role}) na equipe ${teamName}`);
    return NextResponse.json({ success: true, message: "Convite enviado com sucesso!" });
  } catch (error: any) {
    const result = apiErrorResponse(error);
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
}
