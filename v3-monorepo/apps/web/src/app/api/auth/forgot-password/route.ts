import { NextResponse } from "next/server";
import { prisma } from "@marklabs/database";
import { sendPasswordResetEmail } from "@/lib/email";
import crypto from "crypto";

/**
 * POST: Solicitar reset de senha
 * Body: { email }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: "Email é obrigatório" },
        { status: 400 }
      );
    }

    // Verificar se usuário existe
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Não revelar se email existe ou não (por segurança)
      return NextResponse.json(
        {
          message:
            "Se o email existe em nossa base, um link de recuperação foi enviado",
        },
        { status: 200 }
      );
    }

    // Gerar token de reset (válido por 24 horas)
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenHash = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");
    const resetTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

    // Salvar token no banco
    await prisma.verificationToken.create({
      data: {
        identifier: user.id,
        token: resetTokenHash,
        expires: resetTokenExpires,
      },
    });

    // Link de reset
    const resetLink = `${
      process.env.NEXTAUTH_URL || "http://localhost:3000"
    }/reset-password?token=${resetToken}&email=${email}`;

    // Enviar email
    try {
      await sendPasswordResetEmail(email, user.name || "Usuário", resetLink);
    } catch (emailError) {
      console.error("Erro ao enviar email de reset:", emailError);
      // Mesmo assim informar sucesso (token foi criado)
    }

    return NextResponse.json(
      {
        message:
          "Se o email existe em nossa base, um link de recuperação foi enviado",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[PASSWORD RESET REQUEST ERROR]", error);
    return NextResponse.json(
      { error: "Erro ao solicitar reset de senha" },
      { status: 500 }
    );
  }
}
