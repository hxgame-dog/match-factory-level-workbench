"use client";

import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  /** 与 assets 同序的索引，用于重试时回写父级列表 */
  assetIndices?: number[];
  onRetryFiltered?: (indices: number[]) => void;
  retrying?: boolean;
};

export function GroupedAssetPreview({ assets, assetIndices, onRetryFiltered, retrying }: Props) {
  const [groupPage, setGroupPage] = useState(1);
  const [assetPage, setAssetPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<"all" | "missing" | "failed">("all");
  const groupsPerPage = 8;
  const assetsPerPage = 12;

  const groups = useMemo(() => {
    const map = new Map<string, Asset[]>();
    for (const asset of assets) {
      const base = asset.baseItemName || getItemBaseName(asset as never);
      const list = map.get(base) ?? [];
      list.push(asset);
      map.set(base, list);
    }
    const merged = Array.from(map.entries()).map(([baseItemName, rows]) => ({
      baseItemName,
      rows,
    }));
    if (statusFilter === "missing") {
      return merged.filter((g) => g.rows.some((r) => !r.imageUrl));
    }
    if (statusFilter === "failed") {
      return merged.filter((g) => g.rows.some((r) => r.status === "failed"));
    }
    return merged;
  }, [assets, statusFilter]);

  const groupTotalPages = Math.max(1, Math.ceil(groups.length / groupsPerPage));
  const pagedGroups = groups.slice((groupPage - 1) * groupsPerPage, groupPage * groupsPerPage);
  const summary = useMemo(() => {
    const total = assets.length;
    const done = assets.filter((a) => a.status === "done").length;
    const failed = assets.filter((a) => a.status === "failed").length;
    const missing = assets.filter((a) => !a.imageUrl).length;
    return { total, done, failed, missing };
  }, [assets]);

  const filteredRetryIndices = useMemo(() => {
    const indices: number[] = [];
    assets.forEach((asset, i) => {
      const parentIndex = assetIndices?.[i] ?? i;
      if (statusFilter === "missing") {
        if (!asset.imageUrl) indices.push(parentIndex);
        return;
      }
      if (statusFilter === "failed") {
        if (asset.status === "failed") indices.push(parentIndex);
        return;
      }
      if (asset.status === "failed" || (!asset.imageUrl && asset.status !== "skipped")) {
        indices.push(parentIndex);
      }
    });
    return indices;
  }, [assets, assetIndices, statusFilter]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">按物品名折叠预览</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Select value={statusFilter} onValueChange={(v) => {
            setStatusFilter((v ?? "all") as "all" | "missing" | "failed");
            setGroupPage(1);
            setAssetPage(1);
          }}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="筛选范围" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部物品组</SelectItem>
              <SelectItem value="missing">仅看缺图</SelectItem>
              <SelectItem value="failed">仅看失败</SelectItem>
            </SelectContent>
          </Select>
          <Badge variant="outline">组分页：{groupPage}/{groupTotalPages}</Badge>
          <Button size="sm" variant="outline" onClick={() => setGroupPage((p) => Math.max(1, p - 1))} disabled={groupPage <= 1}>
            上一页
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setGroupPage((p) => Math.min(groupTotalPages, p + 1))}
            disabled={groupPage >= groupTotalPages}
          >
            下一页
          </Button>
          {onRetryFiltered ? (
            <Button
              size="sm"
              variant="outline"
              disabled={retrying || filteredRetryIndices.length === 0}
              onClick={() => onRetryFiltered(filteredRetryIndices)}
            >
              {retrying ? "重试中…" : `重试当前筛选（${filteredRetryIndices.length}）`}
            </Button>
          ) : null}
        </div>
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          <Badge variant="outline">总图：{summary.total}</Badge>
          <Badge variant="outline">成功：{summary.done}</Badge>
          <Badge variant={summary.failed > 0 ? "destructive" : "outline"}>失败：{summary.failed}</Badge>
          <Badge variant={summary.missing > 0 ? "secondary" : "outline"}>缺图：{summary.missing}</Badge>
        </div>
        {groups.length === 0 ? (
          <p className="text-sm text-muted-foreground">暂无可预览资源</p>
        ) : (
          pagedGroups.map((g) => {
            const assetTotalPages = Math.max(1, Math.ceil(g.rows.length / assetsPerPage));
            const currentAssetPage = Math.min(assetPage, assetTotalPages);
            const rows = g.rows.slice((currentAssetPage - 1) * assetsPerPage, currentAssetPage * assetsPerPage);
            return (
            <details key={g.baseItemName} className="rounded-md border border-border p-3">
              <summary className="flex cursor-pointer list-none items-center justify-between">
                <span className="font-medium">{g.baseItemName}</span>
                <Badge variant="outline">{g.rows.length} 张</Badge>
              </summary>
              <div className="mt-3 space-y-2">
                <p className="text-xs text-muted-foreground">
                  已切图 {g.rows.filter((r) => r.imageUrl).length} / {g.rows.length} 张
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary">图分页：{currentAssetPage}/{assetTotalPages}</Badge>
                  <Button size="sm" variant="outline" onClick={() => setAssetPage((p) => Math.max(1, p - 1))} disabled={currentAssetPage <= 1}>
                    上一页
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setAssetPage((p) => Math.min(assetTotalPages, p + 1))}
                    disabled={currentAssetPage >= assetTotalPages}
                  >
                    下一页
                  </Button>
                </div>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {rows.map((row) => (
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
          );
          })
        )}
      </CardContent>
    </Card>
  );
}

