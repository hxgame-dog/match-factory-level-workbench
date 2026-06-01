"use client";

import Link from "next/link";
import { FolderKanban } from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import type { WorkspaceProgress } from "@/types/workspace";

type Props = {
  workspaceId: string | null;
  workspaceName: string | null;
  progress: WorkspaceProgress | null;
  onClear?: () => void;
};

export function WorkspaceContextBar({ workspaceId, workspaceName, progress, onClear }: Props) {
  if (!workspaceId) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-dashed border-border bg-muted/40 px-3 py-2 text-sm">
        <span className="text-muted-foreground">未选择工作区：请先在首页选择道具集，或在本页保存生成结果。</span>
        <Link href="/" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
          选择工作区
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border bg-card px-3 py-2">
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <FolderKanban className="h-4 w-4 shrink-0 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">当前工作区</span>
        <span className="truncate text-sm font-medium text-foreground">{workspaceName ?? workspaceId}</span>
        {progress ? (
          <div className="flex flex-wrap gap-1">
            <Badge variant={progress.itemsReady ? "secondary" : "outline"} className="text-xs">
              道具 {progress.itemCount}
            </Badge>
            <Badge variant={progress.assetsReady ? "secondary" : "outline"} className="text-xs">
              资源 {progress.assetSuccessCount}
            </Badge>
            <Badge variant={progress.levelsReady ? "secondary" : "outline"} className="text-xs">
              关卡 {progress.levelCount}
            </Badge>
          </div>
        ) : null}
      </div>
      <div className="flex gap-2">
        <Link href="/" className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>
          更换
        </Link>
        {onClear ? (
          <Button variant="ghost" size="sm" onClick={onClear}>
            取消绑定
          </Button>
        ) : null}
      </div>
    </div>
  );
}
