"use client";

import { useEffect, useState } from "react";

export interface ChartColors {
  chart1: string;
  chart2: string;
  chart3: string;
  chart4: string;
  chart5: string;
  foreground: string;
  mutedForeground: string;
  border: string;
  background: string;
  card: string;
}

function getCSSVariable(name: string): string {
  if (typeof window === "undefined") return "";
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return value ? `hsl(${value})` : "";
}

export function useChartColors(): ChartColors {
  const [colors, setColors] = useState<ChartColors>({
    chart1: "hsl(180 77% 60%)",
    chart2: "hsl(180 50% 43%)",
    chart3: "hsl(180 50% 36%)",
    chart4: "hsl(184 58% 23%)",
    chart5: "hsl(185 62% 15%)",
    foreground: "hsl(180 77% 60%)",
    mutedForeground: "hsl(180 50% 43%)",
    border: "hsl(191 59% 21%)",
    background: "hsl(196 52% 8%)",
    card: "hsl(192 51% 10%)",
  });

  useEffect(() => {
    const updateColors = () => {
      setColors({
        chart1: getCSSVariable("--chart-1"),
        chart2: getCSSVariable("--chart-2"),
        chart3: getCSSVariable("--chart-3"),
        chart4: getCSSVariable("--chart-4"),
        chart5: getCSSVariable("--chart-5"),
        foreground: getCSSVariable("--foreground"),
        mutedForeground: getCSSVariable("--muted-foreground"),
        border: getCSSVariable("--border"),
        background: getCSSVariable("--background"),
        card: getCSSVariable("--card"),
      });
    };

    updateColors();

    // Listen for theme changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === "data-theme" || mutation.attributeName === "class") {
          updateColors();
        }
      });
    });

    observer.observe(document.documentElement, { attributes: true });

    return () => observer.disconnect();
  }, []);

  return colors;
}
