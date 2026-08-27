"use client";

import { useTeam } from "@/components/providers/TeamProvider";
import { useEffect, useMemo, useState, type CSSProperties, type SVGProps } from "react";
import { useSearchParams } from "next/navigation";
import { Topbar } from "@/components/layout/Topbar";
import {
  Plus,
  Trash2,
  ExternalLink,
  Loader2,
  CheckCircle2,
  RefreshCw,
  ArrowRight,
  ShieldCheck,
  Search,
  AlertTriangle,
} from "lucide-react";
import { getPlatformLabel } from "@/lib/utils";

type Platform = "FACEBOOK" | "INSTAGRAM" | "LINKEDIN";
type SocialAccount = { id: string; name?: string; username?: string; platform: Platform; platformId?: string };

const brand: Record<Platform, { accent: string; soft: string }> = {
  FACEBOOK: { accent: "#1877f2", soft: "rgba(24,119,242,0.08)" },
  INSTAGRAM: { accent: "#e1306c", soft: "rgba(225,48,108,0.08)" },
  LINKEDIN: { accent: "#0a66c2", soft: "rgba(10,102,194,0.08)" },
};

function FacebookLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path fill="currentColor" d="M13.5 22v-8h2.7l.4-3.1h-3.1V8.8c0-.9.3-1.5 1.6-1.5H16.7V4.5c-.6-.1-1.6-.2-2.7-.2-2.8 0-4.7 1.7-4.7 4.8v1.8H7v3.1h2.3v8h4.2Z" />
    </svg>
  );
}

function InstagramLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <rect x="4" y="4" width="16" height="16" rx="5" stroke="currentColor" strokeWidth="2" />
      <circle cx="12" cy="12" r="4.2" stroke="currentColor" strokeWidth="2" />
      <circle cx="17.2" cy="6.8" r="1.2" fill="currentColor" />
    </svg>
  );
}

function LinkedinLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <rect x="4" y="4" width="16" height="16" rx="3.5" fill="currentColor" />
      <path fill="#fff" d="M8.2 9.5H6.3V17h1.9V9.5ZM7.3 8.4a1.1 1.1 0 1 0 0-2.2 1.1 1.1 0 0 0 0 2.2Zm7.4 9h1.9v-4.2c0-2.2-1.2-3.1-2.7-3.1-1.2 0-1.9.7-2.2 1.2h0V9.5h-1.9V17h1.9v-4.2c0-1 .2-2 1.4-2 1.2 0 1.3 1.1 1.3 2.1V17Z" />
    </svg>
  );
}

const platformIcons: Record<Platform, React.ComponentType<{ className?: string }>> = {
  FACEBOOK: FacebookLogo,
  INSTAGRAM: InstagramLogo,
  LINKEDIN: LinkedinLogo,
};

function PlatformBadge({ platform }: { platform: Platform }) {
  const Icon = platformIcons[platform];
  const { accent } = brand[platform];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        padding: "6px 10px",
        borderRadius: "999px",
        background: "rgba(255,255,255,0.03)",
        border: `1px solid ${accent}24`,
        color: accent,
        fontSize: "11px",
        fontWeight: 800,
        letterSpacing: "0.04em",
        textTransform: "uppercase",
      }}
    >
      <Icon className="h-3.5 w-3.5" />
      {getPlatformLabel(platform)}
    </span>
  );
}

export default function AccountsPage() {
  const { teamId } = useTeam();
  const searchParams = useSearchParams();
  const connectionError = searchParams.get("error");
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [disconnectingAll, setDisconnectingAll] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!teamId) return;

    const loadAccounts = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/social/accounts?teamId=${teamId}`, { cache: "no-store" });
        if (!res.ok) throw new Error("Erro ao buscar contas");
        setAccounts((await res.json()) as SocialAccount[]);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    void loadAccounts();
  }, [teamId, searchParams]);

  const filteredAccounts = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return accounts;
    return accounts.filter((account) => `${account.name ?? ""} ${account.username ?? ""} ${account.platform}`.toLowerCase().includes(term));
  }, [accounts, query]);

  const accountTotals = useMemo(
    () => ({
      facebook: accounts.filter((account) => account.platform === "FACEBOOK").length,
      instagram: accounts.filter((account) => account.platform === "INSTAGRAM").length,
      linkedin: accounts.filter((account) => account.platform === "LINKEDIN").length,
    }),
    [accounts]
  );

  const reload = async () => {
    if (!teamId) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/social/accounts?teamId=${teamId}`, { cache: "no-store" });
      if (!res.ok) throw new Error("Erro ao buscar contas");
      setAccounts((await res.json()) as SocialAccount[]);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const disconnectAccount = async (accountId: string) => {
    if (!confirm("Tem certeza que deseja desconectar esta conta?")) return;
    setDeletingId(accountId);
    try {
      const res = await fetch(`/api/social/accounts/${accountId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Erro ao desconectar");
      setAccounts((current) => current.filter((a) => a.id !== accountId));
    } catch {
      alert("Falha ao desconectar conta.");
    } finally {
      setDeletingId(null);
    }
  };

  const disconnectAllAccounts = async () => {
    if (!accounts.length) return;
    if (!confirm(`Tem certeza que deseja desconectar TODAS as ${accounts.length} contas conectadas?`)) return;
    setDisconnectingAll(true);
    try {
      const res = await fetch(`/api/social/accounts?teamId=${teamId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Erro ao desconectar todas");
      setAccounts([]);
    } catch {
      alert("Falha ao desconectar todas as contas.");
    } finally {
      setDisconnectingAll(false);
    }
  };

  return (
    <>
      <Topbar title="Minhas Contas" subtitle="Gestão centralizada dos perfis conectados." />

      <main style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "18px", flex: 1 }} className="tech-page accounts-page animate-fade-in">
        {connectionError && (
          <section
            className="glass"
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "12px",
              padding: "14px 16px",
              borderColor: "rgba(234, 88, 12, 0.35)",
              color: "var(--text-secondary)",
            }}
          >
            <AlertTriangle size={18} style={{ color: "#ea580c", flexShrink: 0, marginTop: "1px" }} />
            <div>
              <strong style={{ display: "block", color: "var(--text-primary)", marginBottom: "3px" }}>
                {connectionError === "facebook_rate_limited" ? "Limite temporário da Meta atingido" : "Não foi possível concluir a conexão"}
              </strong>
              <span style={{ fontSize: "13px" }}>
                {connectionError === "facebook_rate_limited"
                  ? "O login foi autorizado, mas a Meta bloqueou temporariamente a listagem das Páginas. Aguarde antes de tentar novamente."
                  : "A autorização foi cancelada ou recusada pelo provedor. Tente conectar novamente."}
              </span>
            </div>
          </section>
        )}

        <section className="glass accounts-hero">
          <div style={{ display: "flex", justifyContent: "space-between", gap: "14px", alignItems: "flex-end", flexWrap: "wrap" }}>
            <div style={{ maxWidth: "620px" }}>
              <div className="accounts-kicker">
                <ShieldCheck size={12} />
                Conexões ativas
              </div>
              <h2 style={{ marginTop: "12px", fontSize: "30px", lineHeight: 1.05, letterSpacing: "-0.04em" }}>Contas conectadas</h2>
              <p style={{ marginTop: "8px", fontSize: "13px", color: "var(--text-secondary)" }}>
                {accounts.length} conta{accounts.length === 1 ? "" : "s"} ativa{accounts.length === 1 ? "" : "s"} no workspace.
              </p>
              <p style={{ marginTop: "4px", fontSize: "12px", color: "var(--text-muted)" }}>
                {accountTotals.facebook} Facebook, {accountTotals.instagram} Instagram e {accountTotals.linkedin} LinkedIn
              </p>
            </div>

            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
              <div className="accounts-search">
                <Search size={14} />
                <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar conta..." />
              </div>
              <button onClick={reload} className="accounts-ghost-btn" disabled={loading}>
                <RefreshCw size={15} />
                Atualizar
              </button>
              <button onClick={disconnectAllAccounts} className="accounts-danger-btn" disabled={loading || disconnectingAll || accounts.length === 0}>
                {disconnectingAll ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                Desconectar todas
              </button>
            </div>
          </div>
        </section>

        <section style={{ display: "grid", gridTemplateColumns: "340px 1fr", gap: "16px" }} className="mobile-stack">
          <aside className="glass accounts-panel">
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "14px" }}>
              <div className="accounts-icon-shell">
                <Plus size={20} />
              </div>
              <div>
                <h3 style={{ fontSize: "16px", fontWeight: 800 }}>Nova conexão</h3>
                <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>Adicionar outra rede sem sair daqui</p>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {(["FACEBOOK", "INSTAGRAM", "LINKEDIN"] as Platform[]).map((platform) => {
                const Icon = platformIcons[platform];
                const { accent, soft } = brand[platform];
                return (
                  <a
                    key={platform}
                    href={`/api/social/connect?platform=${platform}&teamId=${teamId}`}
                    className="connect-row"
                    style={{ borderColor: `${accent}20`, background: soft }}
                  >
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "10px" }}>
                      <span className="connect-icon" style={{ borderColor: `${accent}22`, color: accent }}>
                        <Icon className="h-4.5 w-4.5" />
                      </span>
                      <span>
                        <span className="connect-title">Conectar {getPlatformLabel(platform)}</span>
                        <span className="connect-subtitle">Adicionar novo perfil</span>
                      </span>
                    </span>
                    <ArrowRight size={14} style={{ color: accent }} />
                  </a>
                );
              })}
            </div>
          </aside>

          <section className="glass accounts-panel">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", marginBottom: "14px" }}>
              <div>
                <h3 style={{ fontSize: "16px", fontWeight: 800 }}>Contas sincronizadas</h3>
                <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>Layout limpo com marcação sutil por rede</p>
              </div>
              <span className="accounts-count-pill">{filteredAccounts.length} exibidas</span>
            </div>

            {loading ? (
              <div style={{ minHeight: "260px", display: "grid", placeItems: "center" }}>
                <Loader2 className="animate-spin text-orange-500" size={32} />
              </div>
            ) : filteredAccounts.length === 0 ? (
              <div style={{ minHeight: "260px", display: "grid", placeItems: "center", color: "var(--text-muted)" }}>Nenhuma conta encontrada.</div>
            ) : (
              <div className="account-platform-groups">
                {(["INSTAGRAM", "FACEBOOK", "LINKEDIN"] as Platform[]).map((groupPlatform) => {
                  const platformAccounts = filteredAccounts.filter((account) => account.platform === groupPlatform);
                  if (platformAccounts.length === 0) return null;

                  const GroupIcon = platformIcons[groupPlatform];
                  const groupBrand = brand[groupPlatform];
                  return (
                    <section key={groupPlatform} className="account-platform-group" style={{ "--account-platform-color": groupBrand.accent } as CSSProperties}>
                      <div className="account-platform-heading">
                        <span><GroupIcon className="h-4 w-4" /> {getPlatformLabel(groupPlatform)}</span>
                        <small>{platformAccounts.length} conta{platformAccounts.length === 1 ? "" : "s"}</small>
                      </div>
                      <div className="account-platform-grid mobile-stack">
                        {platformAccounts.map((account) => {
                  const platform = account.platform;
                  const Icon = platformIcons[platform];
                  const { accent, soft } = brand[platform];
                  return (
                    <article key={account.id} className="account-card">
                      <div className="account-card-top" style={{ background: `linear-gradient(180deg, ${soft}, transparent)` }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", gap: "12px" }}>
                          <PlatformBadge platform={platform} />
                          <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", color: "var(--success)", fontSize: "10px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                            <CheckCircle2 size={11} />
                            ativa
                          </span>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "16px" }}>
                          <div className="account-avatar" style={{ borderColor: `${accent}22`, color: accent }}>
                            <Icon className="h-6 w-6" />
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <h4 style={{ fontSize: "15px", fontWeight: 800, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {account.name}
                            </h4>
                            <p style={{ fontSize: "12px", color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              @{account.username || "perfil"}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div style={{ padding: "14px 16px 16px", display: "flex", flexDirection: "column", gap: "12px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px", color: "var(--text-secondary)" }}>
                          <span>ID da plataforma</span>
                          <span style={{ fontWeight: 700, color: "var(--text-primary)" }}>{account.platformId ?? "n/d"}</span>
                        </div>
                        <div style={{ display: "flex", gap: "8px", justifyContent: "space-between" }}>
                          <button onClick={() => disconnectAccount(account.id)} disabled={deletingId === account.id} className="accounts-ghost-danger">
                            {deletingId === account.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                            Desconectar
                          </button>
                          <a
                            href={
                              platform === "LINKEDIN"
                                ? `https://www.linkedin.com/in/${account.platformId}`
                                : platform === "INSTAGRAM"
                                  ? `https://instagram.com/${account.username}`
                                  : platform === "FACEBOOK"
                                    ? `https://facebook.com/${account.platformId}`
                                    : "#"
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            className="accounts-view-link"
                          >
                            Ver perfil
                            <ExternalLink size={14} />
                          </a>
                        </div>
                      </div>
                    </article>
                  );
                        })}
                      </div>
                    </section>
                  );
                })}
              </div>
            )}
          </section>
        </section>
      </main>

      <style>{`
        .accounts-hero, .accounts-panel {
          border-radius: 22px;
          padding: 20px;
        }
        .accounts-kicker {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 7px 12px;
          border-radius: 999px;
          background: rgba(255,255,255,0.04);
          border: 1px solid var(--border);
          font-size: 11px;
          font-weight: 800;
          color: var(--text-secondary);
        }
        .accounts-search {
          display: flex;
          align-items: center;
          gap: 8px;
          width: 240px;
          height: 42px;
          padding: 0 14px;
          border-radius: 14px;
          background: var(--bg-secondary);
          border: 1px solid var(--border);
          color: var(--text-muted);
        }
        .accounts-search input {
          width: 100%;
          background: none;
          border: none;
          outline: none;
          color: var(--text-primary);
        }
        .accounts-ghost-btn, .accounts-danger-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          height: 42px;
          padding: 0 14px;
          border-radius: 14px;
          border: 1px solid var(--border);
          background: rgba(255,255,255,0.03);
          color: var(--text-primary);
          font-size: 13px;
          font-weight: 800;
          cursor: pointer;
        }
        .accounts-danger-btn {
          border-color: rgba(239,68,68,0.22);
          color: #ef7c7c;
        }
        .accounts-icon-shell {
          width: 44px;
          height: 44px;
          border-radius: 16px;
          background: rgba(255,255,255,0.04);
          border: 1px solid var(--border);
          display: grid;
          place-items: center;
          color: var(--text-secondary);
        }
        .connect-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 14px;
          border-radius: 18px;
          border: 1px solid var(--border);
          text-decoration: none;
          transition: transform 0.15s ease, border-color 0.15s ease, background 0.15s ease;
        }
        .connect-row:hover, .accounts-ghost-btn:hover, .accounts-danger-btn:hover, .accounts-ghost-danger:hover, .accounts-view-link:hover {
          transform: translateY(-2px);
        }
        .connect-icon, .account-avatar {
          width: 34px;
          height: 34px;
          border-radius: 12px;
          background: rgba(255,255,255,0.03);
          border: 1px solid var(--border);
          display: grid;
          place-items: center;
          flex-shrink: 0;
        }
        .connect-title {
          display: block;
          font-size: 13px;
          font-weight: 800;
          color: var(--text-primary);
        }
        .connect-subtitle {
          display: block;
          font-size: 11px;
          color: var(--text-muted);
        }
        .accounts-count-pill {
          font-size: 11px;
          font-weight: 800;
          color: var(--text-secondary);
          border: 1px solid var(--border);
          border-radius: 999px;
          padding: 6px 10px;
          background: rgba(255,255,255,0.03);
        }
        .account-platform-groups {
          display: grid;
          gap: 22px;
        }
        .account-platform-group {
          display: grid;
          gap: 10px;
        }
        .account-platform-group + .account-platform-group {
          padding-top: 20px;
          border-top: 1px solid var(--border);
        }
        .account-platform-heading {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }
        .account-platform-heading > span {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: var(--account-platform-color);
          font-size: 13px;
          font-weight: 900;
        }
        .account-platform-heading small {
          padding: 5px 9px;
          border: 1px solid var(--border);
          border-radius: 999px;
          background: rgba(255,255,255,0.03);
          color: var(--text-muted);
          font-size: 10px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .account-platform-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
        }
        .account-card {
          border: 1px solid var(--border);
          border-radius: 20px;
          overflow: hidden;
          background: rgba(255,255,255,0.02);
        }
        .account-card-top {
          padding: 14px 16px 16px;
          border-bottom: 1px solid var(--border);
        }
        .accounts-ghost-danger, .accounts-view-link {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          height: 38px;
          padding: 0 12px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 800;
          border: 1px solid var(--border);
          background: rgba(255,255,255,0.02);
          color: var(--text-secondary);
          cursor: pointer;
          text-decoration: none;
        }
        .accounts-ghost-danger {
          color: #ef7c7c;
          border-color: rgba(239,68,68,0.18);
        }
        .accounts-view-link {
          color: var(--text-primary);
        }
      `}</style>
    </>
  );
}
