"use client";

import { useState } from "react";
import {
  Instagram, Youtube, Linkedin, Facebook, CheckCircle2, XCircle,
  RefreshCw, Trash2, Plus, Settings, Key, Bell, Globe,
} from "lucide-react";
import { Topbar } from "@/components/layout/Topbar";
import { getPlatformLabel } from "@/lib/utils";

const platforms = [
  { id: "INSTAGRAM", name: "Instagram", icon: Instagram, color: "#e1306c", connected: true, username: "@minhaempresa", followers: "12.4K", avatar: "🟣" },
  { id: "FACEBOOK", name: "Facebook", icon: Facebook, color: "#1877f2", connected: true, username: "Página da Empresa", followers: "8.1K", avatar: "🔵" },
  { id: "LINKEDIN", name: "LinkedIn", icon: Linkedin, color: "#0a66c2", connected: true, username: "Empresa Ltda.", followers: "3.2K", avatar: "🔷" },
  { id: "TIKTOK", name: "TikTok", icon: () => <span style={{ fontSize: "14px" }}>♪</span>, color: "#010101", connected: false, username: null, followers: null, avatar: null },
  { id: "YOUTUBE", name: "YouTube", icon: Youtube, color: "#ff0000", connected: false, username: null, followers: null, avatar: null },
];

const settingsTabs = [
  { id: "accounts", label: "Contas Sociais", icon: Globe },
  { id: "notifications", label: "Notificações", icon: Bell },
  { id: "api", label: "API & Integrações", icon: Key },
  { id: "general", label: "Geral", icon: Settings },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("accounts");
  const [connectedPlatforms, setConnectedPlatforms] = useState(
    platforms.reduce<Record<string, boolean>>((acc, p) => { acc[p.id] = p.connected; return acc; }, {})
  );

  return (
    <>
      <Topbar title="Configurações" subtitle="Gerencie contas, integrações e preferências" />

      <main style={{ padding: "24px", display: "grid", gridTemplateColumns: "200px 1fr", gap: "20px", flex: 1, alignItems: "start" }} className="animate-fade-in">
        {/* Sidebar tabs */}
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          {settingsTabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              id={`settings-tab-${id}`}
              onClick={() => setActiveTab(id)}
              style={{
                display: "flex", alignItems: "center", gap: "9px", padding: "9px 12px", borderRadius: "9px",
                border: "none", background: activeTab === id ? "rgba(99,102,241,0.15)" : "transparent",
                color: activeTab === id ? "#818cf8" : "var(--text-secondary)", fontSize: "13px",
                fontWeight: activeTab === id ? 600 : 400, cursor: "pointer", textAlign: "left",
                transition: "all 0.15s ease",
              }}
            >
              <Icon size={14} style={{ color: activeTab === id ? "#818cf8" : "var(--text-muted)" }} />
              {label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div>
          {activeTab === "accounts" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "14px", padding: "20px" }}>
                <h2 style={{ fontSize: "15px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "6px" }}>
                  Contas Conectadas
                </h2>
                <p style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "20px" }}>
                  Conecte suas redes sociais para começar a publicar e monitorar métricas.
                </p>

                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {platforms.map((platform) => {
                    const isConnected = connectedPlatforms[platform.id];
                    const Icon = platform.icon;
                    return (
                      <div
                        key={platform.id}
                        id={`platform-${platform.id}`}
                        style={{
                          display: "flex", alignItems: "center", gap: "14px", padding: "16px",
                          background: "var(--bg-secondary)", borderRadius: "12px",
                          border: isConnected ? `1px solid ${platform.color}30` : "1px solid var(--border)",
                        }}
                      >
                        {/* Platform icon */}
                        <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: `${platform.color}15`, border: `1px solid ${platform.color}30`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <Icon size={20} style={{ color: platform.color }} />
                        </div>

                        {/* Info */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <p style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary)" }}>
                              {getPlatformLabel(platform.id)}
                            </p>
                            {isConnected ? (
                              <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "11px", color: "#10b981", background: "rgba(16,185,129,0.12)", padding: "2px 8px", borderRadius: "20px", border: "1px solid rgba(16,185,129,0.25)" }}>
                                <CheckCircle2 size={10} /> Conectado
                              </span>
                            ) : (
                              <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "11px", color: "var(--text-muted)", background: "var(--bg-card)", padding: "2px 8px", borderRadius: "20px", border: "1px solid var(--border)" }}>
                                <XCircle size={10} /> Não conectado
                              </span>
                            )}
                          </div>
                          {isConnected ? (
                            <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>
                              {platform.username} · {platform.followers} seguidores
                            </p>
                          ) : (
                            <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>
                              Clique em "Conectar" para vincular sua conta
                            </p>
                          )}
                        </div>

                        {/* Actions */}
                        <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
                          {isConnected ? (
                            <>
                              <button
                                id={`reconnect-${platform.id}`}
                                title="Reconectar"
                                style={{ width: "34px", height: "34px", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "8px", cursor: "pointer", color: "var(--text-muted)", transition: "all 0.15s ease" }}
                              >
                                <RefreshCw size={13} />
                              </button>
                              <button
                                id={`disconnect-${platform.id}`}
                                title="Desconectar"
                                onClick={() => setConnectedPlatforms((prev) => ({ ...prev, [platform.id]: false }))}
                                style={{ width: "34px", height: "34px", display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: "8px", cursor: "pointer", color: "#ef4444", transition: "all 0.15s ease" }}
                              >
                                <Trash2 size={13} />
                              </button>
                            </>
                          ) : (
                            <button
                              id={`connect-${platform.id}`}
                              onClick={() => setConnectedPlatforms((prev) => ({ ...prev, [platform.id]: true }))}
                              style={{
                                display: "flex", alignItems: "center", gap: "6px", padding: "7px 14px",
                                background: `${platform.color}15`, border: `1px solid ${platform.color}40`,
                                borderRadius: "8px", color: platform.color, fontSize: "12px", fontWeight: 600,
                                cursor: "pointer", transition: "all 0.15s ease",
                              }}
                            >
                              <Plus size={12} />
                              Conectar
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {activeTab === "notifications" && (
            <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "14px", padding: "24px" }}>
              <h2 style={{ fontSize: "15px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "20px" }}>Notificações</h2>
              {[
                { id: "post-published", label: "Post publicado com sucesso", desc: "Receba um email quando um post for publicado" },
                { id: "post-failed", label: "Falha na publicação", desc: "Receba um alerta quando um post falhar" },
                { id: "new-member", label: "Novo membro na equipe", desc: "Notificação quando alguém aceitar um convite" },
                { id: "weekly-report", label: "Relatório semanal", desc: "Resumo semanal das suas métricas por email" },
              ].map((notif) => (
                <div key={notif.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 0", borderBottom: "1px solid var(--border)" }}>
                  <div>
                    <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)" }}>{notif.label}</p>
                    <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>{notif.desc}</p>
                  </div>
                  <div style={{ width: "40px", height: "22px", borderRadius: "11px", background: "#6366f1", border: "1px solid rgba(99,102,241,0.4)", position: "relative", cursor: "pointer" }}>
                    <div style={{ width: "16px", height: "16px", borderRadius: "50%", background: "#fff", position: "absolute", top: "2px", right: "2px", boxShadow: "0 1px 3px rgba(0,0,0,0.3)" }} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === "api" && (
            <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "14px", padding: "24px" }}>
              <h2 style={{ fontSize: "15px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "6px" }}>API & Integrações</h2>
              <p style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "20px" }}>
                Configure as chaves de API para integração com as plataformas sociais.
              </p>
              {[
                { label: "Meta App ID", key: "META_APP_ID", placeholder: "Seu Facebook App ID" },
                { label: "Meta App Secret", key: "META_APP_SECRET", placeholder: "••••••••••••••••" },
                { label: "LinkedIn Client ID", key: "LINKEDIN_CLIENT_ID", placeholder: "Seu LinkedIn Client ID" },
                { label: "Cloudinary Cloud Name", key: "CLOUDINARY_CLOUD_NAME", placeholder: "Seu cloud name" },
              ].map((field) => (
                <div key={field.key} style={{ marginBottom: "14px" }}>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "var(--text-secondary)", marginBottom: "6px" }}>{field.label}</label>
                  <input
                    id={`api-${field.key}`}
                    type="text"
                    placeholder={field.placeholder}
                    style={{ width: "100%", padding: "10px 14px", background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: "9px", color: "var(--text-primary)", fontSize: "13px", outline: "none", fontFamily: "monospace" }}
                  />
                </div>
              ))}
              <button id="save-api-btn" style={{ marginTop: "8px", padding: "10px 20px", background: "linear-gradient(135deg, #6366f1, #4f46e5)", border: "none", borderRadius: "9px", color: "#fff", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>
                Salvar configurações
              </button>
            </div>
          )}

          {activeTab === "general" && (
            <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "14px", padding: "24px" }}>
              <h2 style={{ fontSize: "15px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "20px" }}>Configurações Gerais</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {[
                  { label: "Nome da Empresa", value: "Minha Empresa Ltda." },
                  { label: "Email de contato", value: "admin@minhaempresa.com" },
                  { label: "Fuso horário", value: "America/Sao_Paulo (UTC-3)" },
                ].map((f) => (
                  <div key={f.label}>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "var(--text-secondary)", marginBottom: "6px" }}>{f.label}</label>
                    <input defaultValue={f.value} style={{ width: "100%", padding: "10px 14px", background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: "9px", color: "var(--text-primary)", fontSize: "13px", outline: "none" }} />
                  </div>
                ))}
                <button id="save-general-btn" style={{ alignSelf: "flex-start", padding: "10px 20px", background: "linear-gradient(135deg, #6366f1, #4f46e5)", border: "none", borderRadius: "9px", color: "#fff", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>
                  Salvar
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
