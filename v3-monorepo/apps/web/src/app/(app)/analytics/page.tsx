"use client";

import { useState } from "react";
import { Topbar } from "@/components/layout/Topbar";
import { OrganicAnalytics } from "./components/OrganicAnalytics";
import { AdsAnalytics } from "./components/AdsAnalytics";
import { BarChart2, Zap } from "lucide-react";

export default function UnifiedAnalyticsPage() {
  const [activeTab, setActiveTab] = useState<"organic" | "ads">("organic");

  return (
    <>
      <div className="no-print">
        <Topbar 
          title="Performance & Analytics" 
          subtitle="Acompanhe o desempenho orgânico e das suas campanhas de tráfego pago" 
        />
        <div style={{ padding: "0 24px", paddingTop: "8px" }}>
          <div style={{ display: "flex", gap: "10px", borderBottom: "1px solid var(--border)", marginBottom: "-1px" }}>
            <button
              onClick={() => setActiveTab("organic")}
              style={{
                display: "flex", alignItems: "center", gap: "8px",
                padding: "12px 16px",
                background: "transparent",
                border: "none",
                borderBottom: activeTab === "organic" ? "2px solid #ea580c" : "2px solid transparent",
                color: activeTab === "organic" ? "var(--text-primary)" : "var(--text-muted)",
                fontSize: "14px", fontWeight: activeTab === "organic" ? 600 : 500,
                cursor: "pointer", transition: "all 0.2s ease"
              }}
            >
              <BarChart2 size={16} style={{ color: activeTab === "organic" ? "#ea580c" : "inherit" }} />
              Redes Sociais (Orgânico)
            </button>
            <button
              onClick={() => setActiveTab("ads")}
              style={{
                display: "flex", alignItems: "center", gap: "8px",
                padding: "12px 16px",
                background: "transparent",
                border: "none",
                borderBottom: activeTab === "ads" ? "2px solid #00d4ff" : "2px solid transparent",
                color: activeTab === "ads" ? "var(--text-primary)" : "var(--text-muted)",
                fontSize: "14px", fontWeight: activeTab === "ads" ? 600 : 500,
                cursor: "pointer", transition: "all 0.2s ease"
              }}
            >
              <Zap size={16} style={{ color: activeTab === "ads" ? "#00d4ff" : "inherit" }} />
              Meta Ads (Tráfego Pago)
            </button>
          </div>
        </div>
      </div>
      
      {activeTab === "organic" ? <OrganicAnalytics /> : <AdsAnalytics />}
    </>
  );
}
