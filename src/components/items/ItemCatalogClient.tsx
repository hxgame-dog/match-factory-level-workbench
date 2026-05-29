"use client";

import { useState } from "react";

import { ItemFilters } from "@/components/items/ItemFilters";
import { ItemStats } from "@/components/items/ItemStats";
import { ItemTable } from "@/components/items/ItemTable";
import { ItemUpload } from "@/components/items/ItemUpload";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ItemCatalogRow } from "@/types/item";

type ListResponse = {
  success: boolean;
  data: ItemCatalogRow[];
  total: number;
  page: number;
  pageSize: number;
  filters: {
    category1: string[];
    color1: string[];
    size: string[];
  };
};

type ItemCatalogClientProps = {
  initialRows: ItemCatalogRow[];
  initialTotal: number;
  initialFilters: {
    category1: string[];
    color1: string[];
    size: string[];
  };
};

export function ItemCatalogClient({
  initialRows,
  initialTotal,
  initialFilters,
}: ItemCatalogClientProps) {
  const [rows, setRows] = useState<ItemCatalogRow[]>(initialRows);
  const [total, setTotal] = useState(initialTotal);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [search, setSearch] = useState("");
  const [category1, setCategory1] = useState("");
  const [color1, setColor1] = useState("");
  const [size, setSize] = useState("");
  const [options, setOptions] = useState(initialFilters);

  async function loadRows(next?: Partial<Record<"page" | "search" | "category1" | "color1" | "size", string | number>>) {
    const nextPage = typeof next?.page === "number" ? next.page : page;
    const nextSearch = typeof next?.search === "string" ? next.search : search;
    const nextCategory1 = typeof next?.category1 === "string" ? next.category1 : category1;
    const nextColor1 = typeof next?.color1 === "string" ? next.color1 : color1;
    const nextSize = typeof next?.size === "string" ? next.size : size;
    const query = new URLSearchParams({
      page: String(nextPage),
      pageSize: String(pageSize),
      search: nextSearch,
      category1: nextCategory1,
      color1: nextColor1,
      size: nextSize,
    });
    const response = await fetch(`/api/items?${query.toString()}`);
    const payload: ListResponse = await response.json();
    if (!payload.success) return;
    setRows(payload.data);
    setTotal(payload.total);
    setOptions(payload.filters);
  }

  return (
    <div className="space-y-4">
      <ItemStats total={total} />
      <ItemUpload onImported={() => void loadRows({ page: 1 })} />
      <Card className="border border-gray-200 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">道具表预览</CardTitle>
          <a href="/api/items/export">
            <Button variant="outline">Export Excel</Button>
          </a>
        </CardHeader>
        <CardContent className="space-y-4">
          <ItemFilters
            search={search}
            category1={category1}
            color1={color1}
            size={size}
            options={options}
            onChange={(next) => {
              if (next.search !== undefined) setSearch(next.search);
              if (next.category1 !== undefined) setCategory1(next.category1);
              if (next.color1 !== undefined) setColor1(next.color1);
              if (next.size !== undefined) setSize(next.size);
              setPage(1);
              void loadRows({
                page: 1,
                search: next.search ?? search,
                category1: next.category1 ?? category1,
                color1: next.color1 ?? color1,
                size: next.size ?? size,
              });
            }}
          />
          <ItemTable
            rows={rows}
            total={total}
            page={page}
            pageSize={pageSize}
            onPageChange={(nextPage) => {
              setPage(nextPage);
              void loadRows({ page: nextPage });
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
