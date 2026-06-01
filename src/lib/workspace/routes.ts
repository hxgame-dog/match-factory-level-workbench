import type { PipelineStepId } from "@/types/workspace";

import { PIPELINE_STEPS } from "./pipeline";

/** 关卡设计阶段的扩展工具（共享流水线「关卡」步骤） */
export const LEVEL_DESIGN_TOOLS = [
  { href: "/level-generator", label: "关卡生成", shortLabel: "生成" },
  { href: "/level-editor", label: "关卡编辑器", shortLabel: "编辑" },
  { href: "/formula-lab", label: "公式实验室", shortLabel: "公式" },
  { href: "/auto-level-generator", label: "自动续关", shortLabel: "续关" },
] as const;

/** 试玩验证阶段的扩展工具 */
export const VALIDATE_TOOLS = [{ href: "/analytics-feedback", label: "数据回灌", shortLabel: "回灌" }] as const;

const LEVEL_TOOL_PATHS: string[] = LEVEL_DESIGN_TOOLS.map((t) => t.href);
const VALIDATE_TOOL_PATHS: string[] = VALIDATE_TOOLS.map((t) => t.href);

export function isLevelDesignToolPath(pathname: string): boolean {
  return LEVEL_TOOL_PATHS.includes(pathname);
}

export function isValidateToolPath(pathname: string): boolean {
  return VALIDATE_TOOL_PATHS.includes(pathname);
}

/** 根据路由推断流水线当前步骤（供侧栏高亮等） */
export function pipelineStepForPath(pathname: string): PipelineStepId | null {
  if (isLevelDesignToolPath(pathname)) return "levels";
  if (isValidateToolPath(pathname)) return "validate";
  const match = PIPELINE_STEPS.find((s) => pathname === s.href);
  return match?.id ?? null;
}

export function isNavItemActive(pathname: string, href: string): boolean {
  if (pathname === href) return true;
  if (href !== "/" && pathname.startsWith(`${href}/`)) return true;
  return false;
}
