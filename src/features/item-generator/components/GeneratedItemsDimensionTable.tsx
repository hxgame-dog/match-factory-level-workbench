"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
import { getPaletteColorEnglish } from "@/lib/items/colorPalette";
import { getItemBaseName } from "@/lib/items/itemName";
import { zh } from "@/lib/i18n/zh";
import type { GenerateItemsResult } from "@/types/ai";

import { useGeneratedItemsFilter } from "../hooks/useGeneratedItemsFilter";

const moveSpeedLabels = zh.pages.itemGenerator.moveSpeedLabels;

const DIMENSION_HINTS = [
  { field: "一级分类", desc: "道具所属大类，用于关卡分组与筛选" },
  { field: "二级分类", desc: "更细的物种或子类" },
  { field: "主色", desc: "标准色板展开后的关卡主识别色" },
  { field: "辅色", desc: "物体自身点缀色（非色板主色）" },
  { field: "形态", desc: "物体轮廓形状，如 oval、round" },
  { field: "尺寸", desc: "相对大小档位，如 small / medium / large" },
  { field: "花纹", desc: "外观纹理（纯色、纵纹、斑点等），影响出图与辨识" },
  { field: "移动速度", desc: "1–5 档：很慢 → 很快" },
  { field: "目标缩放", desc: "关卡内显示比例系数" },
] as const;

type Props = {
  items: GenerateItemsResult["items"];
};

export function GeneratedItemsDimensionTable({ items }: Props) {
  const t = zh.pages.itemGenerator;
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

  const dimensionSummary = [
    { label: "物品名", values: [...new Set(items.map((item) => getItemBaseName(item)))] },
    { label: "一级分类", values: [...new Set(items.map((item) => item.category1).filter(Boolean))] },
    { label: "二级分类", values: [...new Set(items.map((item) => item.category2 ?? "").filter(Boolean))] },
    { label: "主色", values: [...new Set(items.map((item) => item.color1 ?? "").filter(Boolean))] },
    { label: "辅色", values: [...new Set(items.map((item) => item.color2 ?? "").filter(Boolean))] },
    { label: "形态", values: [...new Set(items.map((item) => item.shape ?? "").filter(Boolean))] },
    { label: "尺寸", values: [...new Set(items.map((item) => item.size ?? "").filter(Boolean))] },
    { label: "花纹", values: [...new Set(items.map((item) => item.pattern ?? "纯色").filter(Boolean))] },
    { label: "移动速度", values: [...new Set(items.map((item) => String(item.moveSpeed ?? 3)))] },
    {
      label: "目标缩放",
      values: [...new Set(items.map((item) => (item.targetScale == null ? "" : String(item.targetScale))).filter(Boolean))],
    },
  ] as const;

  return (
    <div className="w-full min-w-0 space-y-3">
      <Alert>
        <AlertTitle>{t.dimensionHintTitle}</AlertTitle>
        <AlertDescription>
          <ul className="mt-2 grid gap-1 sm:grid-cols-2">
            {DIMENSION_HINTS.map((h) => (
              <li key={h.field} className="text-xs">
                <span className="font-medium text-foreground">{h.field}</span>
                <span className="text-muted-foreground"> — {h.desc}</span>
              </li>
            ))}
          </ul>
        </AlertDescription>
      </Alert>

      <Alert>
        <AlertTitle>维度预览方案</AlertTitle>
        <AlertDescription>
          <ul className="mt-2 grid gap-1 sm:grid-cols-2">
            {dimensionSummary.map((row) => (
              <li key={row.label} className="text-xs">
                <span className="font-medium text-foreground">{row.label}：</span>
                <span className="text-muted-foreground">{row.values.length ? row.values.join(" ") : "—"}</span>
              </li>
            ))}
          </ul>
        </AlertDescription>
      </Alert>

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
              <TableHead>一级分类</TableHead>
              <TableHead>二级分类</TableHead>
              <TableHead>主色</TableHead>
              <TableHead>辅色</TableHead>
              <TableHead>形态</TableHead>
              <TableHead>尺寸</TableHead>
              <TableHead>花纹</TableHead>
              <TableHead className="min-w-[100px]">移动速度</TableHead>
              <TableHead>目标缩放</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageSlice.map(({ item, index }) => {
              const speed = item.moveSpeed ?? 3;
              return (
                <TableRow key={`${item.name}-${index}`}>
                  <TableCell className="tabular-nums text-muted-foreground">{item.itemId ?? index + 1}</TableCell>
                  <TableCell>{item.category1}</TableCell>
                  <TableCell>{item.category2 ?? "—"}</TableCell>
                  <TableCell>
                    {item.color1 ? (
                      <Badge variant="outline">{getPaletteColorEnglish(item.color1)}</Badge>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell>{item.color2 ?? "—"}</TableCell>
                  <TableCell>{item.shape ?? "—"}</TableCell>
                  <TableCell>{item.size ?? "—"}</TableCell>
                  <TableCell>{item.pattern ?? "纯色"}</TableCell>
                  <TableCell>
                    {speed} · {moveSpeedLabels[speed as 1 | 2 | 3 | 4 | 5]}
                  </TableCell>
                  <TableCell>{item.targetScale ?? "—"}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {filteredWithIndex.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground">当前筛选条件下无匹配道具</p>
      ) : (
        <div className="flex flex-col gap-2 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span>
            第 {safePage} / {totalPages} 页，本页 {pageSlice.length} 条，共 {filteredWithIndex.length} 条（每页 {pageSize}{" "}
            条）
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={safePage <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
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
