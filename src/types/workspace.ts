/** 流水线阶段（与侧栏「创作→验证→交付」对齐） */
export type PipelineStepId = "config" | "items" | "assets" | "levels" | "validate" | "delivery";

export type PipelineStepStatus = "pending" | "current" | "done" | "skipped";

export type WorkspaceProgress = {
  itemsReady: boolean;
  assetsReady: boolean;
  levelsReady: boolean;
  itemCount: number;
  assetSuccessCount: number;
  levelCount: number;
};

export type WorkspaceSummary = {
  id: string;
  name: string;
  theme: string;
  itemCount: number;
  updatedAt: string;
  progress: WorkspaceProgress;
};
