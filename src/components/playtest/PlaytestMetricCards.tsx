"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { PlaytestLevelSimulationResult } from "@/types/playtest";

export function PlaytestMetricCards({ metrics }: { metrics: PlaytestLevelSimulationResult["metrics"] | null }) {
  if (!metrics) {
    return (
      <p className="text-sm text-muted-foreground">运行单关模拟后，将在此显示核心指标。</p>
    );
  }
  const item = (label: string, value: string | number) => (
    <Card className="border border-border">
      <CardHeader className="pb-1">
        <CardTitle className="text-xs text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent className="text-lg font-semibold text-foreground">{value}</CardContent>
    </Card>
  );
  return (
    <div className="grid gap-2 md:grid-cols-5">
      {item("通关率", `${Math.round(metrics.passRate * 100)}%`)}
      {item("平均完成时间", `${metrics.avgCompletionTime.toFixed(1)}s`)}
      {item("平均剩余时间", `${metrics.avgRemainingTime.toFixed(1)}s`)}
      {item("平均步数", metrics.avgMoves.toFixed(1))}
      {item("平均槽位压力", metrics.avgSlotPressure.toFixed(2))}
    </div>
  );
}
