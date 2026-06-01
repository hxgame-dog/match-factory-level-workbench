"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CartesianGrid, Line, LineChart, Tooltip, XAxis, YAxis } from "recharts";

export function TargetCurveChart({
  source,
  target,
}: {
  source: Array<{ levelIndex: number; P: number }>;
  target: Array<{ levelIndex: number; targetP: number }>;
}) {
  const rows = [...source.map((s) => ({ levelIndex: s.levelIndex, sourceP: s.P })), ...target.map((t) => ({ levelIndex: t.levelIndex, targetP: t.targetP }))]
    .sort((a, b) => a.levelIndex - b.levelIndex);
  return (
    <Card className="border border-border">
      <CardHeader className="pb-2"><CardTitle className="text-sm">Target Curve 区</CardTitle></CardHeader>
      <CardContent className="h-64">
        <LineChart width={720} height={240} data={rows}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="levelIndex" />
          <YAxis />
          <Tooltip />
          <Line type="monotone" dataKey="sourceP" stroke="#6366f1" name="参考 P" dot={false} />
          <Line type="monotone" dataKey="targetP" stroke="#0ea5e9" name="目标 P" dot={false} />
        </LineChart>
      </CardContent>
    </Card>
  );
}
