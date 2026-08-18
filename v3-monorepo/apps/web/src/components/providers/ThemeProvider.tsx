"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

type Theme = "dark" | "light";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("dark");

  useEffect(() => {
    const saved = localStorage.getItem("marklabs_theme") as Theme;
    if (saved === "light" || saved === "dark") {
      setThemeState(saved);
      document.documentElement.classList.toggle("dark", saved === "dark");
      document.documentElement.classList.toggle("light", saved === "light");
    } else {
      document.documentElement.classList.add("dark");
      document.documentElement.classList.remove("light");
    }
  }, []);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem("marklabs_theme", newTheme);
    document.documentElement.classList.toggle("dark", newTheme === "dark");
    document.documentElement.classList.toggle("light", newTheme === "light");
  };

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
