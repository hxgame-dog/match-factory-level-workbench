"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

export function SingleLevelSimulationPanel({
  levelName,
  running,
  includeSamples,
  onIncludeSamplesChange,
  onRun,
}: {
  levelName?: string;
  running: boolean;
  includeSamples: boolean;
  onIncludeSamplesChange: (v: boolean) => void;
  onRun: () => void;
}) {
  return (
    <Card className="border border-gray-200">
      <CardHeader>
        <CardTitle className="text-sm">单关模拟</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs text-gray-500">
          {levelName ? `当前关卡：${levelName}` : "请先在左侧选择至少 1 关（取第一关作为单关目标）"}
        </p>
        <label className="flex items-center justify-between gap-2 text-xs text-gray-600">
          <span>记录样本分布（用于直方图，略增耗时）</span>
          <Switch checked={includeSamples} onCheckedChange={onIncludeSamplesChange} />
        </label>
        <Button onClick={onRun} disabled={running || !levelName}>
          {running ? "模拟中…" : "运行单关模拟"}
        </Button>
      </CardContent>
    </Card>
  );
}
