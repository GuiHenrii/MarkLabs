import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { prisma } from "@marklabs/database";

export async function GET() {
  try {
    const session = await auth();
    
    console.log("[DEBUG] Session check:", {
      sessionExists: !!session,
      userEmail: session?.user?.email,
      userId: session?.user?.id,
    });

    if (!session?.user?.email) {
      return NextResponse.json({
        authenticated: false,
        message: "Não autenticado",
      });
    }

    // Verify user exists in database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, email: true, name: true },
    });

    return NextResponse.json({
      authenticated: !!user,
      user,
      session: {
        userEmail: session.user.email,
        userId: session.user?.id,
      },
    });
  } catch (error) {
    console.error("[DEBUG ERROR]", error);
    return NextResponse.json({
      error: "Erro ao verificar autenticação",
      details: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
}
