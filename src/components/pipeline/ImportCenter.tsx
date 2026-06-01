"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

export function ImportCenter({
  content,
  onContentChange,
  onDryRun,
  onConfirm,
}: {
  content: string;
  onContentChange: (v: string) => void;
  onDryRun: () => void;
  onConfirm: () => void;
}) {
  return (
    <Card className="border border-border">
      <CardHeader><CardTitle className="text-sm">Import Center（Level JSON）</CardTitle></CardHeader>
      <CardContent className="space-y-2">
        <Textarea value={content} onChange={(e) => onContentChange(e.target.value)} rows={8} />
        <div className="flex gap-2">
          <Button variant="outline" onClick={onDryRun}>Dry Run Import</Button>
          <Button onClick={onConfirm}>Confirm Import</Button>
        </div>
      </CardContent>
    </Card>
  );
}
