"use client";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getItemBaseName } from "@/lib/items/itemName";
import type { GenerateItemsResult } from "@/types/ai";

type Props = {
  items: GenerateItemsResult["items"];
};

export function GeneratedItemNamesPreviewTable({ items }: Props) {
  const groups = Array.from(
    items.reduce((map, item) => {
      const base = getItemBaseName(item);
      const current = map.get(base) ?? { name: base, variants: 0 };
      current.variants += 1;
      map.set(base, current);
      return map;
    }, new Map<string, { name: string; variants: number }>()),
  ).map(([, value]) => value);

  groups.sort((a, b) => a.name.localeCompare(b.name, "zh-CN"));

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        共 {groups.length} 个物品名（按同类颜色变体归并）
      </p>
      <div className="w-full overflow-x-auto rounded-md border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-20">序号</TableHead>
              <TableHead>物品名</TableHead>
              <TableHead className="w-32">颜色变体数</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {groups.map((group, index) => (
              <TableRow key={group.name}>
                <TableCell className="tabular-nums text-muted-foreground">{index + 1}</TableCell>
                <TableCell className="font-medium">{group.name}</TableCell>
                <TableCell>{group.variants}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {groups.length === 0 ? (
        <div className="text-center text-sm text-muted-foreground">暂无物品名</div>
      ) : null}
      <div className="flex justify-end">
        <Button variant="outline" size="sm" disabled>
          仅预览（按同类归并）
        </Button>
      </div>
    </div>
  );
}
