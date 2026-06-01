import type { WorkspaceProgress } from "@/types/workspace";

import { hrefWithWorkspace } from "./pipeline";

export type PlannerNextStep = {
  label: string;
  href: string;
  hint: string;
};

/** 根据工作区进度推荐策划的下一步操作 */
export function getPlannerNextStep(
  workspaceId: string | null,
  progress: WorkspaceProgress | null,
): PlannerNextStep | null {
  if (!workspaceId || !progress) return null;

  if (!progress.itemsReady || progress.itemCount === 0) {
    return {
      label: "继续编辑道具表",
      href: hrefWithWorkspace("/item-generator", workspaceId),
      hint: "当前工作区还没有可用的道具表，建议先生成或保存道具。",
    };
  }
  if (!progress.assetsReady || progress.assetSuccessCount === 0) {
    return {
      label: "去资源工作室出图",
      href: hrefWithWorkspace("/asset-studio", workspaceId),
      hint: `已有 ${progress.itemCount} 个道具，下一步可为它们批量生成图片资源。`,
    };
  }
  if (!progress.levelsReady || progress.levelCount === 0) {
    return {
      label: "设计关卡",
      href: hrefWithWorkspace("/level-generator", workspaceId),
      hint: `资源已就绪（${progress.assetSuccessCount} 张），可以开始生成或编辑关卡。`,
    };
  }
  return {
    label: "试玩验证",
    href: hrefWithWorkspace("/playtest-simulator", workspaceId),
    hint: `已有 ${progress.levelCount} 个关卡，建议试玩模拟检查难度与通过率。`,
  };
}
