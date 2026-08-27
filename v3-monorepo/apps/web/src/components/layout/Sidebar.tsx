"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Calendar,
  PenSquare,
  BarChart2,
  Image,
  Settings,
  ChevronRight,
  LogOut,
  Globe,
  Sun,
  Moon,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/ui/Logo";
import { useTheme } from "@/components/providers/ThemeProvider";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/compose", icon: PenSquare, label: "Criar Post" },
  { href: "/accounts", icon: Globe, label: "Contas" },
  { href: "/calendar", icon: Calendar, label: "Calendário" },
  { href: "/analytics", icon: BarChart2, label: "Performance" },
  { href: "/media", icon: Image, label: "Mídias" },
];

const bottomItems = [{ href: "/settings", icon: Settings, label: "Configurações" }];

export function Sidebar() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const open = () => setMobileOpen((value) => !value);
    const close = () => setMobileOpen(false);

    window.addEventListener("marklabs:toggle-sidebar", open as EventListener);
    window.addEventListener("marklabs:close-sidebar", close as EventListener);
    return () => {
      window.removeEventListener("marklabs:toggle-sidebar", open as EventListener);
      window.removeEventListener("marklabs:close-sidebar", close as EventListener);
    };
  }, []);

  useEffect(() => {
    window.dispatchEvent(new Event("marklabs:close-sidebar"));
  }, [pathname]);

  const isLight = theme === "light";

  return (
    <aside
      style={{
        width: "248px",
        minHeight: "100dvh",
        background: isLight
          ? "linear-gradient(180deg, rgba(255,255,255,0.97), rgba(248,244,239,0.98))"
          : "linear-gradient(180deg, rgba(24,24,27,0.98), rgba(12,12,14,0.98))",
        borderRight: "1px solid var(--border)",
        display: "flex",
        flexDirection: "column",
        position: "fixed",
        left: 0,
        top: 0,
        bottom: 0,
        zIndex: 40,
      }}
      className="mobile-drawer"
      data-open={mobileOpen ? "true" : "false"}
    >
      <div
        aria-hidden="true"
        onClick={() => setMobileOpen(false)}
        className="mobile-drawer-backdrop"
        style={{
          display: "none",
          position: "fixed",
          inset: 0,
          left: "min(88vw, 320px)",
          background: "rgba(0,0,0,0.45)",
          zIndex: -1,
        }}
      />

      <div style={{ padding: "20px 20px 16px", borderBottom: "1px solid var(--border)" }}>
        <Link href="/dashboard" style={{ display: "flex", alignItems: "center", textDecoration: "none" }}>
          <Logo width={160} />
        </Link>
        <div style={{ display: "flex", gap: "8px", marginTop: "14px", flexWrap: "wrap" }}>
          <span className="sidebar-pill"><Zap size={12} /> Fluxo rápido</span>
          <span className="sidebar-pill">Conta única</span>
        </div>
      </div>

      <nav style={{ flex: 1, padding: "14px 12px", overflowY: "auto" }}>
        <p
          style={{
            fontSize: "10px",
            fontWeight: 700,
            letterSpacing: "0.12em",
            color: "var(--text-muted)",
            textTransform: "uppercase",
            padding: "0 8px",
            marginBottom: "10px",
          }}
        >
          Navegação
        </p>

        <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "4px" }}>
          {navItems.map(({ href, icon: Icon, label }) => {
            const isActive = pathname.startsWith(href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    padding: "10px 11px",
                    borderRadius: "12px",
                    textDecoration: "none",
                    fontSize: "13.5px",
                    fontWeight: isActive ? 700 : 500,
                    color: isActive ? (isLight ? "#111" : "#fff") : "var(--text-secondary)",
                    background: isActive
                      ? isLight
                        ? "linear-gradient(135deg, rgba(234,88,12,0.10), rgba(255,255,255,0.95))"
                        : "linear-gradient(135deg, rgba(234,88,12,0.12), rgba(14,165,233,0.06))"
                      : "transparent",
                    border: isActive ? "1px solid rgba(234,88,12,0.22)" : "1px solid transparent",
                    transition: "all 0.15s ease",
                  }}
                  className={cn(!isActive && "sidebar-link")}
                >
                  <Icon size={16} style={{ color: isActive ? "#ea580c" : "var(--text-muted)" }} />
                  {label}
                  {isActive && <ChevronRight size={13} style={{ marginLeft: "auto", color: "#ea580c" }} />}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div style={{ padding: "12px", borderTop: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: "4px" }}>
        {bottomItems.map(({ href, icon: Icon, label }) => (
          <Link
            key={href}
            href={href}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "10px 11px",
              borderRadius: "12px",
              textDecoration: "none",
              fontSize: "13.5px",
              color: "var(--text-secondary)",
              transition: "all 0.15s ease",
            }}
            className="sidebar-link"
          >
            <Icon size={16} style={{ color: "var(--text-muted)" }} />
            {label}
          </Link>
        ))}

        <button
          onClick={toggleTheme}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "10px 11px",
            borderRadius: "12px",
            background: isLight ? "rgba(255,255,255,0.7)" : "none",
            border: "none",
            cursor: "pointer",
            width: "100%",
            fontSize: "13.5px",
            color: "var(--text-secondary)",
            transition: "all 0.15s ease",
          }}
          className="sidebar-link"
        >
          {theme === "dark" ? (
            <>
              <Sun size={16} style={{ color: "var(--text-muted)" }} />
              Modo Claro
            </>
          ) : (
            <>
              <Moon size={16} style={{ color: "var(--text-muted)" }} />
              Modo Escuro
            </>
          )}
        </button>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "10px",
            marginTop: "6px",
            borderRadius: "14px",
            background: isLight ? "rgba(255,255,255,0.82)" : "rgba(24,24,27,0.8)",
            border: "1px solid var(--border)",
          }}
        >
          <div
            style={{
              width: "34px",
              height: "34px",
              borderRadius: "50%",
              background: "linear-gradient(135deg, #ea580c, #fb923c)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "13px",
              fontWeight: 800,
              color: "#fff",
              flexShrink: 0,
            }}
          >
            M
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              Minha Empresa
            </p>
            <p style={{ fontSize: "11px", color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              admin@empresa.com
            </p>
          </div>
          <button
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--text-muted)",
              padding: "2px",
              borderRadius: "4px",
              display: "flex",
              alignItems: "center",
            }}
            title="Sair"
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>

      <style>{`
        .sidebar-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          font-weight: 700;
          color: var(--text-secondary);
          background: ${isLight ? "rgba(255,255,255,0.72)" : "rgba(255,255,255,0.02)"};
          border: 1px solid var(--border);
          border-radius: 999px;
          padding: 6px 10px;
        }
        .sidebar-link:hover {
          background: var(--bg-hover) !important;
          color: var(--text-primary) !important;
        }
      `}</style>
    </aside>
  );
}
