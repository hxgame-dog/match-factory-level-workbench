import type { LevelConfig } from "@/types/level";
import type { PlaytestLevelSimulationResult, SimulatorConfig } from "@/types/playtest";

export function evaluateQaRules(input: {
  level: LevelConfig;
  result: PlaytestLevelSimulationResult["metrics"];
  config: SimulatorConfig;
}) {
  const qaIssues: PlaytestLevelSimulationResult["qaIssues"] = [];
  const balanceSuggestions: PlaytestLevelSimulationResult["balanceSuggestions"] = [];
  const targetNeed = input.level.targets.reduce((s, t) => s + t.count, 0);
  const spawnTarget = input.level.spawns.filter((s) => s.role === "target").reduce((s, t) => s + t.count, 0);
  const spawnTotal = input.level.spawns.reduce((s, t) => s + t.count, 0);
  const distractorTotal = input.level.spawns.filter((s) => s.role === "distractor").reduce((s, t) => s + t.count, 0);
  const distractorRatio = spawnTotal ? distractorTotal / spawnTotal : 0;

  if (!input.level.targets.length) qaIssues.push({ code: "no_targets", severity: "critical", title: "目标为空", detail: "targets 为空，关卡无法定义完成条件" });
  if (!input.level.spawns.length) qaIssues.push({ code: "no_spawns", severity: "critical", title: "投放为空", detail: "spawns 为空，关卡无法运行" });
  if (spawnTarget < targetNeed) qaIssues.push({ code: "target_insufficient", severity: "critical", title: "目标物不足", detail: "目标需求大于可用投放数量" });
  if (input.result.passRate < input.config.qaThresholds.minPassRate) {
    qaIssues.push({ code: "pass_rate_too_low", severity: "high", title: "通关率过低", detail: "模拟通关率低于阈值", affectedMetric: "passRate" });
    balanceSuggestions.push({ priority: "high", action: "increase_time", detail: "增加 timeLimitSec 或降低干扰", expectedEffect: "提升通关率" });
  }
  if (input.result.passRate > input.config.qaThresholds.maxPassRate && (input.level.levelIndex ?? 1) > 5) {
    qaIssues.push({ code: "pass_rate_too_high", severity: "medium", title: "通关率过高", detail: "关卡可能过易", affectedMetric: "passRate" });
    balanceSuggestions.push({ priority: "medium", action: "increase_distractors", detail: "适度提升干扰密度", expectedEffect: "增加挑战" });
  }
  if (input.result.avgRemainingTime < input.config.qaThresholds.minAvgRemainingTime) {
    qaIssues.push({ code: "time_too_tight", severity: "high", title: "时间过紧", detail: "平均剩余时间低于阈值", affectedMetric: "avgRemainingTime" });
    balanceSuggestions.push({ priority: "high", action: "increase_time", detail: "增加时间上限", expectedEffect: "降低失败率" });
  }
  if (input.result.avgRemainingTime > input.config.qaThresholds.maxAvgRemainingTime) {
    qaIssues.push({ code: "time_too_loose", severity: "low", title: "时间过松", detail: "平均剩余时间过高", affectedMetric: "avgRemainingTime" });
    balanceSuggestions.push({ priority: "low", action: "decrease_time", detail: "降低时间上限", expectedEffect: "提升节奏紧张感" });
  }
  if (input.result.avgSlotPressure > input.config.qaThresholds.maxSlotPressure) {
    qaIssues.push({ code: "slot_pressure_high", severity: "high", title: "槽位压力过高", detail: "平均槽位压力超过阈值", affectedMetric: "avgSlotPressure" });
    balanceSuggestions.push({ priority: "high", action: "reduce_distractors", detail: "减少干扰物或增加目标连消机会", expectedEffect: "降低槽位卡死" });
  }
  if (input.result.targetStarvationTurnsAvg > input.config.qaThresholds.maxTargetStarvationTurns) {
    qaIssues.push({ code: "target_starvation", severity: "medium", title: "目标饥饿问题", detail: "目标长时间不可获得", affectedMetric: "targetStarvationTurnsAvg" });
    balanceSuggestions.push({ priority: "medium", action: "change_generator_rule", detail: "调整生成规则以更早暴露目标", expectedEffect: "缩短目标空窗期" });
  }
  if (distractorRatio > 0.6) {
    qaIssues.push({ code: "too_many_distractors", severity: "medium", title: "干扰物过多", detail: "干扰比例过高" });
  }
  const missingAssets = input.level.spawns.filter((s) => s.assetKey && !input.level.assets[s.assetKey]).length;
  if (missingAssets > 0) {
    qaIssues.push({ code: "missing_assets", severity: "medium", title: "资源缺失", detail: `缺少资源映射 ${missingAssets} 项` });
  }
  if (spawnTotal > input.level.board.width * input.level.board.height * Math.max(1, input.level.board.layerCount) * 4) {
    qaIssues.push({ code: "spawn_over_capacity", severity: "high", title: "投放超容量", detail: "投放总量显著超出棋盘容量" });
  }
  return { qaIssues, balanceSuggestions };
}
