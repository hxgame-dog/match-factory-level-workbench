"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function SourceLevelSelector({
  levels,
  selectedIds,
  onToggle,
  onQuickPick,
}: {
  levels: Array<{ id: string; name: string; levelIndex: number }>;
  selectedIds: string[];
  onToggle: (id: string) => void;
  onQuickPick: (count: number) => void;
}) {
  const sorted = [...levels].sort((a, b) => b.levelIndex - a.levelIndex);
  const picked = levels.filter((l) => selectedIds.includes(l.id));
  return (
    <Card className="border border-gray-200">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Source Levels 选择区</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => onQuickPick(5)}>最近 5 关</Button>
          <Button variant="outline" onClick={() => onQuickPick(10)}>最近 10 关</Button>
          <Button variant="outline" onClick={() => onQuickPick(20)}>最近 20 关</Button>
        </div>
        <p className="text-xs text-gray-500">
          已选 {picked.length} 关，范围：
          {picked.length ? `${Math.min(...picked.map((x) => x.levelIndex))} ~ ${Math.max(...picked.map((x) => x.levelIndex))}` : "-"}
        </p>
        <div className="max-h-56 space-y-1 overflow-auto rounded-md border border-gray-200 p-2">
          {sorted.map((level) => (
            <button
              key={level.id}
              onClick={() => onToggle(level.id)}
              className={`block w-full rounded-sm border px-2 py-1 text-left text-xs ${
                selectedIds.includes(level.id) ? "border-blue-300 bg-blue-50" : "border-gray-200 bg-white"
              }`}
              type="button"
            >
              L{level.levelIndex} · {level.name}
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
