"use client";

import { useState } from "react";

import { ItemCatalogClient } from "@/components/items/ItemCatalogClient";
import { ItemUpload } from "@/components/items/ItemUpload";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { zh } from "@/lib/i18n/zh";

const t = zh.pages.itemGenerator;

type Props = {
  initialTotal: number;
  initialFilters: {
    category1: string[];
    color1: string[];
    size: string[];
  };
  initialRows: Parameters<typeof ItemCatalogClient>[0]["initialRows"];
};

export function ItemCatalogUploadPanel({ initialTotal, initialFilters, initialRows }: Props) {
  const [catalogTotal, setCatalogTotal] = useState(initialTotal);
  const [clearing, setClearing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  async function clearCatalog() {
    if (catalogTotal === 0) return;
    if (!window.confirm(`确定清空道具库全部 ${catalogTotal} 条记录？此操作不可恢复。`)) return;
    setClearing(true);
    try {
      const response = await fetch("/api/items/clear", { method: "POST" });
      const payload = await response.json();
      if (!payload.success) {
        window.alert(payload.error ?? "清空失败");
        return;
      }
      setCatalogTotal(0);
      setRefreshKey((k) => k + 1);
    } finally {
      setClearing(false);
    }
  }

  return (
    <div className="w-full min-w-0 space-y-4">
      <ItemUpload
        onImported={async () => {
          const response = await fetch("/api/items?page=1&pageSize=1");
          const payload = await response.json();
          if (payload.success) {
            setCatalogTotal(payload.total);
            setRefreshKey((k) => k + 1);
          }
        }}
      />

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 border-b border-border bg-muted/30">
          <div>
            <CardTitle className="text-base">{t.upload.catalogTitle}</CardTitle>
            <CardDescription>{t.upload.catalogDesc}</CardDescription>
          </div>
          <Button variant="destructive" size="sm" disabled={catalogTotal === 0 || clearing} onClick={() => void clearCatalog()}>
            {clearing ? "清空中…" : t.upload.clearAll}
          </Button>
        </CardHeader>
        <CardContent className="pt-4">
          <p className="text-sm text-muted-foreground">
            当前道具库共 <span className="font-medium text-foreground">{catalogTotal}</span> 条（上传数据与 AI 生成相互独立）
          </p>
        </CardContent>
      </Card>

      {catalogTotal > 0 ? (
        <ItemCatalogClient
          key={refreshKey}
          initialRows={initialRows}
          initialTotal={catalogTotal}
          initialFilters={initialFilters}
          showRowDelete={false}
        />
      ) : null}
    </div>
  );
}
