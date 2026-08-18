"use client";

import { useEffect, useState } from "react";
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import {
  TrendingUp, TrendingDown, Users, Heart, Eye, Share2,
  ArrowRight, MoreHorizontal, Calendar, CheckCircle2,
  Clock, XCircle,
} from "lucide-react";
import { Topbar } from "@/components/layout/Topbar";
import { formatNumber, getPlatformLabel } from "@/lib/utils";
import { useTeam } from "@/components/providers/TeamProvider";
import Link from "next/link";

// ─── Mock Data ────────────────────────────────────────────────────────────────
// Engagement data is still mocked since no API provides this yet
const engagementData = [
  { day: "Seg", instagram: 1200, facebook: 800, linkedin: 400 },
  { day: "Ter", instagram: 1900, facebook: 1200, linkedin: 600 },
  { day: "Qua", instagram: 1500, facebook: 900, linkedin: 500 },
  { day: "Qui", instagram: 2400, facebook: 1600, linkedin: 800 },
  { day: "Sex", instagram: 2100, facebook: 1400, linkedin: 700 },
  { day: "Sáb", instagram: 2800, facebook: 1800, linkedin: 900 },
  { day: "Dom", instagram: 2600, facebook: 1700, linkedin: 850 },
];

const followersData = [
  { month: "Mar", seguidores: 12000 },
  { month: "Abr", seguidores: 13400 },
  { month: "Mai", seguidores: 15200 },
  { month: "Jun", seguidores: 16100 },
  { month: "Jul", seguidores: 18900 },
  { month: "Ago", seguidores: 21300 },
];

const platformColors: Record<string, string> = {
  instagram: "#e1306c",
  facebook: "#1877f2",
  linkedin: "#0a66c2",
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function MetricCard({
  title,
  value,
  change,
  changeType,
  icon: Icon,
  color,
}: {
  title: string;
  value: string;
  change: string;
  changeType: "up" | "down";
  icon: React.ElementType;
  color: string;
}) {
  return (
    <div
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        borderRadius: "14px",
        padding: "20px",
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        transition: "border-color 0.2s ease, transform 0.2s ease",
        cursor: "default",
      }}
      className="metric-card"
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <p style={{ fontSize: "13px", color: "var(--text-muted)", fontWeight: 500 }}>{title}</p>
        <div
          style={{
            width: "36px",
            height: "36px",
            borderRadius: "10px",
            background: `${color}18`,
            border: `1px solid ${color}30`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon size={16} style={{ color }} />
        </div>
      </div>
      <div>
        <p style={{ fontSize: "28px", fontWeight: 700, color: "var(--text-primary)", lineHeight: 1.1 }}>
          {value}
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: "4px", marginTop: "6px" }}>
          {changeType === "up" ? (
            <TrendingUp size={13} style={{ color: "#10b981" }} />
          ) : (
            <TrendingDown size={13} style={{ color: "#ef4444" }} />
          )}
          <span
            style={{
              fontSize: "12px",
              color: changeType === "up" ? "#10b981" : "#ef4444",
              fontWeight: 600,
            }}
          >
            {change}
          </span>
          <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>vs. semana passada</span>
        </div>
      </div>
    </div>
  );
}

function PlatformBadge({ platform }: { platform: string }) {
  const colors: Record<string, { bg: string; text: string }> = {
    INSTAGRAM: { bg: "rgba(225,48,108,0.15)", text: "#e1306c" },
    FACEBOOK: { bg: "rgba(24,119,242,0.15)", text: "#1877f2" },
    LINKEDIN: { bg: "rgba(10,102,194,0.15)", text: "#0a66c2" },
    TIKTOK: { bg: "rgba(255,255,255,0.1)", text: "#fff" },
    YOUTUBE: { bg: "rgba(255,0,0,0.15)", text: "#ff0000" },
  };
  const c = colors[platform] ?? { bg: "rgba(234,88,12,0.15)", text: "#ea580c" };
  return (
    <span
      style={{
        fontSize: "10px",
        fontWeight: 700,
        padding: "2px 7px",
        borderRadius: "20px",
        background: c.bg,
        color: c.text,
        letterSpacing: "0.04em",
        textTransform: "uppercase",
      }}
    >
      {getPlatformLabel(platform)}
    </span>
  );
}

const customTooltipStyle = {
  background: "var(--bg-card)",
  border: "1px solid var(--border)",
  borderRadius: "10px",
  padding: "10px 14px",
  fontSize: "12px",
  color: "var(--text-primary)",
  boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { teamId } = useTeam();
  const [metrics, setMetrics] = useState<any>(null);
  const [recentPosts, setRecentPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch dashboard metrics and posts
  useEffect(() => {
    if (!teamId) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        const [metricsRes, postsRes] = await Promise.all([
          fetch(`/api/dashboard/metrics?teamId=${teamId}`),
          fetch(`/api/posts?teamId=${teamId}`),
        ]);

        if (metricsRes.ok) {
          const metricsData = await metricsRes.json();
          setMetrics(metricsData);
        }

        if (postsRes.ok) {
          const postsData = await postsRes.json();
          // Filter for published posts only (for top posts display)
          setRecentPosts(postsData.filter((post: any) => post.status === "PUBLISHED"));
        }
      } catch (err) {
        console.error("Erro ao buscar dados do dashboard:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [teamId]);

  return (
    <>
      <Topbar
        title="Dashboard"
        subtitle="Bem-vindo! Aqui está um resumo das suas redes sociais."
      />

      <main
        style={{
          padding: "24px",
          display: "flex",
          flexDirection: "column",
          gap: "24px",
          flex: 1,
        }}
        className="animate-fade-in"
      >
        {/* Metric Cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "16px",
          }}
        >
          <MetricCard
            title="Contas Conectadas"
            value={String(metrics?.connectedAccounts ?? 0)}
            change="+0%"
            changeType="up"
            icon={Users}
            color="#ea580c"
          />
          <MetricCard
            title="Posts Publicados"
            value={String(metrics?.publishedPosts ?? 0)}
            change="+0%"
            changeType="up"
            icon={Eye}
            color="#9a3412"
          />
          <MetricCard
            title="Posts Agendados"
            value={String(metrics?.scheduledPosts ?? 0)}
            change="+0%"
            changeType="up"
            icon={Heart}
            color="#ec4899"
          />
          <MetricCard
            title="Posts Recentes"
            value={String(recentPosts.length)}
            change="+0%"
            changeType="up"
            icon={Share2}
            color="#f59e0b"
          />
        </div>

        {/* Charts Row */}
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "16px" }}>
          {/* Engagement Chart */}
          <div
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              borderRadius: "14px",
              padding: "20px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
              <div>
                <h2 style={{ fontSize: "15px", fontWeight: 700, color: "var(--text-primary)" }}>
                  Engajamento por Rede
                </h2>
                <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>
                  Últimos 7 dias
                </p>
              </div>
              <div style={{ display: "flex", gap: "6px" }}>
                {["7d", "30d", "90d"].map((p) => (
                  <button
                    key={p}
                    style={{
                      background: p === "7d" ? "rgba(234,88,12,0.2)" : "transparent",
                      border: p === "7d" ? "1px solid rgba(234,88,12,0.4)" : "1px solid var(--border)",
                      color: p === "7d" ? "#fb923c" : "var(--text-muted)",
                      borderRadius: "6px",
                      padding: "4px 10px",
                      fontSize: "12px",
                      fontWeight: 500,
                      cursor: "pointer",
                    }}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={engagementData}>
                <defs>
                  <linearGradient id="igGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#e1306c" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#e1306c" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="fbGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1877f2" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#1877f2" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="liGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0a66c2" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#0a66c2" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="day" stroke="var(--text-muted)" fontSize={11} />
                <YAxis stroke="var(--text-muted)" fontSize={11} tickFormatter={(v) => formatNumber(v)} />
                <Tooltip contentStyle={customTooltipStyle} formatter={(v: any) => formatNumber(v)} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "12px" }} />
                <Area type="monotone" dataKey="instagram" name="Instagram" stroke="#e1306c" fill="url(#igGrad)" strokeWidth={2} dot={false} />
                <Area type="monotone" dataKey="facebook" name="Facebook" stroke="#1877f2" fill="url(#fbGrad)" strokeWidth={2} dot={false} />
                <Area type="monotone" dataKey="linkedin" name="LinkedIn" stroke="#0a66c2" fill="url(#liGrad)" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Followers Growth */}
          <div
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              borderRadius: "14px",
              padding: "20px",
            }}
          >
            <h2 style={{ fontSize: "15px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "4px" }}>
              Crescimento de Seguidores
            </h2>
            <p style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "20px" }}>
              Últimos 6 meses
            </p>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={followersData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="month" stroke="var(--text-muted)" fontSize={11} />
                <YAxis stroke="var(--text-muted)" fontSize={11} tickFormatter={(v) => formatNumber(v)} />
                <Tooltip contentStyle={customTooltipStyle} formatter={(v: any) => [formatNumber(v), "Seguidores"]} />
                <Bar dataKey="seguidores" fill="url(#barGrad)" radius={[6, 6, 0, 0]} />
                <defs>
                  <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ea580c" />
                    <stop offset="100%" stopColor="#c2410c" />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bottom Row */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          {/* Top Posts */}
          <div
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              borderRadius: "14px",
              padding: "20px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
              <h2 style={{ fontSize: "15px", fontWeight: 700, color: "var(--text-primary)" }}>
                Top Posts
              </h2>
              <Link
                href="/calendar"
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "12px",
                  color: "#fb923c",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  fontWeight: 500,
                  textDecoration: "none",
                }}
              >
                Ver todos <ArrowRight size={12} />
              </Link>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {recentPosts.slice(0, 3).map((post) => (
                <div
                  key={post.id}
                  style={{
                    padding: "12px",
                    background: "var(--bg-secondary)",
                    borderRadius: "10px",
                    border: "1px solid var(--border)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                    <div
                      style={{
                        width: "38px",
                        height: "38px",
                        borderRadius: "8px",
                        background: "var(--bg-active)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "20px",
                        flexShrink: 0,
                      }}
                    >
                      📝
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                        <PlatformBadge platform={post.socialAccount?.platform || "INSTAGRAM"} />
                        <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                          {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString("pt-BR") : "Sem data"}
                        </span>
                      </div>
                      <p
                        style={{
                          fontSize: "12px",
                          color: "var(--text-secondary)",
                          overflow: "hidden",
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          lineHeight: 1.5,
                        }}
                      >
                        {post.content}
                      </p>
                      <div style={{ display: "flex", gap: "12px", marginTop: "8px" }}>
                        <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                          👁️ Por publicar
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {recentPosts.length === 0 && (
                <div style={{ textAlign: "center", padding: "20px", color: "var(--text-muted)" }}>
                  Nenhum post publicado ainda
                </div>
              )}
            </div>
          </div>

          {/* Scheduled Posts */}
          <div
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              borderRadius: "14px",
              padding: "20px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
              <h2 style={{ fontSize: "15px", fontWeight: 700, color: "var(--text-primary)" }}>
                Posts Agendados
              </h2>
              <span
                style={{
                  background: "rgba(234,88,12,0.15)",
                  color: "#fb923c",
                  fontSize: "11px",
                  fontWeight: 700,
                  padding: "3px 9px",
                  borderRadius: "20px",
                  border: "1px solid rgba(234,88,12,0.3)",
                }}
              >
                {metrics?.scheduledPosts ?? 0} agendados
              </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {recentPosts
                .filter((post: any) => post.status === "SCHEDULED")
                .slice(0, 3)
                .map((post: any, i: number) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      padding: "12px",
                      background: "var(--bg-secondary)",
                      borderRadius: "10px",
                      border: "1px solid var(--border)",
                    }}
                  >
                    <div style={{ textAlign: "center", minWidth: "40px" }}>
                      <p style={{ fontSize: "13px", fontWeight: 700, color: "#fb923c" }}>
                        {post.scheduledAt
                          ? new Date(post.scheduledAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
                          : "--:--"}
                      </p>
                      <Clock size={10} style={{ color: "var(--text-muted)" }} />
                    </div>
                    <div style={{ width: "1px", height: "32px", background: "var(--border)" }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <PlatformBadge platform={post.socialAccount?.platform || "INSTAGRAM"} />
                      <p
                        style={{
                          fontSize: "12px",
                          color: "var(--text-secondary)",
                          marginTop: "4px",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {post.content}
                      </p>
                    </div>
                    <div
                      style={{
                        width: "28px",
                        height: "28px",
                        borderRadius: "50%",
                        background: "rgba(245,158,11,0.15)",
                        border: "1px solid rgba(245,158,11,0.3)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Clock size={12} style={{ color: "#f59e0b" }} />
                    </div>
                  </div>
                ))}

              {recentPosts.filter((post: any) => post.status === "SCHEDULED").length === 0 && (
                <div style={{ textAlign: "center", padding: "20px", color: "var(--text-muted)" }}>
                  Nenhum post agendado
                </div>
              )}

              <Link
                href="/calendar"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  width: "100%",
                  padding: "10px",
                  background: "transparent",
                  border: "1px dashed var(--border-light)",
                  borderRadius: "10px",
                  color: "var(--text-muted)",
                  fontSize: "12px",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  marginTop: "2px",
                  textDecoration: "none",
                }}
              >
                <Calendar size={13} />
                Ver calendário completo
              </Link>
            </div>
          </div>
        </div>
      </main>

      <style>{`
        .metric-card:hover {
          border-color: rgba(234,88,12, 0.3) !important;
          transform: translateY(-2px);
        }
      `}</style>
    </>
  );
}
