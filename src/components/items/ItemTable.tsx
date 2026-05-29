"use client";

import { useMemo } from "react";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ItemCatalogRow } from "@/types/item";

type ItemTableProps = {
  rows: ItemCatalogRow[];
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
};

export function ItemTable({
  rows,
  page,
  pageSize,
  total,
  onPageChange,
}: ItemTableProps) {
  const columns = useMemo<ColumnDef<ItemCatalogRow>[]>(
    () => [
      { accessorKey: "itemId", header: "ItemId" },
      { accessorKey: "name", header: "Name" },
      { accessorKey: "category1", header: "Category1" },
      { accessorKey: "category2", header: "Category2" },
      { accessorKey: "color1", header: "Color1" },
      { accessorKey: "color2", header: "Color2" },
      { accessorKey: "shape", header: "Shape" },
      { accessorKey: "size", header: "Size" },
      { accessorKey: "targetScale", header: "Target Scale" },
    ],
    [],
  );
  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-3">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((group) => (
            <TableRow key={group.id}>
              {group.headers.map((header) => (
                <TableHead key={header.id}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <TableRow key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext()) ?? "-"}
                </TableCell>
              ))}
            </TableRow>
          ))}
          {rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={9} className="text-center text-gray-500">
                暂无数据
              </TableCell>
            </TableRow>
          ) : null}
        </TableBody>
      </Table>

      <div className="flex items-center justify-between text-sm text-gray-500">
        <span>
          第 {page} / {totalPages} 页，共 {total} 条
        </span>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
          >
            上一页
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
          >
            下一页
          </Button>
        </div>
      </div>
    </div>
  );
}
