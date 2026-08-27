import type { Metadata } from "next";
import type { Viewport } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { ChatWidget } from "@/components/chat/ChatWidget";

export const metadata: Metadata = {
  title: {
    default: "MarkLabs - Gestao de Redes Sociais",
    template: "%s | MarkLabs",
  },
  description:
    "Gerencie todas as suas redes sociais em um so lugar. Agende posts, analise metricas e colabore com sua equipe no MarkLabs.",
  keywords: ["gestao de redes sociais", "agendamento de posts", "analytics", "instagram", "facebook", "linkedin"],
  authors: [{ name: "MarkLabs" }],
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: process.env.NEXT_PUBLIC_APP_URL,
    siteName: "MarkLabs",
    title: "MarkLabs - Gestao de Redes Sociais",
    description: "Gerencie todas as suas redes sociais em um so lugar.",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning className="dark">
      <body suppressHydrationWarning>
        <ThemeProvider>{children}</ThemeProvider>
        <ChatWidget />
      </body>
    </html>
  );
}
