"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Plus, Clock, CheckCircle2, XCircle, FileText } from "lucide-react";
import { Topbar } from "@/components/layout/Topbar";
import { getPlatformLabel } from "@/lib/utils";
import Link from "next/link";
import { useTeam } from "@/components/providers/TeamProvider";

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  PUBLISHED: { label: "Publicado", color: "#10b981", icon: CheckCircle2 },
  SCHEDULED: { label: "Agendado", color: "#f59e0b", icon: Clock },
  DRAFT: { label: "Rascunho", color: "#6b7280", icon: FileText },
  FAILED: { label: "Falhou", color: "#ef4444", icon: XCircle },
};

const DAYS_OF_WEEK = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const MONTHS = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

function formatDateKey(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function CalendarPage() {
  const { teamId } = useTeam();
  const now = new Date();
  const [currentYear, setCurrentYear] = useState(now.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(now.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch posts from API
  useEffect(() => {
    if (!teamId) return;

    const fetchPosts = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/posts?teamId=${teamId}`);
        if (!res.ok) throw new Error("Erro ao carregar posts");
        const data = await res.json();
        setPosts(data);
      } catch (err) {
        console.error("Erro ao buscar posts:", err);
        setPosts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [teamId]);

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
  const todayKey = formatDateKey(now.getFullYear(), now.getMonth(), now.getDate());

  const prevMonth = () => {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear((y) => y - 1); }
    else setCurrentMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear((y) => y + 1); }
    else setCurrentMonth((m) => m + 1);
  };

  // Transform posts to include date key and platform colors
  const platformColors: Record<string, string> = {
    INSTAGRAM: "#e1306c",
    FACEBOOK: "#1877f2",
    LINKEDIN: "#0a66c2",
    YOUTUBE: "#ff0000",
    TIKTOK: "#010101",
  };

  const transformedPosts = posts.map((post: any) => {
    const dateObj = post.scheduledAt ? new Date(post.scheduledAt) : post.publishedAt ? new Date(post.publishedAt) : new Date();
    const dateKey = formatDateKey(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate());
    const timeStr = dateObj.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    return {
      id: post.id,
      date: dateKey,
      time: timeStr,
      platform: post.socialAccount?.platform || "INSTAGRAM",
      content: post.content,
      status: post.status,
      color: platformColors[post.socialAccount?.platform || "INSTAGRAM"] || "#ea580c",
    };
  });

  const postsByDate = transformedPosts.reduce<Record<string, typeof transformedPosts>>((acc, post) => {
    if (!acc[post.date]) acc[post.date] = [];
    acc[post.date].push(post);
    return acc;
  }, {});

  const selectedPosts = selectedDate ? (postsByDate[selectedDate] ?? []) : [];

  return (
    <>
      <Topbar title="Calendário Editorial" subtitle="Visualize e gerencie seus posts agendados" />

      <main style={{ padding: "24px", display: "grid", gridTemplateColumns: "1fr 320px", gap: "20px", flex: 1, alignItems: "start" }} className="animate-fade-in">
        {/* Calendar */}
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "14px", padding: "20px" }}>
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
            <h2 style={{ fontSize: "18px", fontWeight: 700, color: "var(--text-primary)" }}>
              {MONTHS[currentMonth]} {currentYear}
            </h2>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <button
                id="prev-month-btn"
                onClick={prevMonth}
                style={{ width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: "8px", cursor: "pointer", color: "var(--text-secondary)" }}
              >
                <ChevronLeft size={16} />
              </button>
              <button
                id="today-btn"
                onClick={() => { setCurrentYear(now.getFullYear()); setCurrentMonth(now.getMonth()); }}
                style={{ padding: "6px 12px", background: "rgba(234,88,12,0.15)", border: "1px solid rgba(234,88,12,0.3)", borderRadius: "8px", color: "#fb923c", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}
              >
                Hoje
              </button>
              <button
                id="next-month-btn"
                onClick={nextMonth}
                style={{ width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: "8px", cursor: "pointer", color: "var(--text-secondary)" }}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* Day of Week headers */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "2px", marginBottom: "8px" }}>
            {DAYS_OF_WEEK.map((d) => (
              <div key={d} style={{ textAlign: "center", fontSize: "11px", fontWeight: 600, color: "var(--text-muted)", padding: "4px 0", letterSpacing: "0.04em", textTransform: "uppercase" }}>
                {d}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "4px" }}>
            {/* Empty cells for first day offset */}
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}

            {/* Day cells */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateKey = formatDateKey(currentYear, currentMonth, day);
              const posts = postsByDate[dateKey] ?? [];
              const isToday = dateKey === todayKey;
              const isSelected = dateKey === selectedDate;

              return (
                <div
                  key={day}
                  id={`day-${dateKey}`}
                  onClick={() => setSelectedDate(isSelected ? null : dateKey)}
                  style={{
                    minHeight: "80px",
                    borderRadius: "10px",
                    padding: "8px",
                    border: isSelected
                      ? "1.5px solid rgba(234,88,12,0.6)"
                      : isToday
                      ? "1.5px solid rgba(234,88,12,0.3)"
                      : "1px solid transparent",
                    background: isSelected
                      ? "rgba(234,88,12,0.12)"
                      : isToday
                      ? "rgba(234,88,12,0.06)"
                      : "var(--bg-secondary)",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                    position: "relative",
                  }}
                  className="calendar-day"
                >
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: "24px",
                      height: "24px",
                      borderRadius: "50%",
                      fontSize: "12px",
                      fontWeight: isToday ? 700 : 500,
                      color: isToday ? "#fff" : "var(--text-secondary)",
                      background: isToday ? "#ea580c" : "transparent",
                      marginBottom: "4px",
                    }}
                  >
                    {day}
                  </span>

                  <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                    {posts.slice(0, 3).map((post) => (
                      <div
                        key={post.id}
                        style={{
                          height: "6px",
                          borderRadius: "3px",
                          background: post.color,
                          opacity: post.status === "DRAFT" ? 0.4 : 0.8,
                        }}
                      />
                    ))}
                    {posts.length > 3 && (
                      <span style={{ fontSize: "9px", color: "var(--text-muted)", fontWeight: 600 }}>
                        +{posts.length - 3}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div style={{ display: "flex", gap: "16px", marginTop: "16px", paddingTop: "16px", borderTop: "1px solid var(--border)" }}>
            {Object.entries(statusConfig).map(([status, cfg]) => (
              <div key={status} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: cfg.color }} />
                <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>{cfg.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar: Day details */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px", position: "sticky", top: "88px" }}>
          <Link
            href="/compose"
            id="new-post-calendar-btn"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              padding: "12px",
              background: "linear-gradient(135deg, #ea580c, #c2410c)",
              border: "none",
              borderRadius: "12px",
              color: "#fff",
              fontSize: "14px",
              fontWeight: 600,
              textDecoration: "none",
              boxShadow: "0 0 16px rgba(234,88,12,0.35)",
              transition: "all 0.15s ease",
            }}
          >
            <Plus size={16} />
            Novo Post
          </Link>

          <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "14px", padding: "16px" }}>
            {selectedDate ? (
              <>
                <h3 style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "12px" }}>
                  {new Date(selectedDate + "T12:00:00").toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}
                </h3>

                {selectedPosts.length > 0 ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {selectedPosts.map((post) => {
                      const cfg = statusConfig[post.status];
                      const StatusIcon = cfg.icon;
                      return (
                        <div
                          key={post.id}
                          style={{
                            padding: "12px",
                            background: "var(--bg-secondary)",
                            borderRadius: "10px",
                            border: "1px solid var(--border)",
                            borderLeft: `3px solid ${post.color}`,
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                            <span style={{ fontSize: "10px", fontWeight: 700, color: post.color, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                              {getPlatformLabel(post.platform)}
                            </span>
                            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                              <StatusIcon size={11} style={{ color: cfg.color }} />
                              <span style={{ fontSize: "10px", color: cfg.color, fontWeight: 600 }}>{cfg.label}</span>
                            </div>
                          </div>
                          <p style={{ fontSize: "12px", color: "var(--text-secondary)", lineHeight: 1.5, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                            {post.content}
                          </p>
                          <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "6px" }}>
                            🕐 {post.time}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div style={{ textAlign: "center", padding: "24px 0" }}>
                    <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>
                      Nenhum post neste dia.
                    </p>
                    <Link href="/compose" style={{ fontSize: "12px", color: "#fb923c", textDecoration: "none", display: "inline-block", marginTop: "8px" }}>
                      + Criar post para este dia
                    </Link>
                  </div>
                )}
              </>
            ) : (
              <div style={{ textAlign: "center", padding: "24px 0" }}>
                <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>
                  Clique em um dia no calendário para ver os posts.
                </p>
              </div>
            )}
          </div>

          {/* Monthly summary */}
          <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "14px", padding: "16px" }}>
            <h3 style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "12px" }}>
              Resumo do Mês
            </h3>
            {Object.entries(
              posts.reduce<Record<string, number>>((acc: Record<string, number>, p: any) => {
                acc[p.status] = (acc[p.status] ?? 0) + 1;
                return acc;
              }, {})
            ).map(([status, count]: [string, number]) => {
              const cfg = statusConfig[status];
              const StatusIcon = cfg?.icon ?? FileText;
              return (
                <div key={status} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid var(--border)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
                    <StatusIcon size={13} style={{ color: cfg?.color ?? "var(--text-muted)" }} />
                    <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>{cfg?.label ?? status}</span>
                  </div>
                  <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-primary)" }}>{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      <style>{`
        .calendar-day:hover {
          background: var(--bg-hover) !important;
          border-color: rgba(234,88,12,0.2) !important;
        }
      `}</style>
    </>
  );
}
