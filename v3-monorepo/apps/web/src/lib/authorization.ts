import { auth } from "@/auth";
import { hasPermission, type Permission, type Role } from "@marklabs/permissions";
import { prisma } from "@marklabs/database";

export class ApiError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
  }
}

export async function requireCurrentUserId() {
  const session = await auth();

  // Log para debugging
  console.log("[AUTH DEBUG] Session:", {
    exists: !!session,
    userId: session?.user?.id,
    email: session?.user?.email,
    role: session?.user?.role,
  });

  let userId = session?.user?.id;

  // The database uses cuid() for IDs (e.g., "clx123abc..."), not UUID.
  // The session.user.id should already be the cuid from the database via the JWT callback.
  // We just verify the user exists in the database.
  if (userId && typeof userId === 'string') {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });
    if (!user) {
      console.warn('[AUTH DEBUG] session.user.id not found in DB, will try lookup by email', userId);
      userId = undefined;
    }
  }

  // Fallback: lookup by email if userId not found (e.g., after schema migration)
  if (!userId && session?.user?.email) {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });
    userId = user?.id;
  }

  if (!userId) {
    console.log("[AUTH ERROR] No userId found. Session:", session);
    throw new ApiError(401, "Não autenticado.");
  }

  // Ensure userId is a valid string (cuid() generates string IDs)
  if (typeof userId !== 'string' || userId.length === 0) {
    throw new ApiError(401, "ID de usuário inválido.");
  }

  return userId;
}

export async function requireTeamAccess(teamId: string, permission?: Permission) {
  const userId = await requireCurrentUserId();

  const membership = await prisma.teamMember.findUnique({
    where: { teamId_userId: { teamId, userId } },
    select: { role: true },
  });
  if (!membership) throw new ApiError(403, "Você não tem acesso a esta equipe.");
  if (permission && !hasPermission(membership.role as Role, permission)) {
    throw new ApiError(403, "Você não tem permissão para esta ação.");
  }
  return { userId, role: membership.role as Role };
}

export function apiErrorResponse(error: unknown) {
  if (error instanceof ApiError) return { error: error.message, status: error.status };
  console.error("[API ERROR]", error);
  return { error: "Erro interno do servidor.", status: 500 };
}
