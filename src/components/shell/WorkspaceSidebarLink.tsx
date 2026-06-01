"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { hrefWithWorkspace } from "@/lib/workspace/pipeline";
import { isNavItemActive } from "@/lib/workspace/routes";
import { useWorkspaceStore } from "@/stores/workspaceStore";

type Props = {
  href: string;
  label: string;
  icon: LucideIcon;
  pathname: string;
  collapsed: boolean;
  /** 绑定工作区时自动附带 ?workspace= */
  withWorkspace?: boolean;
};

export function WorkspaceSidebarLink({
  href,
  label,
  icon: Icon,
  pathname,
  collapsed,
  withWorkspace = false,
}: Props) {
  const workspaceId = useWorkspaceStore((s) => s.activeId);
  const targetHref = withWorkspace ? hrefWithWorkspace(href, workspaceId) : href;
  const active = isNavItemActive(pathname, href);

  return (
    <Link
      href={targetHref}
      title={collapsed ? label : undefined}
      className={cn(
        "flex items-center gap-2 rounded-md px-2.5 py-2 text-sm transition-colors",
        collapsed && "justify-center px-2",
        active
          ? "border-l-2 border-primary bg-sidebar-accent font-medium text-sidebar-accent-foreground"
          : "border-l-2 border-transparent text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {!collapsed && <span className="truncate">{label}</span>}
    </Link>
  );
}
