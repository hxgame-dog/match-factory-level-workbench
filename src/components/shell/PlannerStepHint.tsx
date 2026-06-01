"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { getPlannerNextStep } from "@/lib/workspace/plannerNextStep";
import { cn } from "@/lib/utils";
import type { WorkspaceProgress } from "@/types/workspace";

type Props = {
  workspaceId: string | null;
  progress: WorkspaceProgress | null;
};

export function PlannerStepHint({ workspaceId, progress }: Props) {
  const next = getPlannerNextStep(workspaceId, progress);
  if (!next) return null;

  return (
    <div className="flex flex-col gap-2 rounded-md border border-primary/20 bg-primary/5 px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-foreground">
        <span className="font-medium">建议下一步：</span>
        {next.hint}
      </p>
      <Link href={next.href} className={cn(buttonVariants({ size: "sm" }), "shrink-0 gap-1")}>
        {next.label}
        <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}
