"use client";

import { createContext, useContext, useEffect, useState } from "react";

export type Theme = "default" | "monochrome" | "bubblegum" | "coffee" | "twitter" | "t-three";
export type ColorMode = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  colorMode: ColorMode;
  setTheme: (theme: Theme) => void;
  setColorMode: (mode: ColorMode) => void;
  toggleColorMode: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const THEMES: { value: Theme; label: string; color: string }[] = [
  { value: "default", label: "Klodchain", color: "#0d9488" },
  { value: "monochrome", label: "Monochrome", color: "#171717" },
  { value: "bubblegum", label: "Bubblegum", color: "#d946a8" },
  { value: "coffee", label: "Coffee", color: "#d97706" },
  { value: "twitter", label: "Twitter", color: "#1d9bf0" },
  { value: "t-three", label: "Purple", color: "#a855a7" },
];

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("default");
  const [colorMode, setColorModeState] = useState<ColorMode>("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem("klodchain-theme") as Theme | null;
    const savedColorMode = localStorage.getItem("klodchain-color-mode") as ColorMode | null;

    if (savedTheme && THEMES.some(t => t.value === savedTheme)) {
      setThemeState(savedTheme);
    }

    if (savedColorMode) {
      setColorModeState(savedColorMode);
    } else {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      setColorModeState(prefersDark ? "dark" : "light");
    }

    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const root = document.documentElement;
    root.setAttribute("data-theme", theme);

    if (colorMode === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }

    localStorage.setItem("klodchain-theme", theme);
    localStorage.setItem("klodchain-color-mode", colorMode);
  }, [theme, colorMode, mounted]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  const setColorMode = (mode: ColorMode) => {
    setColorModeState(mode);
  };

  const toggleColorMode = () => {
    setColorModeState(prev => prev === "dark" ? "light" : "dark");
  };

  if (!mounted) {
    return null;
  }

  return (
    <ThemeContext.Provider value={{ theme, colorMode, setTheme, setColorMode, toggleColorMode }}>
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
