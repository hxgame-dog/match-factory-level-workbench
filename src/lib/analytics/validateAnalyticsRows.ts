import type { AnalyticsRowWarning, StandardLevelAnalyticsRow } from "@/types/analytics";

export function validateAnalyticsRows(rows: StandardLevelAnalyticsRow[]): {
  validCount: number;
  warnings: AnalyticsRowWarning[];
} {
  const warnings: AnalyticsRowWarning[] = [];
  let validCount = 0;

  rows.forEach((row, index) => {
    const hasMatchKey = row.levelId !== undefined || row.levelIndex !== undefined || row.levelName !== undefined;
    if (!hasMatchKey) {
      warnings.push({ row: index + 1, message: "缺少 levelId / levelIndex / levelName，无法匹配关卡" });
    }
    const hasAnyMetric =
      row.starts !== undefined ||
      row.users !== undefined ||
      row.passRate !== undefined ||
      row.completes !== undefined;
    if (!hasAnyMetric) {
      warnings.push({ row: index + 1, message: "缺少有效的关卡表现指标" });
    }
    if (hasMatchKey && hasAnyMetric) validCount += 1;
  });

  return { validCount, warnings };
}
