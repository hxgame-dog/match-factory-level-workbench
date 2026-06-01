"use client";

import Link from "next/link";
import { CheckCircle2, Circle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { hrefWithWorkspace } from "@/lib/workspace/pipeline";
import { useWorkspaceStore } from "@/stores/workspaceStore";
import type { WorkspaceSummary } from "@/types/workspace";

const MILESTONES = [
  { key: "items" as const, label: "道具", ready: (w: WorkspaceSummary) => w.progress.itemsReady },
  { key: "assets" as const, label: "资源", ready: (w: WorkspaceSummary) => w.progress.assetsReady },
  { key: "levels" as const, label: "关卡", ready: (w: WorkspaceSummary) => w.progress.levelsReady },
];

type Props = {
  workspace: WorkspaceSummary;
  isActive?: boolean;
};

export function WorkspaceCard({ workspace, isActive }: Props) {
  const setActive = useWorkspaceStore((s) => s.setActive);

  function openWorkspace() {
    setActive(workspace.id, workspace.name);
  }

  const updated = new Date(workspace.updatedAt).toLocaleString("zh-CN", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <Card className={isActive ? "ring-1 ring-primary" : undefined}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base font-semibold leading-snug">{workspace.name}</CardTitle>
          {isActive ? (
            <Badge variant="secondary" className="shrink-0 text-xs">
              当前
            </Badge>
          ) : null}
        </div>
        <p className="line-clamp-1 text-xs text-muted-foreground">{workspace.theme}</p>
      </CardHeader>
      <CardContent className="space-y-3">
        <ul className="flex flex-wrap gap-3 text-xs text-muted-foreground">
          {MILESTONES.map((m) => {
            const done = m.ready(workspace);
            return (
              <li key={m.key} className="flex items-center gap-1">
                {done ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                ) : (
                  <Circle className="h-3.5 w-3.5" />
                )}
                <span className={done ? "text-foreground" : undefined}>{m.label}</span>
              </li>
            );
          })}
        </ul>
        <p className="text-xs text-muted-foreground">更新于 {updated}</p>
        <div className="flex flex-wrap gap-2">
          <Link
            href={hrefWithWorkspace("/item-generator", workspace.id)}
            onClick={() => openWorkspace()}
            className={cn(buttonVariants({ size: "sm" }))}
          >
            继续编辑
          </Link>
          <Link
            href={hrefWithWorkspace("/asset-studio", workspace.id)}
            onClick={() => openWorkspace()}
            className={cn(buttonVariants({ size: "sm", variant: "outline" }))}
          >
            资源出图
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
