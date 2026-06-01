"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { GeminiDifficultyAdviceResult } from "@/types/difficulty";

export function GeminiAdvicePanel({
  advice,
  mockMode,
  onAsk,
}: {
  advice?: GeminiDifficultyAdviceResult | null;
  mockMode: boolean;
  onAsk: () => void;
}) {
  return (
    <div className="space-y-3 rounded-md border border-border p-3">
      <div className="flex items-center gap-2">
        <Button onClick={onAsk}>Ask Gemini for Diagnosis Advice</Button>
        {mockMode ? <Badge>Mock Mode</Badge> : null}
      </div>
      {advice ? (
        <div className="space-y-2 text-sm">
          <p className="font-medium">{advice.summary}</p>
          <p className="text-amber-700">{advice.risks.join("；")}</p>
          {advice.suggestions.map((s, i) => (
            <Alert key={`${s.title}-${i}`}>
              <AlertTitle>{s.priority.toUpperCase()} - {s.title}</AlertTitle>
              <AlertDescription>{s.detail}（预期效果：{s.expectedEffect}）</AlertDescription>
            </Alert>
          ))}
          <p className="text-blue-700">{advice.balancingAdvice}</p>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">暂无 Gemini 建议</p>
      )}
    </div>
  );
}
