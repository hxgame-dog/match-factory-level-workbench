"use client";

import Link from "next/link";
import { ArrowRight, History } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { getPlannerNextStep } from "@/lib/workspace/plannerNextStep";
import { cn } from "@/lib/utils";
import { useWorkspaceStore } from "@/stores/workspaceStore";
import type { WorkspaceSummary } from "@/types/workspace";

type Props = {
  workspaces: WorkspaceSummary[];
};

export function ContinueLastWorkspaceBanner({ workspaces }: Props) {
  const activeId = useWorkspaceStore((s) => s.activeId);
  const activeName = useWorkspaceStore((s) => s.activeName);
  const recentIds = useWorkspaceStore((s) => s.recentIds);

  const targetId = activeId ?? recentIds[0];
  const workspace = workspaces.find((w) => w.id === targetId);
  if (!workspace) return null;

  const displayName = activeName ?? workspace.name;
  const next = getPlannerNextStep(workspace.id, workspace.progress);

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-start gap-3">
        <History className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
        <div className="min-w-0">
          <p className="font-medium text-foreground">继续上次工作区</p>
          <p className="mt-0.5 truncate text-sm text-muted-foreground">
            {displayName}
            {workspace.itemCount > 0 ? ` · ${workspace.itemCount} 个道具` : ""}
            {workspace.progress.levelCount > 0 ? ` · ${workspace.progress.levelCount} 个关卡` : ""}
          </p>
        </div>
      </div>
      <div className="flex shrink-0 flex-wrap gap-2">
        {next ? (
          <Link href={next.href} className={cn(buttonVariants({ size: "sm" }), "gap-1")}>
            {next.label}
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        ) : (
          <Link
            href={`/item-generator?workspace=${workspace.id}`}
            className={cn(buttonVariants({ size: "sm" }), "gap-1")}
          >
            继续编辑
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        )}
      </div>
    </div>
  );
}
