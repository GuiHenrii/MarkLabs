"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Calendar,
  PenSquare,
  BarChart2,
  Image,
  Users,
  Settings,
  ChevronRight,
  LogOut,
  Globe,
  Sun,
  Moon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/ui/Logo";
import { useTheme } from "@/components/providers/ThemeProvider";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/compose", icon: PenSquare, label: "Criar Post" },
  { href: "/accounts", icon: Globe, label: "Contas" },
  { href: "/calendar", icon: Calendar, label: "Calendário" },
  { href: "/analytics", icon: BarChart2, label: "Analytics" },
  { href: "/media", icon: Image, label: "Mídias" },
  { href: "/team", icon: Users, label: "Equipe" },
];

const bottomItems = [{ href: "/settings", icon: Settings, label: "Configurações" }];

export function Sidebar() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();

  return (
    <aside
      style={{
        width: "240px",
        minHeight: "100vh",
        background: "var(--bg-secondary)",
        borderRight: "1px solid var(--border)",
        display: "flex",
        flexDirection: "column",
        position: "fixed",
        left: 0,
        top: 0,
        bottom: 0,
        zIndex: 40,
      }}
    >
      <div
        style={{
          padding: "20px 20px 16px",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <Link
          href="/dashboard"
          style={{
            display: "flex",
            alignItems: "center",
            textDecoration: "none",
            width: "100%",
          }}
        >
          <Logo width={160} />
        </Link>
      </div>

      <nav style={{ flex: 1, padding: "12px 12px" }}>
        <p
          style={{
            fontSize: "10px",
            fontWeight: 600,
            letterSpacing: "0.08em",
            color: "var(--text-muted)",
            textTransform: "uppercase",
            padding: "0 8px",
            marginBottom: "8px",
          }}
        >
          Menu Principal
        </p>

        <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "2px" }}>
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
                    padding: "9px 10px",
                    borderRadius: "8px",
                    textDecoration: "none",
                    fontSize: "13.5px",
                    fontWeight: isActive ? 600 : 400,
                    color: isActive ? "#fff" : "var(--text-secondary)",
                    background: isActive
                      ? "linear-gradient(135deg, rgba(234,88,12,0.25), rgba(79,70,229,0.15))"
                      : "transparent",
                    border: isActive ? "1px solid rgba(234,88,12,0.3)" : "1px solid transparent",
                    transition: "all 0.15s ease",
                    position: "relative",
                  }}
                  className={cn(!isActive && "sidebar-link")}
                >
                  <Icon
                    size={16}
                    style={{ color: isActive ? "#fb923c" : "var(--text-muted)", flexShrink: 0 }}
                  />
                  {label}
                  {isActive && (
                    <ChevronRight size={13} style={{ marginLeft: "auto", color: "#fb923c" }} />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div
        style={{
          padding: "12px",
          borderTop: "1px solid var(--border)",
          display: "flex",
          flexDirection: "column",
          gap: "2px",
        }}
      >
        {bottomItems.map(({ href, icon: Icon, label }) => (
          <Link
            key={href}
            href={href}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "9px 10px",
              borderRadius: "8px",
              textDecoration: "none",
              fontSize: "13.5px",
              color: "var(--text-secondary)",
              transition: "all 0.15s ease",
            }}
            className="sidebar-link"
          >
            <Icon size={16} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
            {label}
          </Link>
        ))}

        <button
          onClick={toggleTheme}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "9px 10px",
            borderRadius: "8px",
            background: "none",
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
              <Sun size={16} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
              Modo Claro
            </>
          ) : (
            <>
              <Moon size={16} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
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
            marginTop: "4px",
            borderRadius: "10px",
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
          }}
        >
          <div
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "50%",
              background: "linear-gradient(135deg, #ea580c, #9a3412)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "13px",
              fontWeight: 700,
              color: "#fff",
              flexShrink: 0,
            }}
          >
            M
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p
              style={{
                fontSize: "12px",
                fontWeight: 600,
                color: "var(--text-primary)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              Minha Empresa
            </p>
            <p
              style={{
                fontSize: "11px",
                color: "var(--text-muted)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
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
        .sidebar-link:hover {
          background: var(--bg-hover) !important;
          color: var(--text-primary) !important;
        }
      `}</style>
    </aside>
  );
}
