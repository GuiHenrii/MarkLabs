import { Sidebar } from "@/components/layout/Sidebar";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { TeamProvider } from "@/components/providers/TeamProvider";
import { prisma } from "@marklabs/database";
import { requireCurrentUserId } from "@/lib/authorization";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const teamId = cookieStore.get("marklabs_team_id")?.value;

  if (!teamId) {
    redirect("/select-team");
  }

  let userId: string;
  try {
    userId = await requireCurrentUserId();
  } catch {
    redirect("/login");
  }

  const membership = await prisma.teamMember.findUnique({
    where: { teamId_userId: { teamId, userId } },
    select: { id: true },
  });
  if (!membership) {
    // The cookie is only a UI preference. Never allow it to select a team
    // that does not belong to the signed-in user.
    redirect("/select-team?reason=invalid-team");
  }

  return (
    <TeamProvider teamId={teamId}>
      <div style={{ display: "flex", minHeight: "100dvh" }}>
        <Sidebar />
        <div
          style={{
            marginLeft: "240px",
            flex: 1,
            display: "flex",
            flexDirection: "column",
            minHeight: "100dvh",
            background: "var(--bg-primary)",
          }}
          className="mobile-full print-layout-content"
        >
          {children}
        </div>
      </div>
    </TeamProvider>
  );
}
