"use client";

import { useState } from "react";
import {
  Image as ImageIcon, Video, Smile, Hash, AtSign, MapPin,
  Clock, Send, Save, ChevronDown, X, Plus, Eye,
  Instagram, Youtube, Linkedin, Facebook,
} from "lucide-react";
import { Topbar } from "@/components/layout/Topbar";
import { getPlatformLabel } from "@/lib/utils";

// ─── Mock connected accounts ──────────────────────────────────────────────────
const connectedAccounts = [
  { id: "1", platform: "INSTAGRAM", name: "Minha Empresa", username: "@minhaempresa", avatar: "🟣" },
  { id: "2", platform: "FACEBOOK", name: "Página da Empresa", username: "Página", avatar: "🔵" },
  { id: "3", platform: "LINKEDIN", name: "Empresa Ltda.", username: "Empresa", avatar: "🔷" },
  { id: "4", platform: "YOUTUBE", name: "Canal da Empresa", username: "@canalempresa", avatar: "🔴" },
];

const platformIcons: Record<string, React.ElementType> = {
  INSTAGRAM: Instagram,
  FACEBOOK: Facebook,
  LINKEDIN: Linkedin,
  YOUTUBE: Youtube,
};

const platformColors: Record<string, string> = {
  INSTAGRAM: "#e1306c",
  FACEBOOK: "#1877f2",
  LINKEDIN: "#0a66c2",
  TIKTOK: "#010101",
  YOUTUBE: "#ff0000",
};

const characterLimits: Record<string, number> = {
  INSTAGRAM: 2200,
  FACEBOOK: 63206,
  LINKEDIN: 3000,
  TIKTOK: 150,
  YOUTUBE: 5000,
};

// ─── Platform Preview ─────────────────────────────────────────────────────────
function PlatformPreview({
  platform,
  content,
  account,
}: {
  platform: string;
  content: string;
  account: (typeof connectedAccounts)[0] | undefined;
}) {
  const color = platformColors[platform] ?? "#6366f1";

  return (
    <div
      style={{
        background: "var(--bg-secondary)",
        border: "1px solid var(--border)",
        borderRadius: "12px",
        overflow: "hidden",
      }}
    >
      {/* Preview header */}
      <div
        style={{
          padding: "10px 14px",
          borderBottom: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          gap: "8px",
        }}
      >
        <div
          style={{
            width: "8px",
            height: "8px",
            borderRadius: "50%",
            background: color,
          }}
        />
        <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)" }}>
          Pré-visualização {getPlatformLabel(platform)}
        </span>
      </div>

      {/* Simulated post */}
      <div style={{ padding: "14px" }}>
        <div style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              background: `${color}20`,
              border: `2px solid ${color}40`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "18px",
              flexShrink: 0,
            }}
          >
            {account?.avatar ?? "🏢"}
          </div>
          <div>
            <p style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-primary)" }}>
              {account?.name ?? "Sua Conta"}
            </p>
            <p style={{ fontSize: "11px", color: "var(--text-muted)" }}>
              {account?.username ?? ""} · Agora
            </p>
          </div>
        </div>

        {content ? (
          <p
            style={{
              fontSize: "13px",
              color: "var(--text-secondary)",
              lineHeight: 1.6,
              whiteSpace: "pre-wrap",
            }}
          >
            {content}
          </p>
        ) : (
          <p style={{ fontSize: "13px", color: "var(--text-muted)", fontStyle: "italic" }}>
            O texto do post aparecerá aqui...
          </p>
        )}

        {/* Reaction bar */}
        <div
          style={{
            display: "flex",
            gap: "16px",
            marginTop: "12px",
            paddingTop: "10px",
            borderTop: "1px solid var(--border)",
          }}
        >
          {["❤️ Curtir", "💬 Comentar", "↗️ Compartilhar"].map((a) => (
            <span key={a} style={{ fontSize: "11px", color: "var(--text-muted)" }}>
              {a}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function ComposePage() {
  const [content, setContent] = useState("");
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  const [isScheduling, setIsScheduling] = useState(false);
  const [previewPlatform, setPreviewPlatform] = useState<string | null>(null);

  const toggleAccount = (id: string) => {
    setSelectedAccounts((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    );
  };

  const selectedAccountsData = connectedAccounts.filter((a) =>
    selectedAccounts.includes(a.id)
  );

  const activePreviewAccount = selectedAccountsData.find(
    (a) => a.platform === previewPlatform
  );

  // Character limit for most restrictive selected platform
  const limit = selectedAccountsData.length > 0
    ? Math.min(...selectedAccountsData.map((a) => characterLimits[a.platform] ?? 2200))
    : 2200;

  const charPercent = Math.min((content.length / limit) * 100, 100);
  const charColor = charPercent > 90 ? "#ef4444" : charPercent > 75 ? "#f59e0b" : "#10b981";

  return (
    <>
      <Topbar title="Criar Post" subtitle="Crie e agende posts para suas redes sociais" />

      <main
        style={{
          padding: "24px",
          display: "grid",
          gridTemplateColumns: "1fr 360px",
          gap: "20px",
          flex: 1,
          alignItems: "start",
        }}
        className="animate-fade-in"
      >
        {/* Left: Composer */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Account Selection */}
          <div
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              borderRadius: "14px",
              padding: "20px",
            }}
          >
            <h2 style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "14px" }}>
              Publicar em
            </h2>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
              {connectedAccounts.map((account) => {
                const isSelected = selectedAccounts.includes(account.id);
                const color = platformColors[account.platform] ?? "#6366f1";
                const Icon = platformIcons[account.platform];

                return (
                  <button
                    key={account.id}
                    id={`account-${account.id}`}
                    onClick={() => toggleAccount(account.id)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "8px 14px",
                      borderRadius: "10px",
                      border: isSelected ? `1.5px solid ${color}60` : "1.5px solid var(--border)",
                      background: isSelected ? `${color}15` : "var(--bg-secondary)",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <div
                      style={{
                        width: "28px",
                        height: "28px",
                        borderRadius: "50%",
                        background: isSelected ? `${color}25` : "var(--bg-card)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "14px",
                      }}
                    >
                      {account.avatar}
                    </div>
                    <div style={{ textAlign: "left" }}>
                      <p style={{ fontSize: "12px", fontWeight: 600, color: isSelected ? "var(--text-primary)" : "var(--text-secondary)" }}>
                        {account.name}
                      </p>
                      <p style={{ fontSize: "10px", color: "var(--text-muted)" }}>
                        {account.username}
                      </p>
                    </div>
                    {Icon && (
                      <Icon size={13} style={{ color: isSelected ? color : "var(--text-muted)", marginLeft: "2px" }} />
                    )}
                  </button>
                );
              })}

              <button
                id="connect-account-btn"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "8px 14px",
                  borderRadius: "10px",
                  border: "1.5px dashed var(--border-light)",
                  background: "transparent",
                  cursor: "pointer",
                  color: "var(--text-muted)",
                  fontSize: "12px",
                  transition: "all 0.15s ease",
                }}
              >
                <Plus size={13} />
                Conectar conta
              </button>
            </div>
          </div>

          {/* Content Editor */}
          <div
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              borderRadius: "14px",
              padding: "20px",
              display: "flex",
              flexDirection: "column",
              gap: "14px",
            }}
          >
            <h2 style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary)" }}>
              Conteúdo
            </h2>

            <textarea
              id="post-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Escreva seu post aqui... Use # para hashtags e @ para mencionar pessoas."
              rows={8}
              style={{
                width: "100%",
                background: "var(--bg-secondary)",
                border: "1px solid var(--border)",
                borderRadius: "10px",
                padding: "14px",
                color: "var(--text-primary)",
                fontSize: "14px",
                lineHeight: 1.7,
                resize: "vertical",
                outline: "none",
                fontFamily: "inherit",
                transition: "border-color 0.15s ease",
              }}
            />

            {/* Toolbar */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", gap: "4px" }}>
                {[
                  { icon: ImageIcon, label: "Adicionar imagem", id: "add-image-btn" },
                  { icon: Video, label: "Adicionar vídeo", id: "add-video-btn" },
                  { icon: Smile, label: "Emojis", id: "add-emoji-btn" },
                  { icon: Hash, label: "Hashtags", id: "add-hashtag-btn" },
                  { icon: AtSign, label: "Mencionar", id: "add-mention-btn" },
                  { icon: MapPin, label: "Local", id: "add-location-btn" },
                ].map(({ icon: Icon, label, id }) => (
                  <button
                    key={id}
                    id={id}
                    title={label}
                    style={{
                      width: "34px",
                      height: "34px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: "var(--bg-secondary)",
                      border: "1px solid var(--border)",
                      borderRadius: "8px",
                      cursor: "pointer",
                      color: "var(--text-muted)",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <Icon size={15} />
                  </button>
                ))}
              </div>

              {/* Character counter */}
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <svg width="28" height="28" viewBox="0 0 28 28">
                  <circle cx="14" cy="14" r="11" fill="none" stroke="var(--border)" strokeWidth="2.5" />
                  <circle
                    cx="14"
                    cy="14"
                    r="11"
                    fill="none"
                    stroke={charColor}
                    strokeWidth="2.5"
                    strokeDasharray={`${2 * Math.PI * 11}`}
                    strokeDashoffset={`${2 * Math.PI * 11 * (1 - charPercent / 100)}`}
                    strokeLinecap="round"
                    transform="rotate(-90 14 14)"
                    style={{ transition: "stroke-dashoffset 0.3s ease, stroke 0.3s ease" }}
                  />
                </svg>
                <span style={{ fontSize: "12px", color: charPercent > 90 ? charColor : "var(--text-muted)", fontWeight: 500 }}>
                  {limit - content.length}
                </span>
              </div>
            </div>
          </div>

          {/* Schedule */}
          <div
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              borderRadius: "14px",
              padding: "20px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
              <h2 style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary)" }}>
                Agendamento
              </h2>
              <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                <div
                  onClick={() => setIsScheduling(!isScheduling)}
                  style={{
                    width: "40px",
                    height: "22px",
                    borderRadius: "11px",
                    background: isScheduling ? "#6366f1" : "var(--bg-secondary)",
                    border: "1px solid var(--border)",
                    position: "relative",
                    cursor: "pointer",
                    transition: "background 0.2s ease",
                  }}
                >
                  <div
                    style={{
                      width: "16px",
                      height: "16px",
                      borderRadius: "50%",
                      background: "#fff",
                      position: "absolute",
                      top: "2px",
                      left: isScheduling ? "20px" : "2px",
                      transition: "left 0.2s ease",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
                    }}
                  />
                </div>
                <span style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
                  Agendar para depois
                </span>
              </label>
            </div>

            {isScheduling && (
              <div style={{ display: "flex", gap: "12px" }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: "block", fontSize: "12px", color: "var(--text-muted)", marginBottom: "6px" }}>
                    Data
                  </label>
                  <input
                    id="schedule-date"
                    type="date"
                    value={scheduleDate}
                    onChange={(e) => setScheduleDate(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "9px 12px",
                      background: "var(--bg-secondary)",
                      border: "1px solid var(--border)",
                      borderRadius: "8px",
                      color: "var(--text-primary)",
                      fontSize: "13px",
                      outline: "none",
                    }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: "block", fontSize: "12px", color: "var(--text-muted)", marginBottom: "6px" }}>
                    Horário
                  </label>
                  <input
                    id="schedule-time"
                    type="time"
                    value={scheduleTime}
                    onChange={(e) => setScheduleTime(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "9px 12px",
                      background: "var(--bg-secondary)",
                      border: "1px solid var(--border)",
                      borderRadius: "8px",
                      color: "var(--text-primary)",
                      fontSize: "13px",
                      outline: "none",
                    }}
                  />
                </div>
              </div>
            )}

            {!isScheduling && (
              <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>
                O post será publicado imediatamente ao clicar em "Publicar agora".
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div style={{ display: "flex", gap: "10px" }}>
            <button
              id="save-draft-btn"
              style={{
                flex: 1,
                padding: "12px",
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
                borderRadius: "10px",
                color: "var(--text-secondary)",
                fontSize: "14px",
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "7px",
                transition: "all 0.15s ease",
              }}
            >
              <Save size={15} />
              Salvar Rascunho
            </button>

            <button
              id="publish-btn"
              disabled={selectedAccounts.length === 0 || !content.trim()}
              style={{
                flex: 2,
                padding: "12px",
                background:
                  selectedAccounts.length === 0 || !content.trim()
                    ? "rgba(99,102,241,0.3)"
                    : "linear-gradient(135deg, #6366f1, #4f46e5)",
                border: "none",
                borderRadius: "10px",
                color: selectedAccounts.length === 0 || !content.trim() ? "rgba(255,255,255,0.4)" : "#fff",
                fontSize: "14px",
                fontWeight: 600,
                cursor: selectedAccounts.length === 0 || !content.trim() ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "7px",
                boxShadow: selectedAccounts.length > 0 && content.trim() ? "0 0 16px rgba(99,102,241,0.35)" : "none",
                transition: "all 0.15s ease",
              }}
            >
              {isScheduling ? <Clock size={15} /> : <Send size={15} />}
              {isScheduling ? "Agendar Post" : "Publicar Agora"}
            </button>
          </div>
        </div>

        {/* Right: Preview */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px", position: "sticky", top: "88px" }}>
          <div
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              borderRadius: "14px",
              padding: "20px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
              <Eye size={15} style={{ color: "#818cf8" }} />
              <h2 style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary)" }}>
                Pré-visualização
              </h2>
            </div>

            {selectedAccountsData.length > 0 ? (
              <>
                {/* Platform selector tabs */}
                <div style={{ display: "flex", gap: "6px", marginBottom: "14px", flexWrap: "wrap" }}>
                  {selectedAccountsData.map((account) => {
                    const color = platformColors[account.platform] ?? "#6366f1";
                    const isActive = previewPlatform === account.platform;
                    return (
                      <button
                        key={account.id}
                        onClick={() => setPreviewPlatform(isActive ? null : account.platform)}
                        style={{
                          padding: "5px 11px",
                          borderRadius: "20px",
                          border: isActive ? `1px solid ${color}50` : "1px solid var(--border)",
                          background: isActive ? `${color}18` : "var(--bg-secondary)",
                          color: isActive ? color : "var(--text-muted)",
                          fontSize: "11px",
                          fontWeight: 600,
                          cursor: "pointer",
                          transition: "all 0.15s ease",
                          textTransform: "uppercase",
                          letterSpacing: "0.04em",
                        }}
                      >
                        {getPlatformLabel(account.platform)}
                      </button>
                    );
                  })}
                </div>

                {(previewPlatform
                  ? selectedAccountsData.filter((a) => a.platform === previewPlatform)
                  : selectedAccountsData
                ).map((account) => (
                  <div key={account.id} style={{ marginBottom: "12px" }}>
                    <PlatformPreview
                      platform={account.platform}
                      content={content}
                      account={account}
                    />
                  </div>
                ))}
              </>
            ) : (
              <div
                style={{
                  padding: "32px 16px",
                  textAlign: "center",
                  border: "1px dashed var(--border-light)",
                  borderRadius: "10px",
                }}
              >
                <Eye size={28} style={{ color: "var(--text-muted)", margin: "0 auto 10px" }} />
                <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>
                  Selecione pelo menos uma conta para visualizar o preview
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
