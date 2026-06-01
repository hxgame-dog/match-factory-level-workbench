"use client";

import { Monitor, Moon, Sun } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useThemeStore, type ThemePreference } from "@/stores/themeStore";
import { zh } from "@/lib/i18n/zh";

type Props = {
  collapsed?: boolean;
};

function themeMeta(preference: ThemePreference) {
  switch (preference) {
    case "dark":
      return { icon: Moon, label: zh.theme.dark };
    case "system":
      return { icon: Monitor, label: zh.theme.system };
    default:
      return { icon: Sun, label: zh.theme.light };
  }
}

export function ThemeToggle({ collapsed }: Props) {
  const theme = useThemeStore((s) => s.theme);
  const cycleTheme = useThemeStore((s) => s.cycleTheme);
  const { icon: Icon, label } = themeMeta(theme);

  return (
    <Button
      type="button"
      variant="outline"
      size={collapsed ? "icon-sm" : "sm"}
      onClick={cycleTheme}
      className={collapsed ? "w-full" : "w-full justify-start gap-2"}
      aria-label={zh.theme.cycle}
      title={zh.theme.cycle}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {!collapsed ? <span className="truncate">{label}</span> : null}
    </Button>
  );
}
