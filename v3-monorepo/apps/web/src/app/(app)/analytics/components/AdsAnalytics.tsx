"use client";

import { useEffect, useState, useCallback } from "react";
import {
  AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import {
  TrendingUp, DollarSign, MousePointerClick, Eye, Percent,
  Target, BarChart2, Zap, ArrowUpRight, ArrowDownRight, RefreshCw, AlertCircle, Loader2, Download,
} from "lucide-react";
import { useTeam } from "@/components/providers/TeamProvider";

function fmtBRL(n: number) {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 2 });
}
function fmt(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

const PERIODS = ["7 dias", "30 dias", "90 dias", "6 meses"];

const PIE_COLORS = ["#00d4ff", "#fb923c", "#a78bfa", "#34d399", "#f472b6"];

const STATUS_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  ACTIVE:   { bg: "rgba(52,211,153,0.15)",  color: "#34d399", label: "Ativo" },
  PAUSED:   { bg: "rgba(251,191,36,0.15)",  color: "#fbbf24", label: "Pausado" },
  DELETED:  { bg: "rgba(239,68,68,0.15)",   color: "#f87171", label: "Deletado" },
  ARCHIVED: { bg: "rgba(161,161,170,0.15)", color: "#a1a1aa", label: "Arquivado" },
};

const TOOLTIP_STYLE = {
  background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "10px",
  padding: "10px 14px", fontSize: "12px", color: "var(--text-primary)",
  boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
};

type MetaAdsData = {
  adAccountId: string;
  period: string;
  since: string;
  until: string;
  chartData: Array<{ date: string; spend: number; impressoes: number; cliques: number; ctr: number; cpm: number; cpc: number }>;
  totals: { spend: number; impressions: number; clicks: number };
  campaigns: Array<{ id: string; name: string; status: string; spend: number; impressions: number; clicks: number; ctr: number; cpc: number; cpm: number; reach: number }>;
};

export function AdsAnalytics() {
  const { teamId } = useTeam();
  const [period, setPeriod] = useState("30 dias");
  const [data, setData] = useState<MetaAdsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (p: string) => {
    if (!teamId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/meta-ads?teamId=${teamId}&period=${encodeURIComponent(p)}`);
      const json = await res.json();
      if (!res.ok) { setError(json.error || "Erro ao carregar dados."); return; }
      setData(json);
    } catch {
      setError("Falha ao conectar com a API.");
    } finally {
      setLoading(false);
    }
  }, [teamId]);

  useEffect(() => { load(period); }, [period, load]);

  const totals = data?.totals ?? { spend: 0, impressions: 0, clicks: 0 };
  const ctr = totals.impressions > 0 ? (totals.clicks / totals.impressions * 100) : 0;
  const cpm = totals.impressions > 0 ? (totals.spend / totals.impressions * 1000) : 0;
  const cpc = totals.clicks > 0 ? (totals.spend / totals.clicks) : 0;

  const KPIs = [
    { label: "Gasto Total",   value: fmtBRL(totals.spend),       icon: DollarSign,      color: "#00d4ff", glow: "rgba(0,212,255,0.25)" },
    { label: "Impressões",    value: fmt(totals.impressions),     icon: Eye,             color: "#f472b6", glow: "rgba(244,114,182,0.25)" },
    { label: "Cliques",       value: fmt(totals.clicks),          icon: MousePointerClick, color: "#34d399", glow: "rgba(52,211,153,0.25)" },
    { label: "CTR",           value: `${ctr.toFixed(2)}%`,        icon: Target,          color: "#fbbf24", glow: "rgba(251,191,36,0.25)" },
    { label: "CPM",           value: fmtBRL(cpm),                 icon: BarChart2,       color: "#60a5fa", glow: "rgba(96,165,250,0.25)" },
    { label: "CPC",           value: fmtBRL(cpc),                 icon: Zap,             color: "#f87171", glow: "rgba(248,113,113,0.25)" },
    { label: "Campanhas",     value: String(data?.campaigns.length ?? 0), icon: TrendingUp, color: "#a78bfa", glow: "rgba(167,139,250,0.25)" },
    { label: "Alcance Total", value: fmt(data?.campaigns.reduce((s, c) => s + c.reach, 0) ?? 0), icon: Percent, color: "#fb923c", glow: "rgba(251,146,60,0.25)" },
  ];

  // Pie data from campaigns by spend
  const pieData = (data?.campaigns ?? [])
    .filter(c => c.spend > 0)
    .slice(0, 5)
    .map((c, i) => ({ name: c.name, value: c.spend, color: PIE_COLORS[i] }));

  const totalPieSpend = pieData.reduce((s, d) => s + d.value, 0);

  // Top 5 campaigns by CTR for bar chart
  const topCTR = [...(data?.campaigns ?? [])].sort((a, b) => b.ctr - a.ctr).slice(0, 5);
  const maxCTR = topCTR[0]?.ctr || 1;

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
            <p className="print-header-meta-label">Relatório de Meta Ads</p>
            <p className="print-header-meta-value">Período: {period}</p>
          </div>
          <div style={{ textAlign: "right" }}>
            <p className="print-header-meta-label">Gerado em</p>
            <p className="print-header-meta-value">{new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}</p>
          </div>
          <div style={{ textAlign: "right" }}>
            <p className="print-header-meta-label">Conta de Anúncios</p>
            <p className="print-header-meta-value">{data?.adAccountId || "—"}</p>
          </div>
        </div>
      </div>

      {/* ── Print-only KPI section ── */}
      <div className="print-body no-screen">
        <p className="print-section-title">Métricas de Desempenho (Ads)</p>
        <div className="print-kpi-grid">
          {[ 
            { label: "Gasto Total", value: fmtBRL(totals.spend) },
            { label: "Impressões", value: fmt(totals.impressions) },
            { label: "Cliques", value: fmt(totals.clicks) },
            { label: "CTR", value: `${ctr.toFixed(2)}%` },
            { label: "CPM", value: fmtBRL(cpm) },
            { label: "CPC", value: fmtBRL(cpc) },
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

      <main style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "20px", flex: 1 }} className="animate-fade-in print-content">

        {/* Header bar */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", gap: "6px", background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: "10px", padding: "4px" }}>
            {PERIODS.map((p) => (
              <button key={p} onClick={() => setPeriod(p)} style={{
                padding: "7px 16px", borderRadius: "7px", border: "none", cursor: "pointer", fontSize: "12px", fontWeight: 600,
                background: period === p ? "linear-gradient(135deg, #00b4d8, #0077b6)" : "transparent",
                color: period === p ? "#fff" : "var(--text-muted)",
                boxShadow: period === p ? "0 0 16px rgba(0,180,216,0.3)" : "none",
                transition: "all 0.2s ease",
              }}>{p}</button>
            ))}
          </div>

          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            {data && (
              <div style={{ display: "flex", alignItems: "center", gap: "6px", padding: "6px 12px", background: "rgba(52,211,153,0.08)", border: "1px solid rgba(52,211,153,0.2)", borderRadius: "8px" }}>
                <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#34d399", boxShadow: "0 0 6px #34d399" }} />
                <span style={{ fontSize: "11px", fontWeight: 600, color: "#34d399" }}>
                  {data.since} → {data.until} · {data.adAccountId}
                </span>
              </div>
            )}
            <button onClick={() => load(period)} disabled={loading} style={{
              display: "flex", alignItems: "center", gap: "6px", padding: "7px 14px",
              background: "var(--bg-secondary)", border: "1px solid var(--border-light)",
              borderRadius: "8px", color: "var(--text-secondary)", fontSize: "12px", cursor: "pointer",
            }}>
              <RefreshCw size={12} style={{ animation: loading ? "spin 1s linear infinite" : "none" }} />
              Atualizar
            </button>

            <button onClick={() => window.print()} style={{
              display: "flex", alignItems: "center", gap: "7px", padding: "8px 16px",
              background: "linear-gradient(135deg, #00d4ff, #0077b6)", border: "none",
              borderRadius: "8px", color: "#fff", fontSize: "12px", fontWeight: 600, cursor: "pointer",
            }} className="no-print">
              <Download size={14} />
              Exportar PDF
            </button>
          </div>
        </div>

        {/* Error state */}
        {error && (
          <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "16px 20px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "12px" }}>
            <AlertCircle size={18} style={{ color: "#f87171", flexShrink: 0 }} />
            <div>
              <p style={{ fontSize: "13px", fontWeight: 600, color: "#f87171", marginBottom: "2px" }}>Erro ao carregar dados do Meta Ads</p>
              <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>{error}</p>
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "60px", gap: "12px", color: "var(--text-secondary)" }}>
            <Loader2 size={22} style={{ animation: "spin 1s linear infinite" }} />
            <span style={{ fontSize: "13px" }}>Buscando dados na Marketing API do Meta...</span>
          </div>
        )}

        {!loading && !error && data && (
          <>
            {/* KPI Grid */}
            <div className="no-print" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px" }}>
              {KPIs.map((kpi) => (
                <div key={kpi.label} className="meta-kpi-card" style={{
                  background: "var(--bg-card)",
                  border: "1px solid var(--border)", borderRadius: "16px", padding: "18px 20px",
                  position: "relative", overflow: "hidden", transition: "all 0.2s ease",
                }}>
                  <div style={{ position: "absolute", top: "-20px", right: "-20px", width: "80px", height: "80px", borderRadius: "50%", background: kpi.glow, filter: "blur(24px)", pointerEvents: "none" }} />
                  <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: `${kpi.color}18`, border: `1px solid ${kpi.color}30`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "12px" }}>
                    <kpi.icon size={16} style={{ color: kpi.color }} />
                  </div>
                  <p style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 500, marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.08em" }}>{kpi.label}</p>
                  <p style={{ fontSize: "22px", fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.5px", lineHeight: 1 }}>{kpi.value}</p>
                </div>
              ))}
            </div>

            {/* Charts row */}
            <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: "16px" }}>
              {/* Spend area chart */}
              <div className="print-chart-box print-text-dark" style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "16px", padding: "22px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                  <div>
                    <h2 style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "3px" }}>Gasto Diário</h2>
                    <p style={{ fontSize: "12px", color: "var(--text-secondary)" }}>{period} — em R$</p>
                  </div>
                  <div style={{ display: "flex", gap: "14px" }}>
                    {[{ label: "Gasto", color: "#00d4ff" }, { label: "Cliques", color: "#fb923c" }].map((l) => (
                      <div key={l.label} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: l.color, boxShadow: `0 0 6px ${l.color}` }} />
                        <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>{l.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={data.chartData} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                    <defs>
                      <linearGradient id="gradSpend" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#00d4ff" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#00d4ff" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gradClicks" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#fb923c" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#fb923c" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="date" stroke="var(--text-secondary)" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis stroke="var(--text-secondary)" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `R$${v}`} />
                    <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: any, name) => [name === "spend" ? fmtBRL(v) : fmt(v), name === "spend" ? "Gasto" : "Cliques"]} />
                    <Area type="monotone" dataKey="spend" stroke="#00d4ff" strokeWidth={2} fill="url(#gradSpend)" dot={false} />
                    <Area type="monotone" dataKey="cliques" stroke="#fb923c" strokeWidth={2} fill="url(#gradClicks)" dot={false} yAxisId={0} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* CTR por campanha — barras */}
              <div className="print-chart-box print-text-dark" style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "16px", padding: "22px" }}>
                <h2 style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "4px" }}>CTR por Campanha</h2>
                <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: "20px" }}>Top {topCTR.length} campanhas</p>
                <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                  {topCTR.length === 0 && <p style={{ fontSize: "12px", color: "var(--text-secondary)" }}>Nenhuma campanha com dados no período.</p>}
                  {topCTR.map((c, i) => (
                    <div key={c.id}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
                        <span style={{ fontSize: "11px", color: "var(--text-secondary)", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "70%" }}>{c.name}</span>
                        <span style={{ fontSize: "11px", fontWeight: 700, color: i === 0 ? "#00d4ff" : "var(--text-primary)" }}>{c.ctr.toFixed(2)}%</span>
                      </div>
                      <div style={{ height: "5px", borderRadius: "20px", background: "var(--bg-hover)", overflow: "hidden" }}>
                        <div style={{
                          height: "100%",
                          width: `${(c.ctr / maxCTR) * 100}%`,
                          background: i === 0 ? "linear-gradient(90deg, #00b4d8, #00d4ff)"
                            : i === 1 ? "linear-gradient(90deg, #ea580c, #fb923c)"
                            : "linear-gradient(90deg, #6d28d9, #a78bfa)",
                          borderRadius: "20px",
                          boxShadow: i === 0 ? "0 0 8px rgba(0,212,255,0.5)" : "none",
                          transition: "width 0.8s ease",
                        }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom row */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "16px" }}>
              {/* Pie — gasto por campanha */}
              <div className="print-chart-box print-text-dark" style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "16px", padding: "22px" }}>
                <h2 style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "4px" }}>Gasto por Campanha</h2>
                <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: "12px" }}>Distribuição do orçamento</p>
                {pieData.length === 0 ? (
                  <p style={{ fontSize: "12px", color: "var(--text-secondary)" }}>Sem dados de gasto no período.</p>
                ) : (
                  <>
                    <ResponsiveContainer width="100%" height={160}>
                      <PieChart>
                        <Pie data={pieData} cx="50%" cy="50%" innerRadius={44} outerRadius={70} paddingAngle={3} dataKey="value" strokeWidth={0}>
                          {pieData.map((entry, index) => (
                            <Cell key={index} fill={entry.color} style={{ filter: `drop-shadow(0 0 6px ${entry.color}60)` }} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: any) => [fmtBRL(v), "Gasto"]} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div style={{ display: "flex", flexDirection: "column", gap: "7px", marginTop: "8px" }}>
                      {pieData.map((d) => (
                        <div key={d.name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
                            <div style={{ width: "8px", height: "8px", borderRadius: "2px", background: d.color, flexShrink: 0 }} />
                            <span style={{ fontSize: "11px", color: "var(--text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "130px" }}>{d.name}</span>
                          </div>
                          <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-primary)" }}>
                            {totalPieSpend > 0 ? `${((d.value / totalPieSpend) * 100).toFixed(0)}%` : "—"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Campaign table */}
              <div className="print-chart-box print-text-dark" style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "16px", padding: "22px" }}>
                <div style={{ marginBottom: "16px" }}>
                  <h2 style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "2px" }}>Campanhas</h2>
                  <p style={{ fontSize: "12px", color: "var(--text-secondary)" }}>Desempenho detalhado • {data.campaigns.length} campanha(s)</p>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "2fr 80px 90px 70px 70px 70px", gap: "8px", padding: "8px 12px", borderRadius: "8px", background: "var(--bg-secondary)", marginBottom: "8px" }}>
                  {["Campanha", "Status", "Gasto", "CTR", "CPC", "Cliques"].map((h) => (
                    <span key={h} style={{ fontSize: "10px", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.08em" }}>{h}</span>
                  ))}
                </div>

                <div style={{ maxHeight: "280px", overflowY: "auto" }}>
                  {data.campaigns.length === 0 && (
                    <p style={{ fontSize: "12px", color: "var(--text-secondary)", padding: "12px" }}>Nenhuma campanha encontrada no período.</p>
                  )}
                  {data.campaigns.map((c) => {
                    const s = STATUS_STYLES[c.status] ?? STATUS_STYLES["ARCHIVED"];
                    return (
                      <div key={c.id} className="meta-row" style={{
                        display: "grid", gridTemplateColumns: "2fr 80px 90px 70px 70px 70px",
                        gap: "8px", padding: "10px 12px", borderRadius: "8px",
                        border: "1px solid transparent", transition: "all 0.15s ease", cursor: "pointer",
                      }}>
                        <div>
                          <p style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.name}</p>
                          <p style={{ fontSize: "10px", color: "var(--text-secondary)" }}>{c.impressions.toLocaleString("pt-BR")} impr.</p>
                        </div>
                        <div style={{ alignSelf: "center" }}>
                          <span style={{ fontSize: "10px", fontWeight: 700, padding: "3px 8px", borderRadius: "20px", background: s.bg, color: s.color }}>
                            {s.label}
                          </span>
                        </div>
                        <span style={{ fontSize: "12px", color: "var(--text-secondary)", alignSelf: "center" }}>{fmtBRL(c.spend)}</span>
                        <span style={{ fontSize: "12px", color: "#00d4ff", fontWeight: 600, alignSelf: "center" }}>{c.ctr.toFixed(2)}%</span>
                        <span style={{ fontSize: "12px", color: "var(--text-secondary)", alignSelf: "center" }}>{fmtBRL(c.cpc)}</span>
                        <span style={{ fontSize: "12px", color: "var(--text-primary)", alignSelf: "center" }}>{fmt(c.clicks)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </>
        )}

        {/* Print-only footer */}
        <div className="print-footer no-screen">
          <p className="print-footer-left">Gerado por MarkLabs · marklabs.com.br · Todos os dados são referentes ao período selecionado.</p>
          <p className="print-footer-brand" style={{ color: "#00d4ff" }}>MarkLabs Ads Report</p>
        </div>
      </main>

      <style>{`
        .meta-kpi-card:hover {
          border-color: var(--border-light) !important;
          transform: translateY(-2px);
          box-shadow: 0 8px 32px rgba(0,0,0,0.15);
        }
        .meta-row:hover {
          background: var(--bg-hover) !important;
          border-color: var(--border-light) !important;
        }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </>
  );
}
