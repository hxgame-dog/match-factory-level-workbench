"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function PlaytestRunHistory({
  runs,
  onOpen,
  onExport,
  onDelete,
}: {
  runs: Array<{ id: string; name: string; status: string; summaryJson?: string | null; createdAt: string }>;
  onOpen: (id: string) => void;
  onExport: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <Card className="border border-gray-200">
      <CardHeader><CardTitle className="text-sm">Simulation Run History</CardTitle></CardHeader>
      <CardContent className="space-y-2 text-xs">
        {runs.map((run) => (
          <div key={run.id} className="flex items-center justify-between rounded border border-gray-200 p-2">
            <div>
              <p className="font-medium">{run.name}</p>
              <p className="text-gray-500">{run.status} · {new Date(run.createdAt).toLocaleString("zh-CN")}</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpen(run.id)}>Open</Button>
              <Button variant="outline" onClick={() => onExport(run.id)}>Export Report</Button>
              <Button variant="outline" onClick={() => onDelete(run.id)}>Delete</Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
