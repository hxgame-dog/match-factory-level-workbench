"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";
import { LEVEL_DESIGN_TOOLS } from "@/lib/workspace/routes";
import { hrefWithWorkspace } from "@/lib/workspace/pipeline";
import { useWorkspaceStore } from "@/stores/workspaceStore";

export function WorkspaceLevelToolsBar() {
  const pathname = usePathname();
  const workspaceId = useWorkspaceStore((s) => s.activeId);

  return (
    <div className="flex flex-wrap items-center gap-1 border-t border-border pt-3">
      <span className="mr-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">关卡工具</span>
      {LEVEL_DESIGN_TOOLS.map((tool) => {
        const active = pathname === tool.href;
        return (
          <Link
            key={tool.href}
            href={hrefWithWorkspace(tool.href, workspaceId)}
            className={cn(
              "rounded-md px-2.5 py-1 text-xs transition-colors",
              active
                ? "bg-primary text-primary-foreground"
                : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            {tool.label}
          </Link>
        );
      })}
    </div>
  );
}
