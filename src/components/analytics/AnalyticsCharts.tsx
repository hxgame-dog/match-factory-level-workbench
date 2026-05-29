"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, Tooltip, XAxis, YAxis } from "recharts";
import type { LevelFeedbackDiagnosisResult } from "@/types/analytics";

export function AnalyticsCharts({ diagnoses }: { diagnoses: LevelFeedbackDiagnosisResult[] }) {
  if (!diagnoses.length) return null;
  const rows = [...diagnoses]
    .sort((a, b) => (a.levelIndex ?? 0) - (b.levelIndex ?? 0))
    .map((d) => ({
      levelIndex: d.levelIndex ?? 0,
      passRate: d.analytics.passRate ?? 0,
      quitRate: d.analytics.quitRate ?? 0,
      retryRate: d.analytics.retryRate ?? 0,
      formulaP: d.formula?.P ?? 0,
    }));
  return (
    <Card className="border border-gray-200">
      <CardHeader><CardTitle className="text-sm">Analytics Charts</CardTitle></CardHeader>
      <CardContent className="space-y-4 overflow-x-auto">
        <LineChart width={640} height={220} data={rows}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="levelIndex" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="passRate" name="Pass Rate" stroke="#6366f1" dot={false} />
          <Line type="monotone" dataKey="quitRate" name="Quit Rate" stroke="#ef4444" dot={false} />
          <Line type="monotone" dataKey="retryRate" name="Retry Rate" stroke="#f59e0b" dot={false} />
        </LineChart>
        <BarChart width={640} height={200} data={rows}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="levelIndex" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="formulaP" name="Formula P" fill="#8b5cf6" />
        </BarChart>
      </CardContent>
    </Card>
  );
}
