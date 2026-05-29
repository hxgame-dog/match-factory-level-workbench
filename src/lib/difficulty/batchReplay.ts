import type { DifficultyDiagnosisResult, DifficultyFormulaConfig } from "@/types/difficulty";
import type { LevelConfig } from "@/types/level";

import { detectDifficultyAnomalies } from "./anomalyDetection";
import { diagnoseLevelDifficulty } from "./diagnoseLevelDifficulty";

export function runBatchReplay(input: {
  levels: Array<{ id: string; name: string; level: LevelConfig }>;
  formulaConfig: DifficultyFormulaConfig;
}) {
  const results: DifficultyDiagnosisResult[] = [];
  for (const row of input.levels) {
    try {
      const diagnosis = diagnoseLevelDifficulty({ level: row.level, formulaConfig: input.formulaConfig });
      results.push({ ...diagnosis, levelId: row.id, levelName: row.name });
    } catch {
      // 单关失败不阻断批量回放
    }
  }
  const anomalies = detectDifficultyAnomalies(results);
  const Ps = results.map((r) => r.score.P);
  const labelDistribution = results.reduce<Record<string, number>>((acc, r) => {
    acc[r.score.label] = (acc[r.score.label] ?? 0) + 1;
    return acc;
  }, {});
  return {
    results,
    anomalies,
    summary: {
      count: results.length,
      avgP: Ps.length ? Ps.reduce((a, b) => a + b, 0) / Ps.length : 0,
      maxP: Ps.length ? Math.max(...Ps) : 0,
      minP: Ps.length ? Math.min(...Ps) : 0,
      labelDistribution,
    },
  };
}
