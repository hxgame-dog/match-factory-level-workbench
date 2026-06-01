"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function AnalyticsHistoryPanel({
  batches,
  onOpen,
  onDelete,
  onExport,
}: {
  batches: Array<{ id: string; name: string; source?: string | null; status: string; rowCount: number; createdAt: string }>;
  onOpen: (id: string) => void;
  onDelete: (id: string) => void;
  onExport: (id: string) => void;
}) {
  return (
    <Card className="border border-border">
      <CardHeader><CardTitle className="text-sm">Import / Diagnosis History</CardTitle></CardHeader>
      <CardContent className="space-y-2 text-xs">
        {batches.map((b) => (
          <div key={b.id} className="flex items-center justify-between rounded border border-border p-2">
            <div>
              <p className="font-medium">{b.name}</p>
              <p className="text-muted-foreground">{b.source ?? "-"} · {b.status} · {b.rowCount} 行 · {new Date(b.createdAt).toLocaleString("zh-CN")}</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpen(b.id)}>Open</Button>
              <Button variant="outline" onClick={() => onExport(b.id)}>Export</Button>
              <Button variant="outline" onClick={() => onDelete(b.id)}>Delete</Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
