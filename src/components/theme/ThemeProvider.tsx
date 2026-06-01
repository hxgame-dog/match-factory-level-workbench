"use client";

import { useEffect } from "react";

import { resolveTheme } from "@/lib/theme/resolveTheme";
import { useThemeStore } from "@/stores/themeStore";

function applyResolvedTheme() {
  const preference = useThemeStore.getState().theme;
  const resolved = resolveTheme(preference);
  document.documentElement.classList.toggle("dark", resolved === "dark");
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useThemeStore((s) => s.theme);

  useEffect(() => {
    applyResolvedTheme();

    if (theme !== "system") return;

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => applyResolvedTheme();
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [theme]);

  return children;
}
