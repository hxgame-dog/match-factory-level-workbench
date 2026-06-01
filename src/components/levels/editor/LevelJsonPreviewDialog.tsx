"use client";

import { Button } from "@/components/ui/button";

export function LevelJsonPreviewDialog({
  open,
  level,
  onClose,
}: {
  open: boolean;
  level: unknown;
  onClose: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <div className="h-[80vh] w-full max-w-4xl rounded-md border border-border bg-card p-4">
        <h3 className="mb-2 font-semibold">Preview JSON</h3>
        <pre className="h-[calc(100%-60px)] overflow-auto rounded-md bg-muted p-3 text-xs">
          {JSON.stringify(level, null, 2)}
        </pre>
        <div className="mt-2">
          <Button variant="outline" onClick={onClose}>关闭</Button>
        </div>
      </div>
    </div>
  );
}
