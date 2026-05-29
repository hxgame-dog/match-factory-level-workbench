"use client";

import { useState } from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

type ImportResult = {
  importedCount: number;
  failedCount: number;
  errors: Array<{ row: number; message: string }>;
};

type ItemUploadProps = {
  onImported: () => void;
};

export function ItemUpload({ onImported }: ItemUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [overwrite, setOverwrite] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);

  async function onImport() {
    if (!file) {
      setError("请先选择 CSV 文件");
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("overwrite", String(overwrite));
      const response = await fetch("/api/items/import", {
        method: "POST",
        body: formData,
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) {
        throw new Error(payload.error ?? "导入失败");
      }
      setResult(payload);
      onImported();
    } catch (e) {
      setError(e instanceof Error ? e.message : "导入失败");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="border border-gray-200 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg">CSV 导入</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Input
          type="file"
          accept=".csv,text/csv"
          onChange={(event) => setFile(event.target.files?.[0] ?? null)}
        />
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Switch checked={overwrite} onCheckedChange={setOverwrite} />
          <span>覆盖旧数据</span>
        </div>
        <Button onClick={onImport} disabled={loading}>
          {loading ? "导入中..." : "上传并导入"}
        </Button>

        {error ? (
          <Alert variant="destructive">
            <AlertTitle>导入失败</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}
        {result ? (
          <Alert>
            <AlertTitle>导入完成</AlertTitle>
            <AlertDescription>
              成功 {result.importedCount} 条，失败 {result.failedCount} 条
              {result.errors.length > 0
                ? `；错误行：${result.errors
                    .slice(0, 5)
                    .map((x) => `${x.row}`)
                    .join(", ")}`
                : ""}
            </AlertDescription>
          </Alert>
        ) : null}
      </CardContent>
    </Card>
  );
}
