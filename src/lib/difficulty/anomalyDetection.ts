import type { DifficultyAnomaly, DifficultyDiagnosisResult } from "@/types/difficulty";

export function detectDifficultyAnomalies(results: DifficultyDiagnosisResult[]): DifficultyAnomaly[] {
  const anomalies: DifficultyAnomaly[] = [];
  const sorted = [...results].sort(
    (a, b) => (Number(a.levelId?.replace(/\D/g, "")) || 0) - (Number(b.levelId?.replace(/\D/g, "")) || 0),
  );
  for (let i = 0; i < sorted.length; i += 1) {
    const cur = sorted[i];
    const prev = sorted[i - 1];
    if (prev) {
      const diff = cur.score.P - prev.score.P;
      if (diff > 0.45) anomalies.push({ levelId: cur.levelId ?? "", levelName: cur.levelName ?? "", type: "spike", severity: "high", message: `难度跃升 ${diff.toFixed(2)}` });
      if (diff < -0.45) anomalies.push({ levelId: cur.levelId ?? "", levelName: cur.levelName ?? "", type: "drop", severity: "medium", message: `难度下降 ${Math.abs(diff).toFixed(2)}` });
    }
    if (cur.score.P > 1.8) anomalies.push({ levelId: cur.levelId ?? "", levelName: cur.levelName ?? "", type: "too_hard", severity: "high", message: "P > 1.8" });
    if (cur.score.P < 0.45) anomalies.push({ levelId: cur.levelId ?? "", levelName: cur.levelName ?? "", type: "too_easy", severity: "low", message: "P < 0.45" });
    if (cur.warnings.length >= 4) anomalies.push({ levelId: cur.levelId ?? "", levelName: cur.levelName ?? "", type: "warning_heavy", severity: "medium", message: `warnings=${cur.warnings.length}` });
  }
  return anomalies;
}
