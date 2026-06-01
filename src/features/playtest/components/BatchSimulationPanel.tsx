"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export type BatchProgress = {
  current: number;
  total: number;
  currentLevelName?: string;
};

export function BatchSimulationPanel({
  selectedCount,
  running,
  progress,
  onRun,
  onCancel,
}: {
  selectedCount: number;
  running: boolean;
  progress: BatchProgress | null;
  onRun: () => void;
  onCancel?: () => void;
}) {
  const pct = progress && progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0;

  return (
    <Card className="border border-border">
      <CardHeader>
        <CardTitle className="text-sm">批量模拟</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs text-muted-foreground">已选择 {selectedCount} 关，将逐关模拟并显示进度。</p>
        <div className="flex flex-wrap gap-2">
          <Button onClick={onRun} disabled={running || selectedCount === 0}>
            {running ? "模拟中…" : "运行批量模拟"}
          </Button>
          {running && onCancel ? (
            <Button variant="outline" onClick={onCancel}>
              取消
            </Button>
          ) : null}
        </div>
        {running && progress ? (
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>
                {progress.currentLevelName
                  ? `正在模拟：${progress.currentLevelName}`
                  : "准备中…"}
              </span>
              <span>
                {progress.current} / {progress.total}（{pct}%）
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
