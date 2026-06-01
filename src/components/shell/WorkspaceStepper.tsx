"use client";

import Link from "next/link";
import { Check } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  PIPELINE_STEPS,
  computeStepStatuses,
  hrefWithWorkspace,
  type PipelineStepDef,
} from "@/lib/workspace/pipeline";
import type { PipelineStepId, PipelineStepStatus, WorkspaceProgress } from "@/types/workspace";

type Props = {
  currentStep: PipelineStepId;
  workspaceId: string | null;
  progress: WorkspaceProgress | null;
};

function StepDot({ status }: { status: PipelineStepStatus }) {
  if (status === "done") {
    return (
      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
        <Check className="h-3 w-3" />
      </span>
    );
  }
  if (status === "current") {
    return <span className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-primary bg-background" />;
  }
  return <span className="flex h-5 w-5 items-center justify-center rounded-full border border-border bg-muted" />;
}

function StepLink({
  step,
  status,
  href,
  disabled,
}: {
  step: PipelineStepDef;
  status: PipelineStepStatus;
  href: string;
  disabled?: boolean;
}) {
  const content = (
    <>
      <StepDot status={status} />
      <span className="hidden sm:inline">{step.label}</span>
      <span className="sm:hidden">{step.shortLabel}</span>
    </>
  );

  if (disabled) {
    return (
      <span
        className="flex cursor-not-allowed items-center gap-2 text-xs text-muted-foreground/60"
        title="请先选择或保存工作区（道具集）"
      >
        {content}
      </span>
    );
  }

  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-2 text-xs transition-colors",
        status === "current" ? "font-medium text-foreground" : "text-muted-foreground hover:text-foreground",
      )}
    >
      {content}
    </Link>
  );
}

export function WorkspaceStepper({ currentStep, workspaceId, progress }: Props) {
  const statuses = computeStepStatuses(currentStep, progress);

  return (
    <nav aria-label="生产流水线" className="overflow-x-auto">
      <ol className="flex min-w-max items-center gap-1 py-1">
        {PIPELINE_STEPS.map((step, index) => {
          const status = statuses[step.id];
          const needsWorkspace = step.requiresWorkspace && !workspaceId;
          const href = hrefWithWorkspace(step.href, workspaceId);
          return (
            <li key={step.id} className="flex items-center">
              <StepLink step={step} status={status} href={href} disabled={needsWorkspace} />
              {index < PIPELINE_STEPS.length - 1 ? (
                <span className="mx-2 h-px w-6 shrink-0 bg-border sm:w-10" aria-hidden />
              ) : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
