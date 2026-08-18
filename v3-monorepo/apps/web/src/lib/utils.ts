import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string, options?: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    ...options,
  }).format(new Date(date));
}

export function formatRelativeTime(date: Date | string) {
  const now = new Date();
  const target = new Date(date);
  const diffMs = target.getTime() - now.getTime();
  const diffMins = Math.round(diffMs / 60000);
  const diffHours = Math.round(diffMs / 3600000);
  const diffDays = Math.round(diffMs / 86400000);

  if (Math.abs(diffMins) < 60) return `${diffMins > 0 ? "em" : "há"} ${Math.abs(diffMins)}min`;
  if (Math.abs(diffHours) < 24) return `${diffHours > 0 ? "em" : "há"} ${Math.abs(diffHours)}h`;
  return `${diffDays > 0 ? "em" : "há"} ${Math.abs(diffDays)} dias`;
}

export function formatNumber(num: number): string {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toString();
}

export function getPlatformColor(platform: string): string {
  const colors: Record<string, string> = {
    INSTAGRAM: "#e1306c",
    FACEBOOK: "#1877f2",
    LINKEDIN: "#0a66c2",
    TIKTOK: "#010101",
    YOUTUBE: "#ff0000",
  };
  return colors[platform.toUpperCase()] ?? "#ea580c";
}

export function getPlatformLabel(platform: string): string {
  const labels: Record<string, string> = {
    INSTAGRAM: "Instagram",
    FACEBOOK: "Facebook",
    LINKEDIN: "LinkedIn",
    TIKTOK: "TikTok",
    YOUTUBE: "YouTube",
  };
  return labels[platform.toUpperCase()] ?? platform;
}

export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    DRAFT: "Rascunho",
    SCHEDULED: "Agendado",
    PUBLISHING: "Publicando",
    PUBLISHED: "Publicado",
    FAILED: "Falhou",
  };
  return labels[status.toUpperCase()] ?? status;
}

export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return `${str.slice(0, maxLength)}...`;
}
