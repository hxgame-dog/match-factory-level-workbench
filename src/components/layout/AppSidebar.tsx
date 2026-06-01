"use client";

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

import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { WorkspaceSidebarLink } from "@/components/shell/WorkspaceSidebarLink";
import { navItems, zh, type NavKey } from "@/lib/i18n/zh";
import { pipelineStepForPath } from "@/lib/workspace/routes";
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

/** 与顶栏流水线顺序一致 */
const navGroups: { label: string; keys: NavKey[]; workspaceAware?: boolean }[] = [
  { label: "概览", keys: ["dashboard"] },
  {
    label: "生产流水线",
    keys: ["aiLab", "itemGenerator", "assetStudio", "levelGenerator", "playtestSimulator", "pipeline"],
    workspaceAware: true,
  },
  { label: "关卡扩展", keys: ["levelEditor", "formulaLab", "autoLevelGenerator"], workspaceAware: true },
  { label: "数据校准", keys: ["analyticsFeedback"], workspaceAware: true },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { sidebarCollapsed, toggleSidebar } = useLayoutStore();
  const itemByKey = Object.fromEntries(navItems.map((item) => [item.key, item])) as Record<
    NavKey,
    (typeof navItems)[number]
  >;
  const activePipelineStep = pipelineStepForPath(pathname);

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
                const pipelineHighlight =
                  activePipelineStep != null &&
                  pipelineStepForPath(item.href) === activePipelineStep &&
                  pathname !== item.href;
                return (
                  <div key={item.href} className="relative">
                    <WorkspaceSidebarLink
                      href={item.href}
                      label={label}
                      icon={Icon}
                      pathname={pathname}
                      collapsed={sidebarCollapsed}
                      withWorkspace={group.workspaceAware}
                    />
                    {!sidebarCollapsed && pipelineHighlight ? (
                      <span
                        className="pointer-events-none absolute right-2 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-primary"
                        title="同属当前流水线阶段"
                      />
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
      <div className="space-y-2 border-t border-border p-2">
        <ThemeToggle collapsed={sidebarCollapsed} />
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
