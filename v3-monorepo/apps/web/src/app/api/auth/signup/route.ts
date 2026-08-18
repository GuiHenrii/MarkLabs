import { NextResponse } from "next/server";
import { prisma } from "@marklabs/database";
import bcrypt from "bcryptjs";
import { sendWelcomeEmail } from "@/lib/email";
import crypto from "crypto";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, name } = body;

    // Validar campos obrigatórios
    if (!email || !password || !name) {
      return NextResponse.json(
        { error: "Email, senha e nome são obrigatórios" },
        { status: 400 }
      );
    }

    // Verificar se usuário já existe
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Usuário com este email já existe" },
        { status: 409 }
      );
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, 10);

    // Criar usuário
    const user = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        emailVerified: null,
      },
    });

    // Criar time padrão para o usuário
    const team = await prisma.team.create({
      data: {
        name: `${name}'s Team`,
        slug: `${name.toLowerCase().replace(/\s+/g, "-")}-${crypto
          .randomBytes(4)
          .toString("hex")}`,
        members: {
          create: {
            userId: user.id,
            role: "ADMIN",
          },
        },
      },
    });

    // Enviar email de boas-vindas
    const activationLink = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/dashboard`;
    
    try {
      await sendWelcomeEmail(email, name, activationLink);
    } catch (emailError) {
      console.error("Erro ao enviar email, mas usuário foi criado:", emailError);
      // Não falhar se email não enviar - usuário já está criado
    }

    return NextResponse.json(
      {
        message: "Usuário criado com sucesso! Email de boas-vindas enviado.",
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
        team: {
          id: team.id,
          name: team.name,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[AUTH SIGNUP ERROR]", error);
    return NextResponse.json(
      { error: "Erro ao criar usuário" },
      { status: 500 }
    );
  }
}
