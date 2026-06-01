"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { GeminiPlaytestAdviceResult } from "@/types/playtest";

export function PlaytestGeminiAdvicePanel({
  advice,
  mockMode,
  onAsk,
}: {
  advice: GeminiPlaytestAdviceResult | null;
  mockMode?: boolean;
  onAsk: () => void;
}) {
  return (
    <Card className="border border-border">
      <CardHeader>
        <CardTitle className="text-sm">Gemini 试玩建议</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={onAsk}>
            获取 AI 平衡建议
          </Button>
          {mockMode ? <Badge variant="outline">Mock 模式</Badge> : null}
        </div>
        {advice ? (
          <div className="space-y-1 rounded border border-border p-2">
            <p className="font-medium">{advice.summary}</p>
            <p>风险等级：{advice.riskLevel}</p>
            <ul className="list-disc pl-4 text-muted-foreground">
              {(advice.keyFindings ?? []).map((k) => (
                <li key={k}>{k}</li>
              ))}
            </ul>
            {advice.designerNotes ? <p className="text-blue-700">{advice.designerNotes}</p> : null}
          </div>
        ) : (
          <p className="text-muted-foreground">完成单关模拟后可请求建议</p>
        )}
      </CardContent>
    </Card>
  );
}
