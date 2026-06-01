"use client";

import { Moon, Sun } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useThemeStore } from "@/stores/themeStore";
import { zh } from "@/lib/i18n/zh";

type Props = {
  collapsed?: boolean;
};

export function ThemeToggle({ collapsed }: Props) {
  const theme = useThemeStore((s) => s.theme);
  const toggleTheme = useThemeStore((s) => s.toggleTheme);
  const isDark = theme === "dark";

  return (
    <Button
      type="button"
      variant="outline"
      size={collapsed ? "icon-sm" : "sm"}
      onClick={toggleTheme}
      className={collapsed ? "w-full" : "w-full justify-start"}
      aria-label={isDark ? zh.theme.switchToLight : zh.theme.switchToDark}
      title={isDark ? zh.theme.switchToLight : zh.theme.switchToDark}
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      {!collapsed ? <span>{isDark ? zh.theme.light : zh.theme.dark}</span> : null}
    </Button>
  );
}
