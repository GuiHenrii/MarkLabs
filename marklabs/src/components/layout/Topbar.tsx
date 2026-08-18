"use client";

import { Bell, Search, Plus } from "lucide-react";
import Link from "next/link";

interface TopbarProps {
  title: string;
  subtitle?: string;
}

export function Topbar({ title, subtitle }: TopbarProps) {
  return (
    <header
      style={{
        height: "64px",
        background: "var(--bg-secondary)",
        borderBottom: "1px solid var(--border)",
        display: "flex",
        alignItems: "center",
        paddingLeft: "24px",
        paddingRight: "24px",
        gap: "16px",
        position: "sticky",
        top: 0,
        zIndex: 30,
      }}
    >
      {/* Title */}
      <div style={{ flex: 1 }}>
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
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: "8px",
          padding: "0 12px",
          height: "36px",
          width: "220px",
          cursor: "text",
          transition: "border-color 0.15s ease",
        }}
      >
        <Search size={14} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
        <input
          type="text"
          placeholder="Buscar..."
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
          background: "linear-gradient(135deg, #6366f1, #4f46e5)",
          color: "#fff",
          border: "none",
          borderRadius: "8px",
          padding: "0 14px",
          height: "36px",
          fontSize: "13px",
          fontWeight: 600,
          textDecoration: "none",
          cursor: "pointer",
          boxShadow: "0 0 12px rgba(99, 102, 241, 0.3)",
          transition: "all 0.15s ease",
          whiteSpace: "nowrap",
        }}
      >
        <Plus size={15} />
        Novo Post
      </Link>

      {/* Notifications */}
      <button
        id="notifications-btn"
        style={{
          position: "relative",
          background: "var(--bg-card)",
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
            background: "#6366f1",
            borderRadius: "50%",
            border: "1.5px solid var(--bg-secondary)",
          }}
        />
      </button>
    </header>
  );
}
