"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export function AnalyticsImportCenter({
  batchName,
  source,
  content,
  fileType,
  onBatchNameChange,
  onSourceChange,
  onContentChange,
  onFileTypeChange,
  onDryRun,
  onConfirm,
}: {
  batchName: string;
  source: string;
  content: string;
  fileType: "csv" | "json" | "excel";
  onBatchNameChange: (v: string) => void;
  onSourceChange: (v: string) => void;
  onContentChange: (v: string) => void;
  onFileTypeChange: (v: "csv" | "json" | "excel") => void;
  onDryRun: () => void;
  onConfirm: () => void;
}) {
  return (
    <Card className="border border-gray-200">
      <CardHeader><CardTitle className="text-sm">Analytics Import Center</CardTitle></CardHeader>
      <CardContent className="space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <Input value={batchName} onChange={(e) => onBatchNameChange(e.target.value)} placeholder="Batch Name" />
          <select value={source} onChange={(e) => onSourceChange(e.target.value)} className="h-9 rounded-md border border-gray-200 px-2 text-sm">
            <option value="custom_csv">custom_csv</option>
            <option value="firebase_export">firebase_export</option>
            <option value="bigquery_export">bigquery_export</option>
            <option value="manual">manual</option>
            <option value="mock">mock</option>
          </select>
        </div>
        <select value={fileType} onChange={(e) => onFileTypeChange(e.target.value as "csv" | "json" | "excel")} className="h-9 w-full rounded-md border border-gray-200 px-2 text-sm">
          <option value="csv">CSV / Excel(粘贴 CSV 文本)</option>
          <option value="json">JSON</option>
        </select>
        <Textarea value={content} onChange={(e) => onContentChange(e.target.value)} rows={6} placeholder="粘贴 CSV 或 JSON 内容" />
        <div className="flex gap-2">
          <Button variant="outline" onClick={onDryRun}>Dry Run Validate</Button>
          <Button onClick={onConfirm}>Confirm Import</Button>
        </div>
      </CardContent>
    </Card>
  );
}
