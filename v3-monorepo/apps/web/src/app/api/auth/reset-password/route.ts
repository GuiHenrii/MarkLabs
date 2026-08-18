import { NextResponse } from "next/server";
import { prisma } from "@marklabs/database";
import bcrypt from "bcryptjs";
import crypto from "crypto";

/**
 * POST: Confirmar reset de senha
 * Body: { token, email, newPassword }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { token, email, newPassword } = body;

    if (!token || !email || !newPassword) {
      return NextResponse.json(
        { error: "Token, email e nova senha são obrigatórios" },
        { status: 400 }
      );
    }

    // Validar força da senha
    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: "Senha deve ter no mínimo 8 caracteres" },
        { status: 400 }
      );
    }

    // Verificar se usuário existe
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    // Hash do token para comparação
    const tokenHash = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    // Verificar token
    const verificationToken = await prisma.verificationToken.findUnique({
      where: {
        identifier_token: {
          identifier: user.id,
          token: tokenHash,
        },
      },
    });

    if (!verificationToken) {
      return NextResponse.json(
        { error: "Token inválido" },
        { status: 400 }
      );
    }

    // Verificar se token expirou
    if (new Date() > verificationToken.expires) {
      // Deletar token expirado
      await prisma.verificationToken.delete({
        where: {
          identifier_token: {
            identifier: user.id,
            token: tokenHash,
          },
        },
      });

      return NextResponse.json(
        { error: "Token expirou. Solicite um novo link de recuperação." },
        { status: 400 }
      );
    }

    // Hash da nova senha
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Atualizar senha do usuário
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
      },
    });

    // Deletar token usado
    await prisma.verificationToken.delete({
      where: {
        identifier_token: {
          identifier: user.id,
          token: tokenHash,
        },
      },
    });

    return NextResponse.json(
      {
        message: "Senha atualizada com sucesso!",
        redirectTo: "/login",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[PASSWORD RESET CONFIRM ERROR]", error);
    return NextResponse.json(
      { error: "Erro ao redefinir senha" },
      { status: 500 }
    );
  }
}
