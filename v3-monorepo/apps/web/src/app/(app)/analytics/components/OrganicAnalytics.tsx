"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { TrendingUp, Users, Eye, Heart, Share2, Download } from "lucide-react";
import { formatNumber } from "@/lib/utils";
import { useTeam } from "@/components/providers/TeamProvider";

const tooltipStyle = {
  background: "var(--bg-card)",
  border: "1px solid var(--border)",
  borderRadius: "10px",
  padding: "10px 14px",
  fontSize: "12px",
  color: "var(--text-primary)",
  boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
};

const periods = ["7 dias", "30 dias", "90 dias", "6 meses"];

type AnalyticsAccount = { platform: string };
type AnalyticsRecord = { date: string; reach: number; socialAccount?: { platform?: string } };
type AnalyticsPayload = {
  summary: { followers: number; reach: number; engagement: number; shares: number };
  records: AnalyticsRecord[];
  connectedAccounts: AnalyticsAccount[];
};

export function OrganicAnalytics() {
  const { teamId } = useTeam();
  const [period, setPeriod] = useState("30 dias");
  const [analytics, setAnalytics] = useState<AnalyticsPayload | null>(null);

  useEffect(() => {
    if (!teamId) return;

    fetch(`/api/analytics?teamId=${teamId}`)
      .then((response) => (response.ok ? response.json() : Promise.reject(new Error("Falha ao carregar analytics"))))
      .then(setAnalytics)
      .catch((error) => console.error("Erro ao carregar analytics:", error));
  }, [teamId]);

  const summary = analytics?.summary ?? { followers: 0, reach: 0, engagement: 0, shares: 0 };

  const reachData = useMemo(() => {
    const records = analytics?.records ?? [];
    const rows = new Map<string, { date: string; instagram: number; facebook: number; linkedin: number }>();

    for (const record of records) {
      const date = new Date(record.date).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
      const current = rows.get(date) ?? { date, instagram: 0, facebook: 0, linkedin: 0 };
      const platform = String(record.socialAccount?.platform ?? "").toLowerCase();

      if (platform === "instagram") current.instagram += record.reach ?? 0;
      if (platform === "facebook") current.facebook += record.reach ?? 0;
      if (platform === "linkedin") current.linkedin += record.reach ?? 0;

      rows.set(date, current);
    }

    return [...rows.values()].slice(-7);
  }, [analytics]);

  const pieData = useMemo(() => {
    const counts = (analytics?.connectedAccounts ?? []).reduce<Record<string, number>>((acc, account) => {
      const key = String(account.platform ?? "").toLowerCase();
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {});

    const total = Object.values(counts).reduce<number>((sum, value) => sum + value, 0);
    if (!total) return [];

    return [
      { name: "Instagram", value: Math.round(((counts.instagram ?? 0) / total) * 100), color: "#e1306c" },
      { name: "Facebook", value: Math.round(((counts.facebook ?? 0) / total) * 100), color: "#1877f2" },
      { name: "LinkedIn", value: Math.round(((counts.linkedin ?? 0) / total) * 100), color: "#0a66c2" },
    ].filter((item) => item.value > 0);
  }, [analytics]);

  const topHashtags: Array<{ tag: string; posts: number; reach: number }> = [];

  return (
    <>
      {/* ── Print-only cover header ── */}
      <div className="print-header">
        <div className="print-logo-box">
          <div className="print-logo-icon">M</div>
          <div className="print-logo-text">
            <h1>MarkLabs</h1>
            <p>Plataforma de Gerenciamento de Redes Sociais</p>
          </div>
        </div>
        <div className="print-header-meta">
          <div>
            <p className="print-header-meta-label">Relatório de Analytics</p>
            <p className="print-header-meta-value">Período: {period}</p>
          </div>
          <div style={{ textAlign: "right" }}>
            <p className="print-header-meta-label">Gerado em</p>
            <p className="print-header-meta-value">{new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}</p>
          </div>
          <div style={{ textAlign: "right" }}>
            <p className="print-header-meta-label">Contas conectadas</p>
            <p className="print-header-meta-value">{analytics?.connectedAccounts?.length ?? 0} conta(s)</p>
          </div>
        </div>
      </div>

      {/* ── Print-only KPI section ── */}
      <div className="print-body no-screen">
        <p className="print-section-title">Métricas de Desempenho</p>
        <div className="print-kpi-grid">
          {[
            { label: "Alcance Total", value: formatNumber(summary.reach) },
            { label: "Novos Seguidores", value: formatNumber(summary.followers) },
            { label: "Engajamento Total", value: formatNumber(summary.engagement) },
            { label: "Compartilhamentos", value: formatNumber(summary.shares) },
          ].map((kpi) => (
            <div key={kpi.label} className="print-kpi-card">
              <p className="print-kpi-label">{kpi.label}</p>
              <p className="print-kpi-value">{kpi.value}</p>
              <span className="print-kpi-badge">↑ Período atual</span>
            </div>
          ))}
        </div>
      </div>

      {/* Screen-only content */}

      <main style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "24px", flex: 1 }} className="animate-fade-in print-content">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", gap: "6px", background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "10px", padding: "4px" }}>
            {periods.map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                style={{
                  padding: "7px 14px",
                  borderRadius: "7px",
                  border: "none",
                  background: period === p ? "linear-gradient(135deg, #ea580c, #c2410c)" : "transparent",
                  color: period === p ? "#fff" : "var(--text-muted)",
                  fontSize: "13px",
                  fontWeight: period === p ? 600 : 400,
                  cursor: "pointer",
                }}
              >
                {p}
              </button>
            ))}
          </div>

          <button
            onClick={() => window.print()}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "7px",
              padding: "9px 16px",
              background: "linear-gradient(135deg, #ea580c, #c2410c)",
              border: "none",
              borderRadius: "10px",
              color: "#fff",
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer",
            }}
            className="no-print"
          >
            <Download size={14} />
            Exportar relatório em PDF
          </button>
        </div>

        {/* Screen KPI cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "14px" }}>
          {[
            { title: "Alcance Total", value: formatNumber(summary.reach), icon: Eye, color: "#ea580c" },
            { title: "Total de Seguidores", value: formatNumber(summary.followers), icon: Users, color: "#9a3412" },
            { title: "Engajamento Total", value: formatNumber(summary.engagement), icon: Heart, color: "#ec4899" },
            { title: "Compartilhamentos", value: formatNumber(summary.shares), icon: Share2, color: "#f59e0b" },
          ].map((kpi) => (
            <div key={kpi.title} style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "14px", padding: "18px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                <p style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: 500 }}>{kpi.title}</p>
                <div style={{ width: "32px", height: "32px", borderRadius: "9px", background: `${kpi.color}18`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <kpi.icon size={14} style={{ color: kpi.color }} />
                </div>
              </div>
              <p style={{ fontSize: "26px", fontWeight: 700, color: "var(--text-primary)" }}>{kpi.value}</p>
              <div style={{ display: "flex", alignItems: "center", gap: "4px", marginTop: "4px" }}>
                <TrendingUp size={11} style={{ color: "#10b981" }} />
                <span style={{ fontSize: "11px", color: "#10b981", fontWeight: 600 }}>Atual</span>
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "16px" }}>
          <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "14px", padding: "20px" }}>
            <h2 style={{ fontSize: "15px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "4px" }}>Alcance por Rede</h2>
            <p style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "20px" }}>{period}</p>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={reachData}>
                <defs>
                  <linearGradient id="igReach" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#e1306c" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#e1306c" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="fbReach" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1877f2" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#1877f2" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="liReach" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0a66c2" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#0a66c2" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={11} />
                <YAxis stroke="var(--text-muted)" fontSize={11} tickFormatter={formatNumber} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => formatNumber(v as number)} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "12px" }} />
                <Area type="monotone" dataKey="instagram" name="Instagram" stroke="#e1306c" fill="url(#igReach)" strokeWidth={2} dot={false} />
                <Area type="monotone" dataKey="facebook" name="Facebook" stroke="#1877f2" fill="url(#fbReach)" strokeWidth={2} dot={false} />
                <Area type="monotone" dataKey="linkedin" name="LinkedIn" stroke="#0a66c2" fill="url(#liReach)" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "14px", padding: "20px" }}>
            <h2 style={{ fontSize: "15px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "4px" }}>Distribuição por Plataforma</h2>
            <p style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "16px" }}>% das contas conectadas</p>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                  {pieData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => [`${v}%`, "Contas"]} />
              </PieChart>
            </ResponsiveContainer>
            {pieData.length === 0 ? (
              <p style={{ color: "var(--text-muted)", fontSize: "13px" }}>Nenhuma conta conectada ainda.</p>
            ) : null}
          </div>
        </div>

        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "14px", padding: "20px" }}>
          <h2 style={{ fontSize: "15px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "16px" }}>Top Hashtags</h2>
          {topHashtags.length === 0 ? (
            <p style={{ color: "var(--text-muted)", fontSize: "13px" }}>Ainda não há dados reais de hashtags disponíveis.</p>
          ) : null}
        </div>

        {/* Print-only footer */}
        <div className="print-footer no-screen">
          <p className="print-footer-left">Gerado por MarkLabs · marklabs.com.br · Todos os dados são referentes ao período selecionado.</p>
          <p className="print-footer-brand">MarkLabs Analytics Report</p>
        </div>
      </main>
    </>
  );
}

