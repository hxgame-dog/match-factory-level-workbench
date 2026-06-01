"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Batch = {
  id: string;
  name: string;
  itemSetName: string;
  totalCount: number;
  successCount: number;
  failedCount: number;
  status: string;
  createdAt: string;
};

type Props = {
  batches: Batch[];
  onOpen: (id: string) => void;
  onDelete: (id: string) => void;
};

export function AssetBatchHistory({ batches, onOpen, onDelete }: Props) {
  return (
    <Card >
      <CardHeader><CardTitle className="text-lg">历史批次区</CardTitle></CardHeader>
      <CardContent className="space-y-2">
        {batches.length === 0 ? (
          <p className="text-sm text-muted-foreground">暂无历史批次</p>
        ) : (
          batches.map((batch) => (
            <div key={batch.id} className="rounded-md border border-border p-3 text-sm">
              <p className="font-medium text-foreground">{batch.name}</p>
              <p className="text-muted-foreground">
                Item Set: {batch.itemSetName} / 总数: {batch.totalCount} / 成功: {batch.successCount} / 失败: {batch.failedCount}
              </p>
              <p className="text-muted-foreground">{batch.status} / {new Date(batch.createdAt).toLocaleString()}</p>
              <div className="mt-2 flex gap-2">
                <Button size="sm" variant="outline" onClick={() => onOpen(batch.id)}>打开</Button>
                <Button size="sm" variant="outline" onClick={() => onDelete(batch.id)}>删除</Button>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
