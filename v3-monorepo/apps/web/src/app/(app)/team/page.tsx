"use client";

import { useEffect, useMemo, useState } from "react";
import { UserPlus, Shield, Edit3, Eye, MoreHorizontal, CheckCircle2, Clock, Mail } from "lucide-react";
import { Topbar } from "@/components/layout/Topbar";
import { useTeam } from "@/components/providers/TeamProvider";

type TeamMember = {
  id: string;
  userId: string;
  name: string;
  email: string;
  avatar?: string;
  role: "ADMIN" | "EDITOR" | "VIEWER";
  joinedAt: string;
};

type TeamPayload = {
  team: {
    id: string;
    name: string;
    membersCount: number;
    accountsCount: number;
    postsCount: number;
    members: TeamMember[];
  };
};

const roleConfig = {
  ADMIN: { label: "Admin", color: "#ea580c", icon: Shield, bg: "rgba(234,88,12,0.15)", border: "rgba(234,88,12,0.3)", description: "Acesso total à plataforma" },
  EDITOR: { label: "Editor", color: "#10b981", icon: Edit3, bg: "rgba(16,185,129,0.15)", border: "rgba(16,185,129,0.3)", description: "Criar e publicar posts" },
  VIEWER: { label: "Visualizador", color: "#f59e0b", icon: Eye, bg: "rgba(245,158,11,0.15)", border: "rgba(245,158,11,0.3)", description: "Apenas visualizar" },
} as const;

const avatarColors = ["#ea580c", "#9a3412", "#ec4899", "#10b981", "#f59e0b"];

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString("pt-BR");
}

export default function TeamPage() {
  const { teamId } = useTeam();
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"ADMIN" | "EDITOR" | "VIEWER">("EDITOR");
  const [sending, setSending] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [payload, setPayload] = useState<TeamPayload | null>(null);

  useEffect(() => {
    if (!teamId) return;

    fetch(`/api/teams/${teamId}`)
      .then((response) => (response.ok ? response.json() : Promise.reject(new Error("Falha ao carregar equipe"))))
      .then(setPayload)
      .catch((error) => console.error("Erro ao carregar equipe:", error));
  }, [teamId]);

  const team = payload?.team;
  const members = team?.members ?? [];

  const stats = useMemo(() => ({
    totalMembers: team?.membersCount ?? members.length,
    activeMembers: members.length,
    pendingInvites: 0,
  }), [members.length, team?.membersCount]);

  const handleSendInvite = async () => {
    if (!inviteEmail || !teamId) return;
    setSending(true);
    try {
      const res = await fetch(`/api/teams/${teamId}/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      });
      const data = await res.json();
      if (res.ok) {
        alert(`Convite enviado para ${inviteEmail}.`);
        setShowInviteModal(false);
        setInviteEmail("");
      } else {
        alert(`Erro: ${data.error || "Não foi possível enviar o convite."}`);
      }
    } catch {
      alert("Erro de conexão ao enviar convite.");
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <Topbar title="Gestão de Equipe" subtitle="Gerencie os membros e permissões da sua equipe" />

      <main style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "20px", flex: 1 }} className="animate-fade-in">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "14px" }}>
          {[
            { label: "Total de Membros", value: String(stats.totalMembers), icon: "👥" },
            { label: "Membros Ativos", value: String(stats.activeMembers), icon: "✅" },
            { label: "Convites Pendentes", value: String(stats.pendingInvites), icon: "📧" },
          ].map((s) => (
            <div key={s.label} style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "12px", padding: "16px", display: "flex", alignItems: "center", gap: "12px" }}>
              <span style={{ fontSize: "28px" }}>{s.icon}</span>
              <div>
                <p style={{ fontSize: "22px", fontWeight: 700, color: "var(--text-primary)" }}>{s.value}</p>
                <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "14px", overflow: "hidden" }}>
          <div style={{ padding: "18px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <h2 style={{ fontSize: "15px", fontWeight: 700, color: "var(--text-primary)" }}>Membros da Equipe</h2>
            <button
              id="invite-member-btn"
              onClick={() => setShowInviteModal(true)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "7px",
                padding: "8px 16px",
                background: "linear-gradient(135deg, #ea580c, #c2410c)",
                border: "none",
                borderRadius: "9px",
                color: "#fff",
                fontSize: "13px",
                fontWeight: 600,
                cursor: "pointer",
                boxShadow: "0 0 12px rgba(234,88,12,0.3)",
              }}
            >
              <UserPlus size={14} />
              Convidar membro
            </button>
          </div>

          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "var(--bg-secondary)" }}>
                {["Membro", "Função", "Status", "Entrou em", "Último acesso", ""].map((h) => (
                  <th key={h} style={{ padding: "10px 20px", textAlign: "left", fontSize: "11px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {members.map((member, i) => {
                const role = roleConfig[member.role];
                const RoleIcon = role.icon;
                const avatar = (member.name || member.email)
                  .split(" ")
                  .slice(0, 2)
                  .map((part) => part[0]?.toUpperCase() ?? "")
                  .join("");
                const avatarColor = avatarColors[i % avatarColors.length];
                return (
                  <tr key={member.id} style={{ borderTop: "1px solid var(--border)", transition: "background 0.15s ease" }} className="team-row">
                    <td style={{ padding: "14px 20px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: `${avatarColor}25`, border: `1.5px solid ${avatarColor}50`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 700, color: avatarColor, flexShrink: 0 }}>
                          {avatar}
                        </div>
                        <div>
                          <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)" }}>{member.name}</p>
                          <p style={{ fontSize: "11px", color: "var(--text-muted)" }}>{member.email}</p>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: "14px 20px" }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", padding: "4px 10px", borderRadius: "20px", background: role.bg, border: `1px solid ${role.border}`, color: role.color, fontSize: "11px", fontWeight: 700 }}>
                        <RoleIcon size={10} />
                        {role.label}
                      </span>
                    </td>
                    <td style={{ padding: "14px 20px" }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", fontSize: "12px" }}>
                        <CheckCircle2 size={12} style={{ color: "#10b981" }} />
                        <span style={{ color: "#10b981" }}>Ativo</span>
                      </span>
                    </td>
                    <td style={{ padding: "14px 20px", fontSize: "12px", color: "var(--text-muted)" }}>{formatDate(member.joinedAt)}</td>
                    <td style={{ padding: "14px 20px", fontSize: "12px", color: "var(--text-muted)" }}>Hoje</td>
                    <td style={{ padding: "14px 20px", position: "relative" }}>
                      <button
                        id={`member-menu-${member.id}`}
                        onClick={() => setActiveMenu(activeMenu === member.id ? null : member.id)}
                        style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: "4px" }}
                      >
                        <MoreHorizontal size={15} />
                      </button>
                      {activeMenu === member.id && (
                        <div style={{ position: "absolute", top: "40px", right: "20px", background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "8px", boxShadow: "0 8px 24px rgba(0,0,0,0.15)", zIndex: 10, width: "160px", display: "flex", flexDirection: "column" }}>
                          <button onClick={() => { setActiveMenu(null); alert("Edição de permissão ainda não foi conectada à API."); }} style={{ textAlign: "left", padding: "10px 14px", background: "none", border: "none", borderBottom: "1px solid var(--border)", color: "var(--text-primary)", fontSize: "12px", cursor: "pointer" }}>Editar Permissão</button>
                          <button onClick={() => { setActiveMenu(null); alert("Remoção de membro ainda não foi conectada à API."); }} style={{ textAlign: "left", padding: "10px 14px", background: "none", border: "none", color: "#ef4444", fontSize: "12px", cursor: "pointer" }}>Remover</button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "14px", padding: "20px" }}>
          <h2 style={{ fontSize: "15px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "14px" }}>Níveis de Acesso</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
            {Object.entries(roleConfig).map(([key, role]) => {
              const RoleIcon = role.icon;
              return (
                <div key={key} style={{ padding: "14px", background: "var(--bg-secondary)", borderRadius: "10px", border: "1px solid var(--border)", borderLeft: `3px solid ${role.color}` }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                    <RoleIcon size={15} style={{ color: role.color }} />
                    <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-primary)" }}>{role.label}</span>
                  </div>
                  <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>{role.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {showInviteModal && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, backdropFilter: "blur(4px)" }}
          onClick={() => setShowInviteModal(false)}
        >
          <div
            style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "16px", padding: "28px", width: "420px", animation: "fadeIn 0.2s ease-out" }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ fontSize: "18px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "6px" }}>Convidar membro</h2>
            <p style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "24px" }}>Envie um convite por email para adicionar um novo membro à equipe.</p>

            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "var(--text-secondary)", marginBottom: "6px" }}>Email</label>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: "9px", padding: "0 12px", height: "40px" }}>
                  <Mail size={14} style={{ color: "var(--text-muted)" }} />
                  <input
                    id="invite-email-input"
                    type="email"
                    placeholder="email@exemplo.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    style={{ background: "none", border: "none", outline: "none", fontSize: "14px", color: "var(--text-primary)", flex: 1 }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "var(--text-secondary)", marginBottom: "6px" }}>Função</label>
                <select
                  id="invite-role-select"
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as "ADMIN" | "EDITOR" | "VIEWER")}
                  style={{ width: "100%", padding: "10px 12px", background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: "9px", color: "var(--text-primary)", fontSize: "13px", outline: "none" }}
                >
                  <option value="ADMIN">Admin — Acesso total</option>
                  <option value="EDITOR">Editor — Criar e publicar posts</option>
                  <option value="VIEWER">Visualizador — Apenas visualizar</option>
                </select>
              </div>

              <div style={{ display: "flex", gap: "10px", marginTop: "8px" }}>
                <button
                  id="cancel-invite-btn"
                  onClick={() => setShowInviteModal(false)}
                  style={{ flex: 1, padding: "11px", background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: "9px", color: "var(--text-secondary)", fontSize: "14px", fontWeight: 600, cursor: "pointer" }}
                >
                  Cancelar
                </button>
                <button
                  id="send-invite-btn"
                  onClick={handleSendInvite}
                  disabled={sending}
                  style={{ flex: 2, padding: "11px", background: "linear-gradient(135deg, #ea580c, #c2410c)", border: "none", borderRadius: "9px", color: "#fff", fontSize: "14px", fontWeight: 600, cursor: sending ? "not-allowed" : "pointer", boxShadow: "0 0 12px rgba(234,88,12,0.3)" }}
                >
                  {sending ? "Enviando..." : "Enviar Convite"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .team-row:hover { background: var(--bg-hover); }
      `}</style>
    </>
  );
}
