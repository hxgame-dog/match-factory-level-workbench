"use client";

import { useEffect, useState } from "react";

import { WorkspaceContextBar } from "@/components/shell/WorkspaceContextBar";
import { WorkspaceStepper } from "@/components/shell/WorkspaceStepper";
import { useWorkspaceStore } from "@/stores/workspaceStore";
import type { PipelineStepId, WorkspaceProgress } from "@/types/workspace";

type Props = {
  step: PipelineStepId;
  children: React.ReactNode;
  /** 服务端传入的当前工作区进度（与 activeId 匹配时展示） */
  workspaceProgress?: WorkspaceProgress | null;
};

export function WorkspaceShell({ step, children, workspaceProgress = null }: Props) {
  const activeId = useWorkspaceStore((s) => s.activeId);
  const activeName = useWorkspaceStore((s) => s.activeName);
  const clearActive = useWorkspaceStore((s) => s.clearActive);
  const [progress, setProgress] = useState<WorkspaceProgress | null>(workspaceProgress);

  useEffect(() => {
    setProgress(workspaceProgress);
  }, [workspaceProgress]);

  useEffect(() => {
    if (!activeId) return;
    let cancelled = false;
    void fetch(`/api/workspaces/${activeId}`)
      .then((r) => r.json())
      .then((payload) => {
        if (!cancelled && payload.success) {
          setProgress(payload.data.progress);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [activeId]);

  return (
    <div className="flex w-full min-w-0 flex-col gap-4">
      <div className="rounded-lg border border-border bg-card/50 px-3 py-3 sm:px-4">
        <WorkspaceStepper currentStep={step} workspaceId={activeId} progress={progress} />
      </div>
      <WorkspaceContextBar
        workspaceId={activeId}
        workspaceName={activeName}
        progress={progress}
        onClear={clearActive}
      />
      <div className="min-w-0">{children}</div>
    </div>
  );
}
