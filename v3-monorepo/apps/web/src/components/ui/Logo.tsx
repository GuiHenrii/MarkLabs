"use client";

import { useTheme } from "@/components/providers/ThemeProvider";

export function Logo({ className = "", width = 180 }: { className?: string; width?: number }) {
  const { theme } = useTheme();

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <img
        src="https://markshare.com.br/wp-content/uploads/2023/01/Ativo-1@4x-1024x196.png"
        alt="MarkShare"
        width={width}
        style={{
          objectFit: "contain",
          filter: theme === "dark" ? "brightness(0) invert(1)" : "none",
          transition: "filter 0.2s ease",
        }}
      />
    </div>
  );
}
