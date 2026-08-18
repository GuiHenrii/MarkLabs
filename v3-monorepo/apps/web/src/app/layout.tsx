import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/ThemeProvider";

export const metadata: Metadata = {
  title: {
    default: "MarkLabs — Gestão de Redes Sociais",
    template: "%s | MarkLabs",
  },
  description:
    "Gerencie todas as suas redes sociais em um só lugar. Agende posts, analise métricas e colabore com sua equipe no MarkLabs.",
  keywords: ["gestão de redes sociais", "agendamento de posts", "analytics", "instagram", "facebook", "linkedin"],
  authors: [{ name: "MarkLabs" }],
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: process.env.NEXT_PUBLIC_APP_URL,
    siteName: "MarkLabs",
    title: "MarkLabs — Gestão de Redes Sociais",
    description: "Gerencie todas as suas redes sociais em um só lugar.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body suppressHydrationWarning>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}

