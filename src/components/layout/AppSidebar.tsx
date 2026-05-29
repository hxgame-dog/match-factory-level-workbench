"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FlaskConical,
  FolderKanban,
  LayoutDashboard,
  LineChart,
  PackageSearch,
  PanelLeftClose,
  PanelLeftOpen,
  Puzzle,
  Sigma,
  Sparkles,
  TestTube2,
  WandSparkles,
  Workflow,
  type LucideIcon,
} from "lucide-react";

import { navItems, zh, type NavKey } from "@/lib/i18n/zh";
import { useLayoutStore } from "@/stores/layoutStore";
import { cn } from "@/lib/utils";

const iconMap: Record<string, LucideIcon> = {
  LayoutDashboard,
  PackageSearch,
  FlaskConical,
  WandSparkles,
  FolderKanban,
  Puzzle,
  Sigma,
  Sparkles,
  Workflow,
  TestTube2,
  LineChart,
};

const navGroups: { label: string; keys: NavKey[] }[] = [
  { label: "概览", keys: ["dashboard"] },
  { label: "工作台配置", keys: ["aiLab"] },
  { label: "内容生成", keys: ["itemGenerator", "assetStudio"] },
  { label: "关卡设计", keys: ["levelGenerator", "levelEditor", "formulaLab", "autoLevelGenerator"] },
  { label: "验证交付", keys: ["playtestSimulator", "analyticsFeedback", "pipeline"] },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { sidebarCollapsed, toggleSidebar } = useLayoutStore();
  const itemByKey = Object.fromEntries(navItems.map((item) => [item.key, item])) as Record<
    NavKey,
    (typeof navItems)[number]
  >;

  return (
    <aside
      className={cn(
        "flex shrink-0 flex-col border-r border-border bg-sidebar transition-all duration-200",
        sidebarCollapsed ? "w-14" : "w-60",
      )}
    >
      <div className={cn("border-b border-border p-3", sidebarCollapsed && "px-2")}>
        {!sidebarCollapsed ? (
          <>
            <p className="font-serif text-base font-medium text-sidebar-foreground">{zh.brand.title}</p>
            <p className="text-xs text-muted-foreground">{zh.brand.subtitle}</p>
          </>
        ) : (
          <p className="text-center font-serif text-xs font-medium" title={zh.brand.title}>
            LW
          </p>
        )}
      </div>
      <nav className="flex-1 overflow-y-auto p-2">
        {navGroups.map((group, groupIndex) => (
          <div key={group.label} className={cn(groupIndex > 0 && "mt-4")}>
            {!sidebarCollapsed ? (
              <p className="mb-1 px-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                {group.label}
              </p>
            ) : groupIndex > 0 ? (
              <div className="mx-1 mb-1 border-t border-border" />
            ) : null}
            <div className="space-y-0.5">
              {group.keys.map((key) => {
                const item = itemByKey[key];
                if (!item) return null;
                const Icon = iconMap[item.icon] ?? LayoutDashboard;
                const label = zh.nav[key];
                const active = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    title={sidebarCollapsed ? label : undefined}
                    className={cn(
                      "flex items-center gap-2 rounded-md px-2.5 py-2 text-sm transition-colors",
                      sidebarCollapsed && "justify-center px-2",
                      active
                        ? "border-l-2 border-primary bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                        : "border-l-2 border-transparent text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {!sidebarCollapsed && <span className="truncate">{label}</span>}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
      <div className="border-t border-border p-2">
        <button
          type="button"
          onClick={toggleSidebar}
          className="flex w-full items-center justify-center gap-2 rounded-md border border-border px-2 py-2 text-xs text-muted-foreground hover:bg-sidebar-accent"
          aria-label={sidebarCollapsed ? zh.common.expand : zh.common.collapse}
        >
          {sidebarCollapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          {!sidebarCollapsed && <span>{zh.common.collapse}</span>}
        </button>
      </div>
    </aside>
  );
}
