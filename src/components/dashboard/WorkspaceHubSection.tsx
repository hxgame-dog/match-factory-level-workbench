"use client";

import Link from "next/link";
import { Plus } from "lucide-react";

import { WorkspaceCard } from "@/components/dashboard/WorkspaceCard";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/ui/empty-state";
import { useWorkspaceStore } from "@/stores/workspaceStore";
import type { WorkspaceSummary } from "@/types/workspace";

type Props = {
  workspaces: WorkspaceSummary[];
};

export function WorkspaceHubSection({ workspaces }: Props) {
  const activeId = useWorkspaceStore((s) => s.activeId);

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-serif text-lg font-semibold tracking-tight text-foreground">工作区</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            以道具集为单位串联道具表、资源出图与关卡设计。选择工作区后，流水线各步骤将自动带上上下文。
          </p>
        </div>
        <Link href="/item-generator" className={cn(buttonVariants({ size: "sm" }), "inline-flex items-center")}>
          <Plus className="mr-1 h-4 w-4" />
          新建道具表
        </Link>
      </div>

      {workspaces.length === 0 ? (
        <EmptyState
          title="尚无工作区"
          description="在 AI 道具表生成器中生成并保存道具集后，将在此显示为工作区。"
          action={
            <Link href="/item-generator" className={cn(buttonVariants())}>
              去生成道具表
            </Link>
          }
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {workspaces.map((ws) => (
            <WorkspaceCard key={ws.id} workspace={ws} isActive={ws.id === activeId} />
          ))}
        </div>
      )}
    </section>
  );
}
