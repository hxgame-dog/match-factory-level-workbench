"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { assignSequentialItemIds } from "@/lib/items/assignSequentialItemIds";
import { getPaletteColorEnglish } from "@/lib/items/colorPalette";
import { getItemBaseName } from "@/lib/items/itemName";
import { zh } from "@/lib/i18n/zh";
import { notify } from "@/lib/ui/notify";
import type { GenerateItemsResult } from "@/types/ai";

import { useGeneratedItemsFilter } from "../hooks/useGeneratedItemsFilter";

const MOVE_SPEEDS = [1, 2, 3, 4, 5] as const;
const moveSpeedLabels = zh.pages.itemGenerator.moveSpeedLabels;
const patternOptions = zh.pages.itemGenerator.patternOptions;

type Props = {
  items: GenerateItemsResult["items"];
  onChange: (items: GenerateItemsResult["items"]) => void;
};

export function GeneratedItemsTable({ items, onChange }: Props) {
  const {
    search,
    setSearch,
    categoryFilter,
    setCategoryFilter,
    categories,
    pageSlice,
    safePage,
    totalPages,
    pageSize,
    filteredWithIndex,
    setPage,
  } = useGeneratedItemsFilter(items);

  function patchItem(index: number, patch: Partial<GenerateItemsResult["items"][number]>) {
    const next = [...items];
    next[index] = { ...next[index], ...patch };
    commitItems(next);
  }

  function removeItem(index: number) {
    onChange(assignSequentialItemIds(items.filter((_, i) => i !== index)));
    notify.success("已删除并重编号");
  }

  function commitItems(next: GenerateItemsResult["items"]) {
    onChange(assignSequentialItemIds(next));
  }

  return (
    <div className="w-full min-w-0 space-y-3">
      <div className="grid gap-2 sm:grid-cols-2">
        <Input placeholder="搜索名称 / 显示名" value={search} onChange={(e) => setSearch(e.target.value)} />
        <Select value={categoryFilter} onValueChange={(v) => setCategoryFilter(v ?? "all")}>
          <SelectTrigger>
            <SelectValue placeholder="按分类筛选" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部分类</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="w-full overflow-x-auto rounded-md border border-border">
        <Table className="w-full">
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">道具 ID</TableHead>
              <TableHead className="min-w-[120px]">物品名</TableHead>
              <TableHead className="min-w-[120px]">名称</TableHead>
              <TableHead className="min-w-[120px]">显示名</TableHead>
              <TableHead>一级分类</TableHead>
              <TableHead>二级分类</TableHead>
              <TableHead>主色</TableHead>
              <TableHead className="min-w-[100px]">辅色</TableHead>
              <TableHead>形态</TableHead>
              <TableHead>尺寸</TableHead>
              <TableHead className="min-w-[100px]">花纹</TableHead>
              <TableHead className="min-w-[100px]">移动速度</TableHead>
              <TableHead>目标缩放</TableHead>
              <TableHead>新建</TableHead>
              <TableHead className="min-w-[140px]">选用理由</TableHead>
              <TableHead className="min-w-[180px]">出图 Prompt</TableHead>
              <TableHead>操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageSlice.map(({ item, index }) => (
              <TableRow key={`${item.name}-${index}`}>
                <TableCell className="tabular-nums text-muted-foreground">
                  {item.itemId ?? index + 1}
                </TableCell>
                <TableCell className="font-medium">{getItemBaseName(item)}</TableCell>
                <TableCell>
                  <Input
                    className="min-w-[100px]"
                    value={item.name}
                    onChange={(e) => patchItem(index, { name: e.target.value })}
                  />
                </TableCell>
                <TableCell>
                  <Input
                    className="min-w-[100px]"
                    value={item.displayName ?? ""}
                    onChange={(e) => patchItem(index, { displayName: e.target.value || undefined })}
                  />
                </TableCell>
                <TableCell>{item.category1}</TableCell>
                <TableCell>{item.category2 ?? "—"}</TableCell>
                <TableCell>
                  <Badge variant="outline">{getPaletteColorEnglish(item.color1)}</Badge>
                </TableCell>
                <TableCell>
                  <Input
                    className="min-w-[90px]"
                    value={item.color2 ?? ""}
                    placeholder="物体辅色"
                    onChange={(e) => patchItem(index, { color2: e.target.value || undefined })}
                  />
                </TableCell>
                <TableCell>{item.shape ?? "—"}</TableCell>
                <TableCell>{item.size ?? "—"}</TableCell>
                <TableCell>
                  <Select
                    value={item.pattern ?? "纯色"}
                    onValueChange={(value) => patchItem(index, { pattern: value ?? "纯色" })}
                  >
                    <SelectTrigger className="w-[108px]">
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
                </TableCell>
                <TableCell>
                  <Select
                    value={String(item.moveSpeed ?? 3)}
                    onValueChange={(value) =>
                      patchItem(index, { moveSpeed: Number(value) as (typeof MOVE_SPEEDS)[number] })
                    }
                  >
                    <SelectTrigger className="w-[108px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MOVE_SPEEDS.map((speed) => (
                        <SelectItem key={speed} value={String(speed)}>
                          {speed} · {moveSpeedLabels[speed]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>{item.targetScale ?? "—"}</TableCell>
                <TableCell>
                  <button
                    type="button"
                    className="text-sm"
                    onClick={() => patchItem(index, { isNew: !item.isNew })}
                  >
                    {item.isNew ? <Badge variant="secondary">新建</Badge> : "已有"}
                  </button>
                </TableCell>
                <TableCell>
                  <Input value={item.reason} onChange={(e) => patchItem(index, { reason: e.target.value })} />
                </TableCell>
                <TableCell>
                  <Input
                    value={item.imagePrompt}
                    onChange={(e) => patchItem(index, { imagePrompt: e.target.value })}
                  />
                </TableCell>
                <TableCell>
                  <Button variant="outline" size="sm" onClick={() => removeItem(index)}>
                    删除
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {filteredWithIndex.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground">当前筛选条件下无匹配道具</p>
      ) : (
        <div className="flex flex-col gap-2 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span>
            第 {safePage} / {totalPages} 页，本页 {pageSlice.length} 条，共 {filteredWithIndex.length} 条（每页{" "}
            {pageSize} 条）
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={safePage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              上一页
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={safePage >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              下一页
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
