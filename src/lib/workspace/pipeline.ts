import type { PipelineStepId, PipelineStepStatus, WorkspaceProgress } from "@/types/workspace";

export type PipelineStepDef = {
  id: PipelineStepId;
  label: string;
  shortLabel: string;
  href: string;
  /** 是否必须绑定工作区（道具集）才可进入 */
  requiresWorkspace?: boolean;
};

export const PIPELINE_STEPS: PipelineStepDef[] = [
  { id: "items", label: "道具表", shortLabel: "道具", href: "/item-generator", requiresWorkspace: false },
  { id: "assets", label: "资源出图", shortLabel: "资源", href: "/asset-studio", requiresWorkspace: true },
  { id: "levels", label: "关卡设计", shortLabel: "关卡", href: "/level-generator", requiresWorkspace: true },
  { id: "validate", label: "试玩验证", shortLabel: "验证", href: "/playtest-simulator", requiresWorkspace: true },
  { id: "delivery", label: "管线交付", shortLabel: "交付", href: "/pipeline", requiresWorkspace: true },
];

export function getPipelineStep(id: PipelineStepId) {
  return PIPELINE_STEPS.find((s) => s.id === id) ?? PIPELINE_STEPS[0];
}

export function hrefWithWorkspace(href: string, workspaceId: string | null) {
  if (!workspaceId) return href;
  const url = new URL(href, "http://local");
  url.searchParams.set("workspace", workspaceId);
  return `${url.pathname}${url.search}`;
}

function stepCompleted(id: PipelineStepId, progress: WorkspaceProgress | null): boolean {
  if (!progress) return id === "items";
  switch (id) {
    case "items":
      return progress.itemsReady;
    case "assets":
      return progress.assetsReady;
    case "levels":
      return progress.levelsReady;
    case "validate":
      return progress.levelsReady;
    case "delivery":
      return progress.levelsReady && progress.assetsReady;
    default:
      return false;
  }
}

export function computeStepStatuses(
  currentStep: PipelineStepId,
  progress: WorkspaceProgress | null,
): Record<PipelineStepId, PipelineStepStatus> {
  const result = {} as Record<PipelineStepId, PipelineStepStatus>;
  for (const step of PIPELINE_STEPS) {
    if (step.id === currentStep) {
      result[step.id] = "current";
    } else if (stepCompleted(step.id, progress)) {
      result[step.id] = "done";
    } else {
      result[step.id] = "pending";
    }
  }
  return result;
}
