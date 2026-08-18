"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, ArrowRight, Plus, Loader2, Users, Globe } from "lucide-react";

interface Team {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  plan: string;
  role: string;
  membersCount: number;
  accountsCount: number;
}

export default function SelectTeamPage() {
  const router = useRouter();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [remember, setRemember] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function fetchTeams() {
    try {
      const res = await fetch("/api/teams");
      if (!res.ok) throw new Error("Não foi possível carregar as empresas.");
      const data = await res.json();
      const availableTeams = data.teams || [];
      setTeams(availableTeams);
      return availableTeams as Team[];
    } catch (err) {
      console.error("Failed to fetch teams:", err);
      return [] as Team[];
    } finally {
      setLoading(false);
    }
  }

  function handleSelectTeam(teamId: string, isAutoRedirect = false) {
    setLoadingId(teamId);

    // Set active team cookie
    document.cookie = `marklabs_team_id=${teamId}; path=/; max-age=2592000`;

    // Set remember preference
    if (remember && !isAutoRedirect) {
      document.cookie = `marklabs_remember_team=${teamId}; path=/; max-age=2592000`;
    } else if (!remember) {
      document.cookie = `marklabs_remember_team=; path=/; max-age=0`;
    }

    router.push("/dashboard");
  }

  useEffect(() => {
    const initializeTeams = async () => {
      const availableTeams = await fetchTeams();
      const rememberedTeam = document.cookie
        .split("; ")
        .find((row) => row.startsWith("marklabs_remember_team="))
        ?.split("=")[1];

      if (rememberedTeam && availableTeams.some((team) => team.id === rememberedTeam)) {
        handleSelectTeam(rememberedTeam, true);
        return;
      }

      // Clean up stale choices left by another account or a deleted team.
      if (rememberedTeam) document.cookie = "marklabs_remember_team=; path=/; max-age=0";
      document.cookie = "marklabs_team_id=; path=/; max-age=0";
    };
    void initializeTeams();
  }, []);

  const handleCreateTeam = async () => {
    if (!newTeamName.trim()) return;
    setCreating(true);

    try {
      setError(null);
      const res = await fetch("/api/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newTeamName }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Não foi possível criar a empresa.");
      setShowCreateForm(false);
      setNewTeamName("");
      handleSelectTeam(data.team.id);
    } catch (err) {
      console.error("Failed to create team:", err);
      setError(err instanceof Error ? err.message : "Não foi possível criar a empresa.");
    } finally {
      setCreating(false);
    }
  };

  const planLabels: Record<string, { label: string; color: string }> = {
    FREE: { label: "Free", color: "#6b7280" },
    PRO: { label: "Pro", color: "#10b981" },
    ENTERPRISE: { label: "Enterprise", color: "#ea580c" },
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-primary)" }}>
        <Loader2 className="animate-spin" size={28} style={{ color: "#ea580c" }} />
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg-primary)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Background Glow */}
      <div
        style={{
          position: "absolute",
          top: "20%",
          left: "50%",
          transform: "translateX(-50%)",
          width: "600px",
          height: "600px",
          background: "radial-gradient(circle, rgba(234,88,12,0.1) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          width: "100%",
          maxWidth: "480px",
          position: "relative",
          zIndex: 1,
          animation: "fadeIn 0.4s ease-out",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <h1
            style={{
              fontSize: "24px",
              fontWeight: 800,
              color: "var(--text-primary)",
              marginBottom: "8px",
              letterSpacing: "-0.03em",
            }}
          >
            Selecione a Empresa
          </h1>
          <p style={{ fontSize: "14px", color: "var(--text-secondary)" }}>
            Escolha qual espaço de trabalho você quer acessar
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "20px" }}>
          {teams.map((team) => {
            const plan = planLabels[team.plan] || planLabels.FREE;
            return (
              <button
                key={team.id}
                onClick={() => handleSelectTeam(team.id)}
                disabled={loadingId !== null}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "16px 20px",
                  background: "var(--bg-card)",
                  border: "1px solid var(--border)",
                  borderRadius: "14px",
                  cursor: loadingId ? "not-allowed" : "pointer",
                  transition: "all 0.2s ease",
                  opacity: loadingId !== null && loadingId !== team.id ? 0.5 : 1,
                  textAlign: "left",
                }}
                className="team-select-btn"
              >
                <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                  <div
                    style={{
                      width: "44px",
                      height: "44px",
                      borderRadius: "12px",
                      background: "rgba(234,88,12,0.1)",
                      border: "1px solid rgba(234,88,12,0.2)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#ea580c",
                      transition: "all 0.2s ease",
                    }}
                  >
                    <Building2 size={20} />
                  </div>
                  <div>
                    <p style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary)" }}>
                      {team.name}
                    </p>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "4px" }}>
                      <span
                        style={{
                          fontSize: "10px",
                          textTransform: "uppercase",
                          fontWeight: 700,
                          color: "var(--text-muted)",
                          background: "var(--bg-secondary)",
                          padding: "2px 8px",
                          borderRadius: "20px",
                        }}
                      >
                        {team.role}
                      </span>
                      <span
                        style={{
                          fontSize: "10px",
                          textTransform: "uppercase",
                          fontWeight: 700,
                          color: plan.color,
                          background: `${plan.color}15`,
                          padding: "2px 8px",
                          borderRadius: "20px",
                        }}
                      >
                        {plan.label}
                      </span>
                      <span style={{ display: "flex", alignItems: "center", gap: "3px", fontSize: "11px", color: "var(--text-muted)" }}>
                        <Users size={10} /> {team.membersCount}
                      </span>
                      <span style={{ display: "flex", alignItems: "center", gap: "3px", fontSize: "11px", color: "var(--text-muted)" }}>
                        <Globe size={10} /> {team.accountsCount}
                      </span>
                    </div>
                  </div>
                </div>
                {loadingId === team.id ? (
                  <Loader2 className="animate-spin" size={18} style={{ color: "#ea580c" }} />
                ) : (
                  <ArrowRight size={18} style={{ color: "var(--text-muted)", transition: "color 0.15s" }} />
                )}
              </button>
            );
          })}

          {teams.length === 0 && (
            <div
              style={{
                textAlign: "center",
                padding: "32px",
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
                borderRadius: "14px",
              }}
            >
              <p style={{ fontSize: "14px", color: "var(--text-muted)", marginBottom: "12px" }}>
                Você ainda não faz parte de nenhuma empresa.
              </p>
              <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>
                Crie uma nova abaixo para começar!
              </p>
            </div>
          )}
        </div>

        {/* Create Team */}
        {showCreateForm ? (
          <div
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              borderRadius: "14px",
              padding: "20px",
              animation: "fadeIn 0.2s ease-out",
            }}
          >
            <p style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "12px" }}>
              Nova empresa
            </p>
            <input
              type="text"
              value={newTeamName}
              onChange={(e) => setNewTeamName(e.target.value)}
              placeholder="Nome da empresa..."
              autoFocus
              style={{
                width: "100%",
                padding: "10px 14px",
                background: "var(--bg-secondary)",
                border: "1px solid var(--border)",
                borderRadius: "10px",
                color: "var(--text-primary)",
                fontSize: "14px",
                outline: "none",
                marginBottom: "12px",
              }}
              onKeyDown={(e) => e.key === "Enter" && handleCreateTeam()}
            />
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                onClick={() => { setShowCreateForm(false); setNewTeamName(""); }}
                style={{
                  flex: 1,
                  padding: "10px",
                  background: "var(--bg-secondary)",
                  border: "1px solid var(--border)",
                  borderRadius: "9px",
                  color: "var(--text-secondary)",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateTeam}
                disabled={creating || !newTeamName.trim()}
                style={{
                  flex: 2,
                  padding: "10px",
                  background: "linear-gradient(135deg, #ea580c, #c2410c)",
                  border: "none",
                  borderRadius: "9px",
                  color: "#fff",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: creating ? "not-allowed" : "pointer",
                  boxShadow: "0 0 12px rgba(234,88,12,0.3)",
                }}
              >
                {creating ? "Criando..." : "Criar empresa"}
              </button>
            </div>
            {error && (
              <p style={{ color: "#ef4444", fontSize: "12px", marginTop: "10px" }}>{error}</p>
            )}
          </div>
        ) : (
          <button
            onClick={() => setShowCreateForm(true)}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              width: "100%",
              padding: "14px",
              background: "transparent",
              border: "1px dashed var(--border)",
              borderRadius: "14px",
              cursor: "pointer",
              transition: "all 0.2s ease",
              color: "var(--text-secondary)",
              fontSize: "13px",
              fontWeight: 600,
            }}
            className="team-select-btn"
          >
            <Plus size={16} />
            Criar nova empresa
          </button>
        )}

        {/* Remember option */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            justifyContent: "center",
            marginTop: "20px",
          }}
        >
          <input
            type="checkbox"
            id="remember"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
            style={{ accentColor: "#ea580c" }}
          />
          <label
            htmlFor="remember"
            style={{ fontSize: "13px", color: "var(--text-muted)", cursor: "pointer" }}
          >
            Lembrar minha escolha (entrar direto da próxima vez)
          </label>
        </div>
      </div>

      <style>{`
        .team-select-btn:hover {
          border-color: rgba(234,88,12,0.4) !important;
          box-shadow: 0 4px 16px rgba(234,88,12,0.1);
        }
      `}</style>
    </div>
  );
}
