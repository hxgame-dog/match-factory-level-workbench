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

import { navItems, zh } from "@/lib/i18n/zh";
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

export function AppSidebar() {
  const pathname = usePathname();
  const { sidebarCollapsed, toggleSidebar } = useLayoutStore();

  return (
    <aside
      className={cn(
        "flex shrink-0 flex-col border-r border-gray-200 bg-white transition-all duration-200",
        sidebarCollapsed ? "w-14" : "w-64",
      )}
    >
      <div className={cn("border-b border-gray-200 p-3", sidebarCollapsed && "px-2")}>
        {!sidebarCollapsed ? (
          <>
            <p className="font-serif text-base text-gray-900">{zh.brand.title}</p>
            <p className="text-xs text-gray-500">{zh.brand.subtitle}</p>
          </>
        ) : (
          <p className="text-center font-serif text-sm text-gray-900" title={zh.brand.title}>
            MF
          </p>
        )}
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto p-2">
        {navItems.map((item) => {
          const Icon = iconMap[item.icon] ?? LayoutDashboard;
          const label = zh.nav[item.key];
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              title={sidebarCollapsed ? label : undefined}
              className={cn(
                "flex items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors",
                sidebarCollapsed && "justify-center px-2",
                active
                  ? "border-gray-300 bg-gray-100 text-gray-900"
                  : "border-transparent text-gray-600 hover:border-gray-200 hover:bg-gray-50",
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {!sidebarCollapsed && <span>{label}</span>}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-gray-200 p-2">
        <button
          type="button"
          onClick={toggleSidebar}
          className="flex w-full items-center justify-center gap-2 rounded-md border border-gray-200 px-2 py-2 text-xs text-gray-600 hover:bg-gray-50"
          aria-label={sidebarCollapsed ? zh.common.expand : zh.common.collapse}
        >
          {sidebarCollapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          {!sidebarCollapsed && <span>{zh.common.collapse}</span>}
        </button>
      </div>
    </aside>
  );
}
