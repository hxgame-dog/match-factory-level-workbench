"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type ItemSet = { id: string; name: string; theme: string; itemCount: number };
type Batch = { id: string; name: string; itemSetId: string; successCount: number; totalCount: number };

type Props = {
  itemSets: ItemSet[];
  batches: Batch[];
  selectedItemSetId: string;
  selectedBatchId: string;
  onChange: (next: { itemSetId?: string; batchId?: string }) => void;
  onLoad: () => void;
};

export function LevelSourceSelector(props: Props) {
  const activeSet = props.itemSets.find((set) => set.id === props.selectedItemSetId);
  const activeBatch = props.batches.find((batch) => batch.id === props.selectedBatchId);
  return (
    <Card className="border border-gray-200 shadow-sm">
      <CardHeader><CardTitle className="text-lg">Source 选择区</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        <Select value={props.selectedItemSetId || "none"} onValueChange={(v) => props.onChange({ itemSetId: v === "none" ? "" : v ?? "" })}>
          <SelectTrigger><SelectValue placeholder="选择 GeneratedItemSet" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="none">请选择 ItemSet</SelectItem>
            {props.itemSets.map((set) => <SelectItem key={set.id} value={set.id}>{set.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={props.selectedBatchId || "none"} onValueChange={(v) => props.onChange({ batchId: v === "none" ? "" : v ?? "" })}>
          <SelectTrigger><SelectValue placeholder="选择 AssetBatch（可选）" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="none">不选择资源批次</SelectItem>
            {props.batches
              .filter((batch) => !props.selectedItemSetId || batch.itemSetId === props.selectedItemSetId)
              .map((batch) => <SelectItem key={batch.id} value={batch.id}>{batch.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button onClick={props.onLoad}>Load Sources</Button>
        {activeSet ? (
          <div className="rounded-md border border-gray-200 p-3 text-sm text-gray-700">
            <p>Item Set: {activeSet.name}</p>
            <p>主题: {activeSet.theme}</p>
            <p>道具数: {activeSet.itemCount}</p>
            <p>资源成功数: {activeBatch?.successCount ?? 0}</p>
            <p>资源缺失数: {Math.max(0, (activeSet.itemCount ?? 0) - (activeBatch?.successCount ?? 0))}</p>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
