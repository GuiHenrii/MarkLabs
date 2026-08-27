"use client";

import { Bell, Search, Plus, Menu } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useTheme } from "@/components/providers/ThemeProvider";

interface TopbarProps {
  title: string;
  subtitle?: string;
}

export function Topbar({ title, subtitle }: TopbarProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { theme } = useTheme();
  const isLight = theme === "light";

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && searchQuery.trim()) {
      alert("Busca não implementada: " + searchQuery);
      setSearchQuery("");
    }
  };

  return (
    <header
      style={{
        background: isLight ? "rgba(255,255,255,0.92)" : "var(--bg-secondary)",
        borderBottom: "1px solid var(--border)",
        display: "flex",
        alignItems: "center",
        paddingLeft: "24px",
        paddingRight: "24px",
        gap: "16px",
        minHeight: "64px",
        position: "sticky",
        top: 0,
        zIndex: 30,
      }}
      className="mobile-topbar mobile-tight"
    >
      <button
        type="button"
        onClick={() => window.dispatchEvent(new Event("marklabs:toggle-sidebar"))}
        aria-label="Abrir menu"
        style={{
          display: "none",
          width: "40px",
          height: "40px",
          borderRadius: "10px",
          border: "1px solid var(--border)",
          background: isLight ? "rgba(255,255,255,0.95)" : "var(--bg-card)",
          color: "var(--text-primary)",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
        className="mobile-menu-button"
      >
        <Menu size={18} />
      </button>

      {/* Title */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <h1
          style={{
            fontSize: "17px",
            fontWeight: 700,
            color: "var(--text-primary)",
            lineHeight: 1.2,
          }}
        >
          {title}
        </h1>
        {subtitle && (
          <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "1px" }}>
            {subtitle}
          </p>
        )}
      </div>

      {/* Search */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          background: isLight ? "rgba(255,255,255,0.95)" : "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: "8px",
          padding: "0 12px",
          height: "36px",
          width: "220px",
          cursor: "text",
          transition: "border-color 0.15s ease",
        }}
        className="mobile-hide-sm mobile-topbar-actions"
      >
        <Search size={14} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
        <input
          type="text"
          placeholder="Buscar..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={handleSearch}
          style={{
            background: "none",
            border: "none",
            outline: "none",
            fontSize: "13px",
            color: "var(--text-primary)",
            width: "100%",
          }}
        />
      </div>

      {/* Actions */}
      <Link
        href="/compose"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          background: "linear-gradient(135deg, #ea580c, #c2410c)",
          color: "#fff",
          border: "none",
          borderRadius: "8px",
          padding: "0 14px",
          height: "36px",
          fontSize: "13px",
          fontWeight: 600,
          textDecoration: "none",
          cursor: "pointer",
          boxShadow: "0 0 12px rgba(234,88,12, 0.3)",
          transition: "all 0.15s ease",
          whiteSpace: "nowrap",
        }}
        className="mobile-hide-sm"
      >
        <Plus size={15} />
        Novo Post
      </Link>

      {/* Notifications */}
      <div style={{ position: "relative" }} className="mobile-hide-sm">
        <button
          onClick={() => setShowNotifications(!showNotifications)}
          style={{
            position: "relative",
            background: isLight ? "rgba(255,255,255,0.95)" : "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: "8px",
            width: "36px",
            height: "36px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            color: "var(--text-secondary)",
            transition: "all 0.15s ease",
          }}
        >
          <Bell size={16} />
          <span
            style={{
              position: "absolute",
              top: "7px",
              right: "7px",
              width: "7px",
              height: "7px",
              background: "#ea580c",
              borderRadius: "50%",
              border: "1.5px solid var(--bg-secondary)",
            }}
          />
        </button>

        {showNotifications && (
          <div
            style={{
              position: "absolute",
              top: "44px",
              right: 0,
              width: "280px",
              background: isLight ? "rgba(255,255,255,0.98)" : "var(--bg-card)",
              border: "1px solid var(--border)",
              borderRadius: "12px",
              boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
              padding: "16px",
              zIndex: 40,
            }}
          >
            <h4 style={{ margin: "0 0 12px 0", fontSize: "14px", color: "var(--text-primary)" }}>Notificações</h4>
            <div style={{ padding: "20px 0", textAlign: "center", color: "var(--text-muted)", fontSize: "13px" }}>
              Nenhuma notificação nova no momento.
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
