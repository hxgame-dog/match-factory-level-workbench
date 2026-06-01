"use client";

import { useSyncExternalStore } from "react";

import { Toaster } from "@/components/ui/sonner";
import { resolveTheme } from "@/lib/theme/resolveTheme";
import { useThemeStore } from "@/stores/themeStore";

function subscribeSystemTheme(onChange: () => void) {
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

export function AppToaster() {
  const preference = useThemeStore((s) => s.theme);
  const resolved = useSyncExternalStore(
    subscribeSystemTheme,
    () => resolveTheme(preference),
    () => "light" as const,
  );

  return <Toaster theme={resolved} />;
}
