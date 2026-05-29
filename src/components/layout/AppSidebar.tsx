"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FlaskConical, FolderKanban, LayoutDashboard, PackageSearch, Puzzle, Sigma, WandSparkles, Sparkles, type LucideIcon, Workflow, TestTube2, LineChart } from "lucide-react";

import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/items", label: "Item Catalog", icon: PackageSearch },
  { href: "/ai-lab", label: "AI Lab", icon: FlaskConical },
  { href: "/item-generator", label: "Item Generator", icon: WandSparkles },
  { href: "/asset-studio", label: "Asset Studio", icon: FolderKanban },
  { href: "/level-generator", label: "Level Generator", icon: Puzzle },
  { href: "/level-editor", label: "Level Editor", icon: Puzzle },
  { href: "/formula-lab", label: "Formula Lab", icon: Sigma },
  { href: "/auto-level-generator", label: "Auto Level Generator", icon: Sparkles },
  { href: "/pipeline", label: "Pipeline", icon: Workflow },
  { href: "/playtest-simulator", label: "Playtest Simulator", icon: TestTube2 },
  { href: "/analytics-feedback", label: "Analytics Feedback", icon: LineChart },
] as Array<{ href: string; label: string; icon: LucideIcon; disabled?: boolean }>;

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 shrink-0 border-r border-gray-200 bg-white p-4">
      <div className="mb-6 rounded-md border border-gray-200 p-3">
        <p className="font-serif text-base text-gray-900">MF Workbench</p>
        <p className="text-xs text-gray-500">关卡设计工作台</p>
      </div>
      <nav className="space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          if (item.disabled) {
            return (
              <div
                key={item.label}
                className="flex items-center gap-2 rounded-md border border-transparent px-3 py-2 text-sm text-gray-400"
              >
                <Icon className="h-4 w-4" />
                <span>{item.label} (Coming Soon)</span>
              </div>
            );
          }
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors",
                active
                  ? "border-gray-300 bg-gray-100 text-gray-900"
                  : "border-transparent text-gray-600 hover:border-gray-200 hover:bg-gray-50",
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
