"use client";

import { useEffect, useState } from "react";
import { Building2, Loader2, Save, RefreshCw, CheckCircle2, ExternalLink } from "lucide-react";
import { useTeam } from "@/components/providers/TeamProvider";
import { Topbar } from "@/components/layout/Topbar";

type TeamData = { id: string; name: string };
type SocialAccount = { id: string; platform: string; name: string; username?: string; isActive?: boolean };
type ErrorLike = { message?: string };

export default function SettingsPage() {
  const { teamId } = useTeam();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [team, setTeam] = useState<TeamData | null>(null);
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [name, setName] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (!teamId) return;

    const load = async () => {
      try {
        setLoading(true);
        const [teamRes, accountsRes] = await Promise.all([
          fetch(`/api/teams/${teamId}`),
          fetch(`/api/social/accounts?teamId=${teamId}`),
        ]);
        if (!teamRes.ok) throw new Error("Erro ao carregar empresa");
        const data = await teamRes.json();
        setTeam(data.team);
        setName(data.team.name);
        if (accountsRes.ok) setAccounts(await accountsRes.json());
      } catch (error) {
        console.error(error);
        setMessage({ type: "error", text: "Não foi possível carregar os dados da empresa." });
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [teamId]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamId || !name.trim()) return;
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch(`/api/teams/${teamId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Erro ao salvar");
      }
      const data = await res.json();
      setTeam(data.team);
      setMessage({ type: "success", text: "Empresa atualizada com sucesso." });
    } catch (error) {
      const message = (error as ErrorLike).message || "Falha ao salvar as alterações.";
      setMessage({ type: "error", text: message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Topbar title="Configurações da Empresa" subtitle="Ajuste identidade, conexões e preferências do workspace." />

      <main style={{ padding: "20px 24px 24px", display: "flex", flexDirection: "column", gap: "18px" }} className="tech-page settings-page animate-fade-in mobile-content">
        {loading ? (
          <div style={{ minHeight: "50vh", display: "grid", placeItems: "center" }}>
            <Loader2 className="animate-spin text-orange-500" size={32} />
          </div>
        ) : (
          <>
            <section className="light-hero" style={{ borderRadius: "26px", padding: "22px", overflow: "hidden" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: "18px", flexWrap: "wrap", alignItems: "flex-end" }}>
                <div style={{ maxWidth: "640px" }}>
                  <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "7px 12px", borderRadius: "999px", background: "rgba(255,255,255,0.72)", border: "1px solid var(--border)", color: "var(--text-secondary)", fontSize: "11px", fontWeight: 800 }}>
                    <Building2 size={12} />
                    Identidade da empresa
                  </div>
                  <h1 style={{ marginTop: "14px", fontSize: "34px", lineHeight: 1.02, letterSpacing: "-0.05em", color: "var(--text-primary)" }}>
                    {team?.name}
                  </h1>
                  <p style={{ marginTop: "10px", fontSize: "14px", color: "var(--text-secondary)", maxWidth: "58ch" }}>
                    Um layout mais limpo, com cara de marca forte: branco, laranja e respiro visual.
                  </p>
                </div>
                <div style={{ display: "grid", gap: "10px", minWidth: "260px" }}>
                  <div className="light-card" style={{ padding: "14px", borderRadius: "18px" }}>
                    <div style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.1em", color: "#c2410c", fontWeight: 800 }}>Workspace</div>
                    <div style={{ marginTop: "6px", fontSize: "14px", color: "var(--text-secondary)" }}>ID: {teamId}</div>
                  </div>
                </div>
              </div>
            </section>

            <section style={{ display: "grid", gridTemplateColumns: "1.15fr 0.85fr", gap: "18px" }} className="mobile-stack">
              <div className="light-section" style={{ borderRadius: "22px", padding: "20px" }}>
                <form onSubmit={handleSave} style={{ display: "grid", gap: "16px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 800, color: "var(--text-muted)", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                      Nome da empresa
                    </label>
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      style={{
                        width: "100%",
                        height: "48px",
                        borderRadius: "14px",
                        border: "1px solid var(--border)",
                        background: "rgba(255,255,255,0.92)",
                        padding: "0 14px",
                        color: "var(--text-primary)",
                        outline: "none",
                      }}
                    />
                  </div>

                  {message && (
                    <div
                      style={{
                        padding: "12px 14px",
                        borderRadius: "14px",
                        border: `1px solid ${message.type === "success" ? "rgba(16,185,129,0.25)" : "rgba(239,68,68,0.25)"}`,
                        background: message.type === "success" ? "rgba(16,185,129,0.08)" : "rgba(239,68,68,0.08)",
                        color: message.type === "success" ? "#0f9b6d" : "#b91c1c",
                        fontSize: "13px",
                        fontWeight: 700,
                      }}
                    >
                      {message.text}
                    </div>
                  )}

                  <div style={{ display: "flex", justifyContent: "flex-end" }}>
                    <button
                      type="submit"
                      disabled={saving || !name.trim()}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "8px",
                        height: "46px",
                        padding: "0 16px",
                        borderRadius: "14px",
                        border: "none",
                        background: "linear-gradient(135deg, #ea580c, #fb923c)",
                        color: "#fff",
                        fontSize: "13px",
                        fontWeight: 800,
                        cursor: saving ? "not-allowed" : "pointer",
                        boxShadow: "0 10px 24px rgba(234,88,12,0.22)",
                        opacity: saving || !name.trim() ? 0.7 : 1,
                      }}
                    >
                      {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                      Salvar alterações
                    </button>
                  </div>
                </form>
              </div>

              <div className="light-section" style={{ borderRadius: "22px", padding: "20px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", marginBottom: "16px" }}>
                  <div>
                    <h2 style={{ fontSize: "16px", fontWeight: 900, color: "var(--text-primary)" }}>Conexões sociais</h2>
                    <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "3px" }}>Reconecte os perfis com novos escopos quando necessário.</p>
                  </div>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "6px 10px", borderRadius: "999px", border: "1px solid var(--border)", background: "rgba(255,255,255,0.7)", fontSize: "11px", fontWeight: 800, color: "var(--text-secondary)" }}>
                    <CheckCircle2 size={12} />
                    {accounts.length} contas
                  </span>
                </div>

                <div style={{ display: "grid", gap: "10px" }}>
                  <a href={`/api/social/connect?platform=FACEBOOK&teamId=${teamId}`} className="social-ref-card" style={{ borderColor: "rgba(234,88,12,0.18)" }}>
                    <span>
                      <strong>Reconectar Facebook</strong>
                      <small>Reautenticar com escopos atualizados</small>
                    </span>
                    <ExternalLink size={14} />
                  </a>
                  <a href={`/api/social/connect?platform=INSTAGRAM&teamId=${teamId}`} className="social-ref-card" style={{ borderColor: "rgba(234,88,12,0.18)" }}>
                    <span>
                      <strong>Reconectar Instagram</strong>
                      <small>Reemitir token e permissões</small>
                    </span>
                    <ExternalLink size={14} />
                  </a>
                  <a href={`/api/social/connect?platform=LINKEDIN&teamId=${teamId}`} className="social-ref-card" style={{ borderColor: "rgba(234,88,12,0.18)" }}>
                    <span>
                      <strong>Conectar LinkedIn</strong>
                      <small>Adicionar perfil profissional</small>
                    </span>
                    <ExternalLink size={14} />
                  </a>
                </div>
              </div>
            </section>

            <section className="light-section" style={{ borderRadius: "22px", padding: "20px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", marginBottom: "14px" }}>
                <div>
                  <h2 style={{ fontSize: "16px", fontWeight: 900 }}>Contas conectadas</h2>
                  <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>Lista enxuta e alinhada com a nova direção visual.</p>
                </div>
                <button style={{ display: "inline-flex", alignItems: "center", gap: "8px", height: "40px", padding: "0 14px", borderRadius: "12px", border: "1px solid var(--border)", background: "rgba(255,255,255,0.85)", color: "var(--text-secondary)", fontWeight: 800 }}>
                  <RefreshCw size={14} />
                  Atualizar
                </button>
              </div>

              <div style={{ display: "grid", gap: "10px" }}>
                {accounts.map((account) => (
                  <div key={account.id} className="light-card" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", padding: "14px 16px", borderRadius: "16px" }}>
                    <div>
                      <div style={{ fontSize: "14px", fontWeight: 800, color: "var(--text-primary)" }}>{account.name}</div>
                      <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                        {account.platform} · {account.username || "sem username"} · {account.isActive ? "Ativa" : "Inativa"}
                      </div>
                    </div>
                    <a href={`/api/social/connect?platform=${account.platform}&teamId=${teamId}`} style={{ display: "inline-flex", alignItems: "center", gap: "8px", color: "#ea580c", fontWeight: 800, textDecoration: "none" }}>
                      Reconectar
                      <ExternalLink size={14} />
                    </a>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}
      </main>

      <style>{`
        .social-ref-card {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 14px 16px;
          border-radius: 16px;
          background: rgba(255,255,255,0.96);
          border: 1px solid var(--border);
          color: var(--text-primary);
          text-decoration: none;
          box-shadow: 0 8px 20px rgba(17,17,17,0.04);
        }
        .social-ref-card strong {
          display: block;
          font-size: 13px;
        }
        .social-ref-card small {
          display: block;
          font-size: 11px;
          color: var(--text-muted);
          margin-top: 4px;
        }
      `}</style>
    </>
  );
}
