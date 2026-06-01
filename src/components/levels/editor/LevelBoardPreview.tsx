"use client";

import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { LevelConfig } from "@/types/level";

import { LevelBoardCell } from "./LevelBoardCell";

type Preview = {
  cells: Array<{
    x: number;
    y: number;
    layer: number;
    item?: LevelConfig["spawns"][number];
    asset?: { imageUrl?: string; localPath?: string };
  }>;
  stats: { capacity: number; used: number; overflow: number; empty: number };
  warnings: string[];
};

type Props = {
  preview?: Preview;
  level?: LevelConfig | null;
  onRefresh: (filter: { role?: "target" | "distractor" | "filler" | "special"; layer?: number }) => void;
};

export function LevelBoardPreview({ preview, level, onRefresh }: Props) {
  const [roleFilter, setRoleFilter] = useState("all");
  const [layerFilter, setLayerFilter] = useState("all");
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const selectedCell = selectedIndex == null ? undefined : preview?.cells[selectedIndex];

  const rows = useMemo(() => {
    if (!preview || !level) return [];
    const cols = level.board.width;
    return Array.from({ length: Math.ceil(preview.cells.length / cols) }).map((_, r) =>
      preview.cells.slice(r * cols, (r + 1) * cols),
    );
  }, [preview, level]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">2D 关卡预览区</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-2">
          <Select value={roleFilter} onValueChange={(v) => setRoleFilter(v ?? "all")}>
            <SelectTrigger className="w-44"><SelectValue placeholder="Role Filter" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Items</SelectItem>
              <SelectItem value="target">Targets Only</SelectItem>
              <SelectItem value="distractor">Distractors Only</SelectItem>
            </SelectContent>
          </Select>
          <Select value={layerFilter} onValueChange={(v) => setLayerFilter(v ?? "all")}>
            <SelectTrigger className="w-36"><SelectValue placeholder="Layer" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Layers</SelectItem>
              <SelectItem value="1">Layer 1</SelectItem>
              <SelectItem value="2">Layer 2</SelectItem>
              <SelectItem value="3">Layer 3</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            onClick={() =>
              onRefresh({
                role:
                  roleFilter === "all"
                    ? undefined
                    : (roleFilter as "target" | "distractor" | "filler" | "special"),
                layer: layerFilter === "all" ? undefined : Number(layerFilter),
              })
            }
          >
            刷新预览
          </Button>
        </div>

        {!preview || !level ? (
          <div className="rounded-md border border-dashed border-border p-8 text-sm text-muted-foreground">暂无预览数据</div>
        ) : (
          <>
            <div className="space-y-1 text-sm text-foreground">
              <p>容量 {preview.stats.capacity} / 已使用 {preview.stats.used} / 溢出 {preview.stats.overflow} / 空格 {preview.stats.empty}</p>
              {preview.warnings.length > 0 ? <p className="text-amber-700">{preview.warnings.join("；")}</p> : null}
            </div>
            <div className="space-y-1 overflow-auto">
              {rows.map((row, y) => (
                <div key={y} className="grid gap-1" style={{ gridTemplateColumns: `repeat(${level.board.width}, minmax(0, 1fr))` }}>
                  {row.map((cell, idx) => {
                    const absoluteIndex = y * level.board.width + idx;
                    return (
                      <LevelBoardCell
                        key={`${cell.layer}-${cell.x}-${cell.y}`}
                        item={cell.item}
                        asset={cell.asset}
                        selected={absoluteIndex === selectedIndex}
                        onClick={() => setSelectedIndex(absoluteIndex)}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
            {selectedCell?.item ? (
              <div className="rounded-md border border-border p-3 text-xs text-foreground">
                <p>Name: {selectedCell.item.name}</p>
                <p>Role: {selectedCell.item.role}</p>
                <p>Category: {selectedCell.item.category1}</p>
                <p>Color: {selectedCell.item.color1 ?? "-"}</p>
                <p>Size: {selectedCell.item.size ?? "-"}</p>
                <p>Count: {selectedCell.item.count}</p>
              </div>
            ) : null}
          </>
        )}
      </CardContent>
    </Card>
  );
}
