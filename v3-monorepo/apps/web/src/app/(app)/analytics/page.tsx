"use client";

import { useEffect, useMemo, useState } from "react";
import { Topbar } from "@/components/layout/Topbar";
import { OrganicAnalytics } from "./components/OrganicAnalytics";
import { AdsAnalytics } from "./components/AdsAnalytics";
import { BarChart2, Check, ChevronDown, Zap } from "lucide-react";
import { useTeam } from "@/components/providers/TeamProvider";
import { getPlatformLabel } from "@/lib/utils";

type SocialAccount = {
  id: string;
  platform: string;
  name: string;
  username?: string | null;
  avatar?: string | null;
};

const platformOrder = ["INSTAGRAM", "FACEBOOK", "LINKEDIN"] as const;
const platformColors: Record<string, string> = {
  INSTAGRAM: "#e1306c",
  FACEBOOK: "#1877f2",
  LINKEDIN: "#0a66c2",
};

export default function UnifiedAnalyticsPage() {
  const { teamId } = useTeam();
  const [activeTab, setActiveTab] = useState<"organic" | "ads">("organic");
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [selectedAccountIds, setSelectedAccountIds] = useState<string[]>([]);
  const [selectorOpen, setSelectorOpen] = useState(false);
  const storageKey = teamId ? `marklabs.analytics.selection.${teamId}` : null;

  const loadSavedSelection = (fallbackAccounts: SocialAccount[]) => {
    if (!storageKey || typeof window === "undefined") return fallbackAccounts.map((account) => account.id);

    try {
      const raw = window.localStorage.getItem(storageKey);
      if (!raw) return fallbackAccounts.map((account) => account.id);

      const parsed = JSON.parse(raw) as { accounts?: string[] };
      const validIds = (parsed.accounts ?? []).filter((id) => fallbackAccounts.some((account) => account.id === id));
      return validIds;
    } catch {
      return [];
    }
  };

  const persistSelection = (nextIds: string[]) => {
    if (!storageKey || typeof window === "undefined") return;
    window.localStorage.setItem(storageKey, JSON.stringify({ accounts: nextIds }));
  };

  useEffect(() => {
    if (!teamId) return;

    let alive = true;
    fetch(`/api/social/accounts?teamId=${teamId}`)
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("Falha ao carregar contas"))))
      .then((data: SocialAccount[]) => {
        if (!alive) return;
        const nextAccounts = data ?? [];
        setAccounts(nextAccounts);
        setSelectedAccountIds((current) => {
          if (current.length > 0) return current;
          return loadSavedSelection(nextAccounts);
        });
      })
      .catch((error) => console.error("Erro ao carregar contas para analytics:", error));

    return () => {
      alive = false;
    };
  }, [teamId]);

  const selectedAccounts = useMemo(
    () => accounts.filter((account) => selectedAccountIds.includes(account.id)),
    [accounts, selectedAccountIds]
  );

  const selectedFacebookAccountIds = useMemo(
    () => selectedAccounts.filter((account) => account.platform === "FACEBOOK").map((account) => account.id),
    [selectedAccounts]
  );

  const selectedFacebookAccount = useMemo(
    () => selectedAccounts.find((account) => account.platform === "FACEBOOK") ?? null,
    [selectedAccounts]
  );

  const selectedAccountLabel = selectedAccounts.length
    ? selectedAccounts
        .slice(0, 3)
        .map((account) => account.name)
        .join(", ")
    : "Nenhuma";

  const toggleAccount = (accountId: string) => {
    setSelectedAccountIds((current) => {
      const next = current.includes(accountId) ? current.filter((id) => id !== accountId) : [...current, accountId];
      persistSelection(next);
      return next;
    });
  };

  const toggleAll = () => {
    setSelectedAccountIds((current) => {
      const next = current.length === accounts.length ? [] : accounts.map((account) => account.id);
      persistSelection(next);
      return next;
    });
  };

  const hasSelectedAccounts = selectedAccountIds.length > 0;

  return (
    <>
      <div className="no-print">
        <Topbar
          title="Performance & Analytics"
          subtitle="Acompanhe o desempenho orgânico e das suas campanhas de tráfego pago"
        />
        <div className="analytics-controls" style={{ padding: "0 24px", paddingTop: "8px", display: "flex", flexDirection: "column", gap: "12px" }}>
          <div style={{ display: "flex", gap: "10px", borderBottom: "1px solid var(--border)", marginBottom: "-1px" }}>
            <button
              onClick={() => setActiveTab("organic")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "12px 16px",
                background: "transparent",
                border: "none",
                borderBottom: activeTab === "organic" ? "2px solid #ea580c" : "2px solid transparent",
                color: activeTab === "organic" ? "var(--text-primary)" : "var(--text-muted)",
                fontSize: "14px",
                fontWeight: activeTab === "organic" ? 600 : 500,
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
            >
              <BarChart2 size={16} style={{ color: activeTab === "organic" ? "#ea580c" : "inherit" }} />
              Redes Sociais (Orgânico)
            </button>
            <button
              onClick={() => setActiveTab("ads")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "12px 16px",
                background: "transparent",
                border: "none",
                borderBottom: activeTab === "ads" ? "2px solid #00d4ff" : "2px solid transparent",
                color: activeTab === "ads" ? "var(--text-primary)" : "var(--text-muted)",
                fontSize: "14px",
                fontWeight: activeTab === "ads" ? 600 : 500,
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
            >
              <Zap size={16} style={{ color: activeTab === "ads" ? "#00d4ff" : "inherit" }} />
              Meta Ads (Tráfego Pago)
            </button>
          </div>

          <div style={{ position: "relative", maxWidth: "560px" }}>
            <button
              onClick={() => setSelectorOpen((open) => !open)}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "12px",
                padding: "12px 14px",
                borderRadius: "12px",
                border: "1px solid var(--border)",
                background: "var(--bg-card)",
                color: "var(--text-primary)",
                cursor: "pointer",
              }}
            >
              <div style={{ textAlign: "left" }}>
                <div style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "2px" }}>Contas exibidas</div>
                <div style={{ fontSize: "14px", fontWeight: 600 }}>
                  {selectedAccounts.length === 0 ? "Selecione uma ou mais contas" : `${selectedAccounts.length} conta(s) selecionada(s)`}
                </div>
              </div>
              <ChevronDown size={16} />
            </button>

            <div style={{ marginTop: "8px", fontSize: "12px", color: "var(--text-muted)" }}>
              {hasSelectedAccounts ? (
                <>
                  Exibindo métricas de: <strong style={{ color: "var(--text-primary)" }}>{selectedAccountLabel}</strong>
                  {selectedAccounts.length > 3 ? ` + ${selectedAccounts.length - 3} conta(s)` : ""}
                </>
              ) : (
                <strong style={{ color: "var(--text-primary)" }}>Nenhuma conta selecionada ainda</strong>
              )}
            </div>

            {selectorOpen ? (
              <div
                style={{
                  position: "absolute",
                  top: "calc(100% + 8px)",
                  left: 0,
                  right: 0,
                  zIndex: 20,
                  padding: "12px",
                  borderRadius: "14px",
                  border: "1px solid var(--border)",
                  background: "var(--bg-card)",
                  boxShadow: "0 20px 50px rgba(0,0,0,0.35)",
                }}
              >
                <button
                  onClick={toggleAll}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "10px 12px",
                    borderRadius: "10px",
                    border: "none",
                    background: "rgba(234,88,12,0.08)",
                    color: "var(--text-primary)",
                    cursor: "pointer",
                    marginBottom: "10px",
                  }}
                >
                  <span>Selecionar todas</span>
                  <Check size={14} style={{ opacity: selectedAccountIds.length === accounts.length ? 1 : 0.3 }} />
                </button>

                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "10px" }}>
                  {selectedAccounts.slice(0, 5).map((account) => (
                    <span
                      key={account.id}
                      style={{
                        fontSize: "11px",
                        padding: "5px 8px",
                        borderRadius: "999px",
                        background: "rgba(234,88,12,0.12)",
                        color: "var(--text-primary)",
                        border: "1px solid rgba(234,88,12,0.18)",
                      }}
                    >
                      {account.name}
                    </span>
                  ))}
                </div>

                <div style={{ display: "grid", gap: "14px", maxHeight: "420px", overflowY: "auto", paddingRight: "3px" }}>
                  {platformOrder.map((platform) => {
                    const platformAccounts = accounts.filter((account) => account.platform === platform);
                    if (platformAccounts.length === 0) return null;

                    const color = platformColors[platform];
                    return (
                      <section key={platform} style={{ display: "grid", gap: "7px" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px", padding: "2px 3px" }}>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: "7px", color, fontSize: "11px", fontWeight: 800 }}>
                            <i style={{ width: "7px", height: "7px", borderRadius: "50%", background: color, boxShadow: `0 0 10px ${color}80` }} />
                            {getPlatformLabel(platform)}
                          </span>
                          <small style={{ color: "var(--text-muted)", fontSize: "10px", fontWeight: 700 }}>
                            {platformAccounts.length} perfil{platformAccounts.length === 1 ? "" : "is"}
                          </small>
                        </div>

                        {platformAccounts.map((account) => {
                          const checked = selectedAccountIds.includes(account.id);
                          return (
                            <button
                              key={account.id}
                              onClick={() => toggleAccount(account.id)}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "12px",
                                width: "100%",
                                padding: "10px 12px",
                                borderRadius: "10px",
                                border: `1px solid ${checked ? `${color}66` : "var(--border)"}`,
                                background: checked ? `color-mix(in srgb, ${color} 9%, transparent)` : "transparent",
                                color: "var(--text-primary)",
                                cursor: "pointer",
                                textAlign: "left",
                              }}
                            >
                              <div style={{ width: "34px", height: "34px", borderRadius: "10px", background: "var(--bg-secondary)", overflow: "hidden", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                {account.avatar ? (
                                  <img src={account.avatar} alt={account.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                ) : (
                                  account.name?.charAt(0)?.toUpperCase() ?? "A"
                                )}
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: "13px", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{account.name}</div>
                                <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>{account.username ? `@${account.username}` : "perfil"}</div>
                              </div>
                              <Check size={14} style={{ color, opacity: checked ? 1 : 0.2 }} />
                            </button>
                          );
                        })}
                      </section>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {activeTab === "organic" ? (
        <OrganicAnalytics selectedAccountIds={selectedAccountIds} />
      ) : (
        <AdsAnalytics
          selectedAccountIds={selectedFacebookAccountIds}
          selectedFacebookAccountId={selectedFacebookAccount?.id ?? null}
          selectedFacebookAccountName={selectedFacebookAccount?.name ?? null}
        />
      )}
    </>
  );
}
