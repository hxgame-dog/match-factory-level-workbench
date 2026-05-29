"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export function GenerationConstraintsPanel({
  noveltyRate,
  onNoveltyRateChange,
}: {
  noveltyRate: number;
  onNoveltyRateChange: (v: number) => void;
}) {
  return (
    <Card className="border border-gray-200">
      <CardHeader className="pb-2"><CardTitle className="text-sm">约束配置区</CardTitle></CardHeader>
      <CardContent className="space-y-2">
        <p className="text-xs text-gray-500">第一版默认同主题、复用现有资源，不新增未知道具。</p>
        <Input type="number" value={noveltyRate} onChange={(e) => onNoveltyRateChange(Number(e.target.value) || 0)} placeholder="Novelty Rate" />
      </CardContent>
    </Card>
  );
}
