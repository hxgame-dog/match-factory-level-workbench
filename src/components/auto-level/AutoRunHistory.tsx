"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function AutoRunHistory({
  runs,
  onOpen,
  onDelete,
}: {
  runs: Array<{ id: string; name: string; status: string; generateCount: number; createdAt: string }>;
  onOpen: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <Card className="border border-border">
      <CardHeader><CardTitle className="text-sm">历史 Auto Runs</CardTitle></CardHeader>
      <CardContent className="space-y-2">
        {runs.map((run) => (
          <div key={run.id} className="flex items-center justify-between rounded-sm border border-border p-2 text-xs">
            <div>
              <p className="font-medium">{run.name}</p>
              <p className="text-muted-foreground">{run.status} · 生成 {run.generateCount} 关</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpen(run.id)}>打开</Button>
              <Button variant="outline" onClick={() => onDelete(run.id)}>删除</Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
