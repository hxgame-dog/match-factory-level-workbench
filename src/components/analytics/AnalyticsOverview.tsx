"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { LevelFeedbackDiagnosisResult } from "@/types/analytics";

export function AnalyticsOverview({
  diagnoses,
  unmatchedCount,
}: {
  diagnoses: LevelFeedbackDiagnosisResult[];
  unmatchedCount: number;
}) {
  if (!diagnoses.length) return null;
  const passRates = diagnoses.map((d) => d.analytics.passRate).filter((v): v is number => typeof v === "number");
  const avg = (list: number[]) => (list.length ? list.reduce((a, b) => a + b, 0) / list.length : 0);
  const hard = diagnoses.filter((d) => d.issueTags.includes("too_hard_real")).length;
  const easy = diagnoses.filter((d) => d.issueTags.includes("too_easy_real")).length;
  const lowConf = diagnoses.filter((d) => d.dataQuality.confidence === "low").length;
  const cell = (label: string, value: string | number) => (
    <div className="rounded border border-gray-200 p-2">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-lg font-semibold">{value}</p>
    </div>
  );
  return (
    <Card className="border border-gray-200">
      <CardHeader><CardTitle className="text-sm">Analytics Overview</CardTitle></CardHeader>
      <CardContent className="grid grid-cols-3 gap-2 md:grid-cols-6">
        {cell("关卡数", diagnoses.length)}
        {cell("平均通关率", `${Math.round(avg(passRates) * 100)}%`)}
        {cell("Hard 关", hard)}
        {cell("Easy 关", easy)}
        {cell("低置信", lowConf)}
        {cell("未匹配", unmatchedCount)}
      </CardContent>
    </Card>
  );
}
