import type { DifficultyAnomaly, DifficultyDiagnosisResult } from "@/types/difficulty";

import { AnomalyList } from "@/components/formula-lab/AnomalyList";
import { DifficultyCurveChart } from "@/components/formula-lab/DifficultyCurveChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { BatchReplaySummary } from "@/features/formula-lab/types";

export function FormulaBatchReplayResultsCard({
  summary,
  results,
  anomalies,
}: {
  summary: BatchReplaySummary | null;
  results: DifficultyDiagnosisResult[];
  anomalies: DifficultyAnomaly[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">批量回放结果</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {summary ? (
          <div className="grid gap-2 text-sm text-muted-foreground md:grid-cols-4">
            <p>关卡数：{summary.count}</p>
            <p>平均 P：{summary.avgP.toFixed(3)}</p>
            <p>最小 P：{summary.minP.toFixed(3)}</p>
            <p>最大 P：{summary.maxP.toFixed(3)}</p>
          </div>
        ) : null}
        <DifficultyCurveChart results={results} />
        <AnomalyList anomalies={anomalies} />
      </CardContent>
    </Card>
  );
}
