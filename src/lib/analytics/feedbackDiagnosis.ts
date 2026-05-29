import type { DifficultyDiagnosisResult } from "@/types/difficulty";
import type { PlaytestLevelSimulationResult } from "@/types/playtest";
import type { LevelFeedbackDiagnosisResult, StandardLevelAnalyticsRow } from "@/types/analytics";

function confidenceFromVolume(starts?: number, users?: number): "low" | "medium" | "high" {
  const volume = starts ?? users ?? 0;
  if (volume >= 300) return "high";
  if (volume >= 50) return "medium";
  return "low";
}

function actualDifficultyLabel(passRate?: number): string {
  if (passRate === undefined) return "unknown";
  if (passRate >= 0.9) return "too_easy";
  if (passRate >= 0.75) return "normal_easy";
  if (passRate >= 0.55) return "normal";
  if (passRate >= 0.35) return "hard";
  return "too_hard";
}

export function feedbackDiagnosis(input: {
  analytics: StandardLevelAnalyticsRow;
  formulaDiagnosis?: DifficultyDiagnosisResult;
  playtestResult?: PlaytestLevelSimulationResult;
}): LevelFeedbackDiagnosisResult {
  const { analytics, formulaDiagnosis, playtestResult } = input;
  const issueTags: LevelFeedbackDiagnosisResult["issueTags"] = [];
  const suggestions: LevelFeedbackDiagnosisResult["suggestions"] = [];
  const qualityWarnings: string[] = [];

  const confidence = confidenceFromVolume(analytics.starts, analytics.users);
  if (confidence === "low") {
    issueTags.push("low_data_confidence");
    qualityWarnings.push("样本量较低，结论可信度有限");
  }

  const passRate = analytics.passRate;
  const actualLabel = actualDifficultyLabel(passRate);

  // 真实难度
  if (passRate !== undefined) {
    if (passRate >= 0.9) {
      issueTags.push("too_easy_real");
      suggestions.push({ priority: "medium", action: "decrease_time", detail: "真实通关率过高，关卡偏易", expectedEffect: "提升挑战性，降低过易感" });
    } else if (passRate < 0.35) {
      issueTags.push("too_hard_real");
      suggestions.push({ priority: "high", action: "increase_time", detail: "真实通关率过低，关卡偏难", expectedEffect: "提升可完成率，降低流失" });
    }
  }

  // Formula 对比
  let formulaVsAnalytics: LevelFeedbackDiagnosisResult["comparison"]["formulaVsAnalytics"];
  if (formulaDiagnosis && passRate !== undefined) {
    const P = formulaDiagnosis.score.P;
    let mismatch: "none" | "low" | "medium" | "high" = "none";
    let message = "公式与真实表现基本一致";
    if (P < 0.8 && passRate < 0.55) {
      issueTags.push("formula_underestimates");
      mismatch = "high";
      message = "公式低估了难度：P 偏低但真实通关率偏低";
      suggestions.push({ priority: "medium", action: "review_formula", detail: "公式低估难度，建议校准权重", expectedEffect: "提升公式与真实一致性" });
    } else if (P > 1.6 && passRate > 0.75) {
      issueTags.push("formula_overestimates");
      mismatch = "high";
      message = "公式高估了难度：P 偏高但真实通关率偏高";
      suggestions.push({ priority: "medium", action: "review_formula", detail: "公式高估难度，建议校准权重", expectedEffect: "提升公式与真实一致性" });
    }
    formulaVsAnalytics = {
      expectedLabel: formulaDiagnosis.score.label,
      actualLabel,
      mismatchLevel: mismatch,
      message,
    };
  }

  // Playtest 对比
  let playtestVsAnalytics: LevelFeedbackDiagnosisResult["comparison"]["playtestVsAnalytics"];
  if (playtestResult && passRate !== undefined) {
    const simulated = playtestResult.metrics.passRate;
    const delta = Math.abs(simulated - passRate);
    let mismatch: "none" | "low" | "medium" | "high" = "none";
    if (delta < 0.1) mismatch = "none";
    else if (delta < 0.2) mismatch = "low";
    else if (delta < 0.35) mismatch = "medium";
    else mismatch = "high";
    if (mismatch === "medium" || mismatch === "high") {
      if (simulated > passRate) {
        issueTags.push("playtest_overestimates");
        suggestions.push({ priority: "medium", action: "review_playtest_model", detail: "模拟器高估通关率，建议校准玩家模型", expectedEffect: "提升模拟与真实一致性" });
      } else {
        issueTags.push("playtest_underestimates");
        suggestions.push({ priority: "medium", action: "review_playtest_model", detail: "模拟器低估通关率，建议校准玩家模型", expectedEffect: "提升模拟与真实一致性" });
      }
    }
    playtestVsAnalytics = {
      simulatedPassRate: simulated,
      actualPassRate: passRate,
      delta,
      mismatchLevel: mismatch,
      message: mismatch === "none" ? "模拟与真实接近" : `模拟与真实差值 ${(delta * 100).toFixed(1)}%`,
    };
  }

  // 退出率
  let quitCritical = false;
  if (analytics.quitRate !== undefined) {
    if (analytics.quitRate > 0.4) {
      issueTags.push("high_quit_rate");
      quitCritical = true;
      suggestions.push({ priority: "high", action: "increase_time", detail: "退出率极高，建议降低时间压力与目标稀疏", expectedEffect: "降低流失" });
    } else if (analytics.quitRate > 0.25) {
      issueTags.push("high_quit_rate");
      suggestions.push({ priority: "medium", action: "reduce_distractors", detail: "退出率偏高，建议降低干扰压力", expectedEffect: "降低流失" });
    }
  }

  // 重试率
  let retryCritical = false;
  if (analytics.retryRate !== undefined) {
    if (analytics.retryRate > 0.55) {
      issueTags.push("high_retry_rate");
      retryCritical = true;
    } else if (analytics.retryRate > 0.35) {
      issueTags.push("high_retry_rate");
    }
  }

  // 道具依赖
  if ((analytics.avgBoostersUsed ?? 0) > 1.5) {
    issueTags.push("booster_dependency");
    suggestions.push({ priority: "medium", action: "reduce_spawn_count", detail: "道具依赖偏高，建议降低投放总量并提升目标可见性", expectedEffect: "降低对道具的依赖" });
  }

  if (issueTags.length === 0) issueTags.push("healthy");

  let severity: LevelFeedbackDiagnosisResult["severity"] = "healthy";
  if (quitCritical || retryCritical || issueTags.includes("too_hard_real")) severity = "critical";
  else if (issueTags.includes("formula_underestimates") || issueTags.includes("playtest_overestimates") || issueTags.includes("high_quit_rate")) severity = "high";
  else if (issueTags.includes("too_easy_real") || issueTags.includes("high_retry_rate") || issueTags.includes("booster_dependency")) severity = "medium";
  else if (issueTags.includes("low_data_confidence") && issueTags.length === 1) severity = "low";
  else if (!issueTags.includes("healthy")) severity = "low";

  return {
    levelId: analytics.levelId,
    levelIndex: analytics.levelIndex,
    levelName: analytics.levelName,
    dataQuality: {
      hasAnalytics: passRate !== undefined || analytics.starts !== undefined,
      users: analytics.users,
      starts: analytics.starts,
      confidence,
      warnings: qualityWarnings,
    },
    analytics: {
      passRate: analytics.passRate,
      failRate: analytics.failRate,
      quitRate: analytics.quitRate,
      retryRate: analytics.retryRate,
      avgDurationSec: analytics.avgDurationSec,
      avgRemainingTimeSec: analytics.avgRemainingTimeSec,
      avgMoves: analytics.avgMoves,
      avgBoostersUsed: analytics.avgBoostersUsed,
      avgHintsUsed: analytics.avgHintsUsed,
      avgShuffleUsed: analytics.avgShuffleUsed,
    },
    formula: formulaDiagnosis
      ? {
          P: formulaDiagnosis.score.P,
          label: formulaDiagnosis.score.label,
          M: formulaDiagnosis.score.M,
          D: formulaDiagnosis.score.D,
          T: formulaDiagnosis.score.T,
        }
      : undefined,
    playtest: playtestResult
      ? {
          passRate: playtestResult.metrics.passRate,
          avgRemainingTime: playtestResult.metrics.avgRemainingTime,
          avgSlotPressure: playtestResult.metrics.avgSlotPressure,
          mainFailReason: playtestResult.failReasons?.[0]?.reason,
        }
      : undefined,
    comparison: { formulaVsAnalytics, playtestVsAnalytics },
    issueTags,
    severity,
    suggestions,
  };
}
