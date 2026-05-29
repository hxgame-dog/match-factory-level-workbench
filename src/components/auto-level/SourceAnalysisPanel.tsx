"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { SourceLevelPatternAnalysis } from "@/types/autoLevel";

export function SourceAnalysisPanel({ analysis }: { analysis: SourceLevelPatternAnalysis | null }) {
  if (!analysis) return null;
  return (
    <Card className="border border-gray-200">
      <CardHeader className="pb-2"><CardTitle className="text-sm">Source Analysis 区</CardTitle></CardHeader>
      <CardContent className="space-y-1 text-xs text-gray-700">
        <p>平均 P：{analysis.difficulty?.avgP?.toFixed?.(3) ?? "-"}</p>
        <p>P 范围：{analysis.difficulty?.minP?.toFixed?.(3)} ~ {analysis.difficulty?.maxP?.toFixed?.(3)}</p>
        <p>趋势：{analysis.difficulty?.trend ?? "-"}</p>
        <p>平均增长：{analysis.difficulty?.avgGrowth?.toFixed?.(3) ?? "-"}</p>
        <p>波动度：{analysis.difficulty?.volatility?.toFixed?.(3) ?? "-"}</p>
        <p>平均目标类型数：{analysis.items?.avgTargetTypeCount?.toFixed?.(2) ?? "-"}</p>
        <p>平均投放总量：{analysis.items?.avgSpawnTotalCount?.toFixed?.(2) ?? "-"}</p>
      </CardContent>
    </Card>
  );
}
