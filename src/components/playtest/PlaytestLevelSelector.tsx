"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export function PlaytestLevelSelector({
  levels,
  selectedIds,
  onToggle,
  onQuick,
  onClear,
}: {
  levels: Array<{ id: string; name: string; levelIndex?: number | null }>;
  selectedIds: string[];
  onToggle: (id: string) => void;
  onQuick: (count: number) => void;
  onClear: () => void;
}) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return levels;
    return levels.filter((l) => `${l.levelIndex ?? ""} ${l.name}`.toLowerCase().includes(q));
  }, [levels, search]);

  return (
    <Card className="border border-gray-200">
      <CardHeader>
        <CardTitle className="text-sm">关卡选择</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="搜索关卡名或序号" />
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => onQuick(5)}>
            最近 5 关
          </Button>
          <Button variant="outline" size="sm" onClick={() => onQuick(10)}>
            最近 10 关
          </Button>
          <Button variant="outline" size="sm" onClick={onClear}>
            清空
          </Button>
        </div>
        <p className="text-xs text-gray-500">
          已选择 {selectedIds.length} / {levels.length} 关
          {search ? `（筛选显示 ${filtered.length} 关）` : ""}
        </p>
        <div className="max-h-52 overflow-auto rounded border border-gray-200 p-2 text-xs">
          {filtered.map((l) => (
            <button
              key={l.id}
              type="button"
              onClick={() => onToggle(l.id)}
              className={`mb-1 block w-full rounded px-2 py-1 text-left ${
                selectedIds.includes(l.id) ? "bg-blue-50 text-blue-900" : "bg-gray-50 hover:bg-gray-100"
              }`}
            >
              L{l.levelIndex ?? "-"} · {l.name}
            </button>
          ))}
          {filtered.length === 0 ? <p className="text-center text-gray-500">无匹配关卡</p> : null}
        </div>
      </CardContent>
    </Card>
  );
}
