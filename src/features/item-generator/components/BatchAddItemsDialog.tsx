"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { zh } from "@/lib/i18n/zh";
import type { GenerateItemsResult } from "@/types/ai";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cloneTemplate: GenerateItemsResult["items"][number] | null;
  onConfirm: (options: {
    count: number;
    mode: "blank" | "clone";
    defaults: {
      category1: string;
      shape: string;
      size: string;
      pattern: string;
    };
  }) => void;
};

const patternOptions = zh.pages.itemGenerator.patternOptions;

export function BatchAddItemsDialog({ open, onOpenChange, cloneTemplate, onConfirm }: Props) {
  const [count, setCount] = useState(5);
  const [mode, setMode] = useState<"blank" | "clone">(cloneTemplate ? "clone" : "blank");
  const [category1, setCategory1] = useState("未分类");
  const [shape, setShape] = useState("oval");
  const [size, setSize] = useState("medium");
  const [pattern, setPattern] = useState<string>("纯色");

  if (!open) return null;

  function handleConfirm() {
    const n = Math.min(50, Math.max(1, count));
    onConfirm({
      count: n,
      mode: cloneTemplate && mode === "clone" ? "clone" : "blank",
      defaults: { category1, shape, size, pattern },
    });
    onOpenChange(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <div className="w-full max-w-md rounded-md border border-border bg-card p-4 shadow-sm">
        <h3 className="font-semibold text-foreground">批量添加道具</h3>
        <p className="mt-1 text-sm text-muted-foreground">一次添加多行，将自动分配道具 ID。可在道具表预览中继续编辑。</p>
        <div className="mt-4 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="batch-count">
              添加数量（1–50）
            </label>
            <Input
              id="batch-count"
              type="number"
              min={1}
              max={50}
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
            />
          </div>
          {cloneTemplate ? (
            <div className="space-y-2">
              <span className="text-sm font-medium">模板来源</span>
              <Select value={mode} onValueChange={(v) => setMode((v as "blank" | "clone") ?? "blank")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="blank">空白模板（使用下方默认值）</SelectItem>
                  <SelectItem value="clone">克隆筛选结果第一条</SelectItem>
                </SelectContent>
              </Select>
            </div>
          ) : null}
          {mode === "blank" || !cloneTemplate ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <span className="text-sm font-medium">默认一级分类</span>
                <Input value={category1} onChange={(e) => setCategory1(e.target.value)} />
              </div>
              <div className="space-y-2">
                <span className="text-sm font-medium">默认形态</span>
                <Input value={shape} onChange={(e) => setShape(e.target.value)} />
              </div>
              <div className="space-y-2">
                <span className="text-sm font-medium">默认尺寸</span>
                <Input value={size} onChange={(e) => setSize(e.target.value)} />
              </div>
              <div className="space-y-2">
                <span className="text-sm font-medium">默认花纹</span>
                <Select value={pattern} onValueChange={(v) => setPattern(v ?? "纯色")}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {patternOptions.map((p) => (
                      <SelectItem key={p} value={p}>
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          ) : null}
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handleConfirm}>确认添加</Button>
        </div>
      </div>
    </div>
  );
}
