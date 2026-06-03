"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type BatchOption = {
  id: string;
  name: string;
  itemSetName: string;
  successCount: number;
  totalCount: number;
  failedCount: number;
};

type Props = {
  itemSetName?: string;
  itemCount: number;
  batches: BatchOption[];
  currentBatchId: string;
  onBatchChange: (batchId: string) => void;
  stats: {
    total: number;
    done: number;
    failed: number;
    missing: number;
  };
};

export function AssetStudioContextBar(props: Props) {
  const currentBatch = props.batches.find((b) => b.id === props.currentBatchId);
  const coverage =
    props.stats.total > 0 ? Math.round((props.stats.done / props.stats.total) * 100) : 0;

  return (
    <Card className="border-primary/20 bg-muted/30">
      <CardContent className="grid gap-3 py-4 md:grid-cols-[1fr_auto] md:items-center">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <div className="text-sm">
            <p className="text-muted-foreground">当前道具集</p>
            <p className="font-medium text-foreground">{props.itemSetName || "未选择"}</p>
            <p className="text-xs text-muted-foreground">道具条数：{props.itemCount}</p>
          </div>
          <div className="text-sm">
            <p className="text-muted-foreground">当前批次</p>
            <p className="font-medium text-foreground">{currentBatch?.name ?? "未绑定"}</p>
            {currentBatch ? (
              <p className="text-xs text-muted-foreground">
                成功 {currentBatch.successCount}/{currentBatch.totalCount} · 失败 {currentBatch.failedCount}
              </p>
            ) : null}
          </div>
          <div className="text-sm">
            <p className="text-muted-foreground">出图覆盖率</p>
            <p className="font-medium text-foreground">{coverage}%</p>
            <p className="text-xs text-muted-foreground">
              成功 {props.stats.done} · 缺图 {props.stats.missing}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={props.stats.failed > 0 ? "destructive" : "outline"}>失败 {props.stats.failed}</Badge>
            <Badge variant={props.stats.missing > 0 ? "secondary" : "outline"}>缺图 {props.stats.missing}</Badge>
            <Badge variant="outline">总资源 {props.stats.total}</Badge>
          </div>
        </div>
        <div className="min-w-[220px] space-y-1">
          <p className="text-xs text-muted-foreground">切换工作批次</p>
          <Select
            value={props.currentBatchId || "none"}
            onValueChange={(v) => props.onBatchChange(v === "none" ? "" : (v ?? ""))}
          >
            <SelectTrigger>
              <SelectValue placeholder="选择批次" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">未绑定批次</SelectItem>
              {props.batches.map((batch) => (
                <SelectItem key={batch.id} value={batch.id}>
                  {batch.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}
