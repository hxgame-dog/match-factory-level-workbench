"use client";

import { useMemo } from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getItemBaseName } from "@/lib/items/itemName";

type Asset = {
  id?: string;
  name: string;
  displayName?: string;
  color1?: string;
  status?: string;
  imageUrl?: string;
  isMaster?: boolean;
  baseItemName?: string;
};

type Props = {
  assets: Asset[];
};

export function GroupedAssetPreview({ assets }: Props) {
  const groups = useMemo(() => {
    const map = new Map<string, Asset[]>();
    for (const asset of assets) {
      const base = asset.baseItemName || getItemBaseName(asset as never);
      const list = map.get(base) ?? [];
      list.push(asset);
      map.set(base, list);
    }
    return Array.from(map.entries()).map(([baseItemName, rows]) => ({
      baseItemName,
      rows,
      master: rows.find((r) => r.isMaster),
    }));
  }, [assets]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">按物品名折叠预览</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {groups.length === 0 ? (
          <p className="text-sm text-muted-foreground">暂无可预览资源</p>
        ) : (
          groups.map((g) => (
            <details key={g.baseItemName} className="rounded-md border border-border p-3">
              <summary className="flex cursor-pointer list-none items-center justify-between">
                <span className="font-medium">{g.baseItemName}</span>
                <Badge variant="outline">{g.rows.length} 张</Badge>
              </summary>
              <div className="mt-3 space-y-2">
                <p className="text-xs text-muted-foreground">
                  母版：{g.master?.displayName ?? g.master?.name ?? "未标记"} / 变体：{g.rows.filter((r) => !r.isMaster).length}
                </p>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {g.rows.map((row) => (
                    <div key={row.id ?? row.name} className="rounded-sm border border-border p-2 text-xs">
                      <p className="truncate font-medium">{row.displayName ?? row.name}</p>
                      <p className="text-muted-foreground">{row.color1 || "-"}</p>
                      {row.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={row.imageUrl} alt={row.displayName ?? row.name} className="mt-1 h-20 w-full rounded-sm object-cover" />
                      ) : (
                        <div className="mt-1 h-20 rounded-sm border border-dashed border-border" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </details>
          ))
        )}
      </CardContent>
    </Card>
  );
}

