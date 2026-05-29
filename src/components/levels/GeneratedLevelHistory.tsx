"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Row = {
  id: string;
  name: string;
  levelIndex: number | null;
  theme: string | null;
  targetDifficulty: string | null;
  createdAt: string;
};

type Props = {
  rows: Row[];
  onOpen: (id: string) => void;
  onDelete: (id: string) => void;
  onExport: (id: string) => void;
};

export function GeneratedLevelHistory(props: Props) {
  return (
    <Card className="border border-gray-200 shadow-sm">
      <CardHeader><CardTitle className="text-lg">历史关卡区</CardTitle></CardHeader>
      <CardContent className="space-y-2">
        {props.rows.map((row) => (
          <div key={row.id} className="rounded-md border border-gray-200 p-3 text-sm">
            <p className="font-medium">{row.name}</p>
            <p>Index: {row.levelIndex ?? "-"} / Theme: {row.theme ?? "-"} / Difficulty: {row.targetDifficulty ?? "-"}</p>
            <p>{new Date(row.createdAt).toLocaleString()}</p>
            <div className="mt-2 flex gap-2">
              <Button size="sm" variant="outline" onClick={() => props.onOpen(row.id)}>打开</Button>
              <Button size="sm" variant="outline" onClick={() => props.onDelete(row.id)}>删除</Button>
              <Button size="sm" variant="outline" onClick={() => props.onExport(row.id)}>Export JSON</Button>
            </div>
          </div>
        ))}
        {props.rows.length === 0 ? <p className="text-sm text-gray-500">暂无历史关卡</p> : null}
      </CardContent>
    </Card>
  );
}
