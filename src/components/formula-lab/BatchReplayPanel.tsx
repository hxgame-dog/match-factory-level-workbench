"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function BatchReplayPanel({
  recentCount,
  onRecentCountChange,
  onReplay,
}: {
  recentCount: number;
  onRecentCountChange: (count: number) => void;
  onReplay: () => void;
}) {
  return (
    <div className="space-y-2 rounded-md border border-gray-200 p-3">
      <p className="font-medium">批量回放区</p>
      <div className="flex items-center gap-2">
        <Input type="number" value={recentCount} onChange={(e) => onRecentCountChange(Number(e.target.value) || 10)} className="w-32" />
        <Button onClick={onReplay}>Replay</Button>
      </div>
    </div>
  );
}
