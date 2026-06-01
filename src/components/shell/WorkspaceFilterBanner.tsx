"use client";

import { useWorkspaceStore } from "@/stores/workspaceStore";

type Props = {
  totalCount: number;
  filteredCount: number;
};

export function WorkspaceFilterBanner({ totalCount, filteredCount }: Props) {
  const activeName = useWorkspaceStore((s) => s.activeName);
  const activeId = useWorkspaceStore((s) => s.activeId);

  if (!activeId || filteredCount === totalCount) return null;

  return (
    <p className="text-sm text-muted-foreground">
      已按工作区「{activeName ?? activeId}」筛选：显示 {filteredCount} / {totalCount} 条
    </p>
  );
}
