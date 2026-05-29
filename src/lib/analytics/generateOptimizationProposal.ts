import { levelConfigSchema } from "@/lib/validators/level";
import type { LevelConfig } from "@/types/level";
import type { LevelFeedbackDiagnosisResult, OptimizationProposalResult } from "@/types/analytics";

type Mode = "conservative" | "balanced" | "aggressive";

const factorByMode: Record<Mode, number> = { conservative: 0.05, balanced: 0.1, aggressive: 0.15 };

function clone(level: LevelConfig): LevelConfig {
  return JSON.parse(JSON.stringify(level));
}

export function generateOptimizationProposal(input: {
  level: LevelConfig;
  diagnosis: LevelFeedbackDiagnosisResult;
  mode: Mode;
}): OptimizationProposalResult {
  const { level, diagnosis, mode } = input;
  const optimized = clone(level);
  const diff: OptimizationProposalResult["diff"] = [];
  const warnings: string[] = [];
  const factor = factorByMode[mode];

  const tags = new Set(diagnosis.issueTags);
  const record = (path: string, before: unknown, after: unknown, reason: string) => {
    if (JSON.stringify(before) !== JSON.stringify(after)) diff.push({ path, before, after, reason });
  };

  const tooHard = tags.has("too_hard_real") || diagnosis.severity === "critical";
  const tooEasy = tags.has("too_easy_real");
  const highQuit = tags.has("high_quit_rate");
  const boosterDep = tags.has("booster_dependency");

  if (tooHard || highQuit) {
    const beforeTime = optimized.rules.timeLimitSec;
    optimized.rules.timeLimitSec = Math.round(beforeTime * (1 + (tooHard ? factor + 0.05 : factor)));
    record("rules.timeLimitSec", beforeTime, optimized.rules.timeLimitSec, "提升时间上限以降低难度/退出率");

    const beforeSpawns = optimized.spawns.map((s) => ({ name: s.name, count: s.count }));
    optimized.spawns = optimized.spawns.map((s) =>
      s.role === "distractor" ? { ...s, count: Math.max(1, Math.round(s.count * (1 - factor))) } : s,
    );
    record("spawns(distractor.count)", beforeSpawns, optimized.spawns.map((s) => ({ name: s.name, count: s.count })), "减少干扰物投放数量");
  }

  if (tooEasy) {
    const beforeTime = optimized.rules.timeLimitSec;
    optimized.rules.timeLimitSec = Math.max(60, Math.round(beforeTime * (1 - factor)));
    record("rules.timeLimitSec", beforeTime, optimized.rules.timeLimitSec, "降低时间上限以提升挑战");
    if (mode !== "conservative" && optimized.board.layerCount < 5) {
      const beforeLayer = optimized.board.layerCount;
      optimized.board.layerCount = beforeLayer + 1;
      record("board.layerCount", beforeLayer, optimized.board.layerCount, "增加层数提升遮挡难度");
    }
  }

  if (boosterDep) {
    const beforeSpawns = optimized.spawns.reduce((s, x) => s + x.count, 0);
    optimized.spawns = optimized.spawns.map((s) => ({ ...s, count: Math.max(1, Math.round(s.count * (1 - factor * 0.5))) }));
    const afterSpawns = optimized.spawns.reduce((s, x) => s + x.count, 0);
    record("spawns(totalCount)", beforeSpawns, afterSpawns, "降低投放总量以减少道具依赖");
  }

  optimized.meta = { ...optimized.meta, updatedAt: new Date().toISOString(), notes: `analytics_optimization_${mode}` };

  const parsed = levelConfigSchema.safeParse(optimized);
  if (!parsed.success) {
    warnings.push("优化后关卡未通过 LevelConfig 校验: " + parsed.error.issues.map((i) => i.message).join("; "));
  }

  return {
    proposalName: `${level.name} 优化(${mode})`,
    optimizedLevel: parsed.success ? parsed.data : optimized,
    diff,
    reason: `基于真实数据诊断 (${[...tags].join(", ")}) 生成 ${mode} 优化方案`,
    warnings,
  };
}
