"use client";

import { useState } from "react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { TrendingUp, Users, Eye, Heart, Share2, Download } from "lucide-react";
import { Topbar } from "@/components/layout/Topbar";
import { formatNumber } from "@/lib/utils";
import { useTeam } from "@/components/providers/TeamProvider";

// Note: These datasets are mocked. A real implementation would fetch from:
// - GET /api/analytics?teamId=...&period=...
// - GET /api/hashtags?teamId=...&period=...
const reachData = [
  { date: "01/08", instagram: 4200, facebook: 2800, linkedin: 1100 },
  { date: "05/08", instagram: 5600, facebook: 3200, linkedin: 1400 },
  { date: "10/08", instagram: 4900, facebook: 2600, linkedin: 1250 },
  { date: "15/08", instagram: 7800, facebook: 4200, linkedin: 1900 },
  { date: "20/08", instagram: 6400, facebook: 3800, linkedin: 1600 },
  { date: "25/08", instagram: 9200, facebook: 5100, linkedin: 2200 },
  { date: "30/08", instagram: 8700, facebook: 4800, linkedin: 2000 },
];

const pieData = [
  { name: "Instagram", value: 48, color: "#e1306c" },
  { name: "Facebook", value: 31, color: "#1877f2" },
  { name: "LinkedIn", value: 15, color: "#0a66c2" },
  { name: "YouTube", value: 6, color: "#ff0000" },
];

const topHashtags = [
  { tag: "#marketing", posts: 12, reach: 48200 },
  { tag: "#empreendedorismo", posts: 8, reach: 32100 },
  { tag: "#socialmedia", posts: 15, reach: 61800 },
  { tag: "#negócios", posts: 6, reach: 24300 },
  { tag: "#brasil", posts: 10, reach: 39400 },
];

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

export default function AnalyticsPage() {
  const { teamId } = useTeam();
  const [period, setPeriod] = useState("30 dias");

  // TODO: Fetch real analytics data when endpoints are available
  // useEffect(() => {
  //   if (!teamId) return;
  //   fetch(`/api/analytics?teamId=${teamId}&period=${period}`)
  //     .then(r => r.json())
  //     .then(data => setReachData(data.reachData));
  // }, [teamId, period]);

  return (
    <>
      {/* Print-only Header */}
      <div className="print-header" style={{ display: "none" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
          <div style={{ width: "40px", height: "40px", background: "#ea580c", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: "bold", fontSize: "20px" }}>M</div>
          <div>
            <h1 style={{ margin: 0, fontSize: "24px", color: "#ea580c" }}>MarkLabs</h1>
            <p style={{ margin: 0, fontSize: "14px", color: "#666" }}>Relatório de Analytics - {period}</p>
          </div>
        </div>
        <hr style={{ border: "none", borderTop: "2px solid #ea580c", marginBottom: "20px" }} />
      </div>

      <div className="no-print">
        <Topbar title="Analytics" subtitle="Métricas detalhadas das suas redes sociais" />
      </div>

      <main style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "24px", flex: 1 }} className="animate-fade-in print-content">
        {/* Period selector + Export */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", gap: "6px", background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "10px", padding: "4px" }}>
            {periods.map((p) => (
              <button
                key={p}
                id={`period-${p.replace(" ", "-")}`}
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
                  transition: "all 0.15s ease",
                  boxShadow: period === p ? "0 0 10px rgba(234,88,12,0.3)" : "none",
                }}
              >
                {p}
              </button>
            ))}
          </div>

          <button
            id="export-btn"
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
              transition: "all 0.15s ease",
              boxShadow: "0 0 12px rgba(234,88,12,0.3)",
            }}
            className="no-print"
          >
            <Download size={14} />
            Exportar relatório em PDF
          </button>
        </div>

        {/* KPI Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "14px" }}>
          {[
            { title: "Alcance Total", value: "284.7K", change: "+18%", icon: Eye, color: "#ea580c" },
            { title: "Novos Seguidores", value: "+2.4K", change: "+12%", icon: Users, color: "#9a3412" },
            { title: "Engajamento Total", value: "42.1K", change: "+26%", icon: Heart, color: "#ec4899" },
            { title: "Compartilhamentos", value: "8.9K", change: "+9%", icon: Share2, color: "#f59e0b" },
          ].map((kpi) => (
            <div
              key={kpi.title}
              style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "14px", padding: "18px" }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                <p style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: 500 }}>{kpi.title}</p>
                <div style={{ width: "32px", height: "32px", borderRadius: "9px", background: `${kpi.color}18`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <kpi.icon size={14} style={{ color: kpi.color }} />
                </div>
              </div>
              <p style={{ fontSize: "26px", fontWeight: 700, color: "var(--text-primary)" }}>{kpi.value}</p>
              <div style={{ display: "flex", alignItems: "center", gap: "4px", marginTop: "4px" }}>
                <TrendingUp size={11} style={{ color: "#10b981" }} />
                <span style={{ fontSize: "11px", color: "#10b981", fontWeight: 600 }}>{kpi.change}</span>
                <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>vs. período anterior</span>
              </div>
            </div>
          ))}
        </div>

        {/* Charts */}
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "16px" }}>
          {/* Reach over time */}
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

          {/* Platform Distribution Pie */}
          <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "14px", padding: "20px" }}>
            <h2 style={{ fontSize: "15px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "4px" }}>Distribuição por Plataforma</h2>
            <p style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "16px" }}>% do alcance total</p>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                  {pieData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => [`${v}%`, "Alcance"]} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {pieData.map((item) => (
                <div key={item.name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: item.color }} />
                    <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>{item.name}</span>
                  </div>
                  <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-primary)" }}>{item.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top Hashtags */}
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "14px", padding: "20px" }}>
          <h2 style={{ fontSize: "15px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "16px" }}>Top Hashtags</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "12px" }}>
            {topHashtags.map((ht, i) => (
              <div
                key={ht.tag}
                style={{
                  padding: "14px",
                  background: "var(--bg-secondary)",
                  borderRadius: "10px",
                  border: "1px solid var(--border)",
                  textAlign: "center",
                }}
              >
                <span style={{ display: "inline-block", fontSize: "10px", fontWeight: 700, color: "var(--text-muted)", marginBottom: "8px" }}>
                  #{i + 1}
                </span>
                <p style={{ fontSize: "13px", fontWeight: 700, color: "#fb923c", marginBottom: "4px" }}>{ht.tag}</p>
                <p style={{ fontSize: "11px", color: "var(--text-muted)" }}>{ht.posts} posts</p>
                <p style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-primary)", marginTop: "4px" }}>
                  {formatNumber(ht.reach)} alcance
                </p>
              </div>
            ))}
          </div>
        </div>
      </main>

      <style>{`
        @media print {
          @page { size: landscape; margin: 1cm; }
          body * { visibility: hidden; }
          .print-header, .print-header * { visibility: visible !important; display: block !important; }
          .print-content, .print-content * { visibility: visible !important; }
          .print-header { position: absolute; left: 0; top: 0; width: 100%; }
          .print-content { position: absolute; left: 0; top: 100px; width: 100%; padding: 0 !important; }
          .no-print { display: none !important; }
          /* Ensure charts render well in print */
          .recharts-wrapper { max-width: 100%; }
          /* Set a light theme for print */
          :root {
            --bg-card: #fff;
            --border: #eee;
            --text-primary: #000;
            --text-secondary: #333;
            --text-muted: #666;
            --bg-secondary: #f9f9f9;
          }
        }
      `}</style>
    </>
  );
}
