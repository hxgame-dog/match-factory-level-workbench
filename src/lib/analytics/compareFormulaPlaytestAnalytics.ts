import type { LevelFeedbackDiagnosisResult } from "@/types/analytics";

export type CalibrationPoint = {
  levelIndex?: number;
  levelName?: string;
  formulaP?: number;
  playtestPassRate?: number;
  actualPassRate?: number;
  formulaMismatch: "none" | "low" | "medium" | "high";
  playtestMismatch: "none" | "low" | "medium" | "high";
};

export function buildCalibrationPoints(diagnoses: LevelFeedbackDiagnosisResult[]): CalibrationPoint[] {
  return diagnoses.map((d) => ({
    levelIndex: d.levelIndex,
    levelName: d.levelName,
    formulaP: d.formula?.P,
    playtestPassRate: d.playtest?.passRate,
    actualPassRate: d.analytics.passRate,
    formulaMismatch: d.comparison.formulaVsAnalytics?.mismatchLevel ?? "none",
    playtestMismatch: d.comparison.playtestVsAnalytics?.mismatchLevel ?? "none",
  }));
}

export function summarizeCalibration(diagnoses: LevelFeedbackDiagnosisResult[]) {
  const formulaMismatchCount = diagnoses.filter(
    (d) => d.issueTags.includes("formula_underestimates") || d.issueTags.includes("formula_overestimates"),
  ).length;
  const playtestMismatchCount = diagnoses.filter(
    (d) => d.issueTags.includes("playtest_underestimates") || d.issueTags.includes("playtest_overestimates"),
  ).length;
  const highSeverityCount = diagnoses.filter((d) => d.severity === "high" || d.severity === "critical").length;
  const passRates = diagnoses.map((d) => d.analytics.passRate).filter((v): v is number => typeof v === "number");
  const avgPassRate = passRates.length ? passRates.reduce((a, b) => a + b, 0) / passRates.length : undefined;
  return { formulaMismatchCount, playtestMismatchCount, highSeverityCount, avgPassRate };
}
