"use client";

import { useEffect, useState } from "react";
import * as XLSX from "xlsx";

import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const PREVIEW_ROW_LIMIT = 50;

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  blob: Blob | null;
  fileName: string;
};

export function GeneratedItemsExcelPreviewDialog({ open, onOpenChange, blob, fileName }: Props) {
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [activeSheet, setActiveSheet] = useState("");
  const [rows, setRows] = useState<string[][]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !blob) {
      setSheetNames([]);
      setActiveSheet("");
      setRows([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    void blob.arrayBuffer().then((buf) => {
      if (cancelled) return;
      const wb = XLSX.read(buf, { type: "array" });
      const names = wb.SheetNames;
      setSheetNames(names);
      const first = names[0] ?? "";
      setActiveSheet(first);
      if (first) {
        const sheet = wb.Sheets[first];
        const data = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1, defval: "" }) as string[][];
        setRows(data.slice(0, PREVIEW_ROW_LIMIT + 1));
      }
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [open, blob]);

  useEffect(() => {
    if (!open || !blob || !activeSheet) return;
    let cancelled = false;
    void blob.arrayBuffer().then((buf) => {
      if (cancelled) return;
      const wb = XLSX.read(buf, { type: "array" });
      const sheet = wb.Sheets[activeSheet];
      if (!sheet) return;
      const data = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1, defval: "" }) as string[][];
      setRows(data.slice(0, PREVIEW_ROW_LIMIT + 1));
    });
    return () => {
      cancelled = true;
    };
  }, [activeSheet, blob, open]);

  if (!open) return null;

  const header = rows[0] ?? [];
  const body = rows.slice(1);

  function download() {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <div className="flex max-h-[85vh] w-full max-w-4xl flex-col rounded-md border border-border bg-card p-4 shadow-sm">
        <h3 className="font-semibold text-foreground">Excel 预览</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          与导出文件一致，最多预览前 {PREVIEW_ROW_LIMIT} 行数据。
        </p>
        {sheetNames.length > 1 ? (
          <div className="mt-3 max-w-xs">
          <Select value={activeSheet} onValueChange={(v) => setActiveSheet(v ?? "")}>
            <SelectTrigger>
              <SelectValue placeholder="选择工作表" />
            </SelectTrigger>
            <SelectContent>
              {sheetNames.map((name) => (
                <SelectItem key={name} value={name}>
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          </div>
        ) : null}
        <div className="mt-3 min-h-0 flex-1 overflow-auto rounded-md border border-border">
          {loading ? (
            <p className="p-4 text-sm text-muted-foreground">加载中…</p>
          ) : rows.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">无数据</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  {header.map((cell, i) => (
                    <TableHead key={i} className="whitespace-nowrap">
                      {cell}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {body.map((row, ri) => (
                  <TableRow key={ri}>
                    {header.map((_, ci) => (
                      <TableCell key={ci} className="max-w-[200px] truncate text-xs">
                        {row[ci] ?? ""}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            关闭
          </Button>
          <Button onClick={download} disabled={!blob}>
            下载 Excel
          </Button>
        </div>
      </div>
    </div>
  );
}
