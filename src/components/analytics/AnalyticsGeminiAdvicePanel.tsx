"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { GeminiAnalyticsAdviceResult } from "@/types/analytics";

export function AnalyticsGeminiAdvicePanel({
  advice,
  onAsk,
}: {
  advice: GeminiAnalyticsAdviceResult | null;
  onAsk: () => void;
}) {
  return (
    <Card className="border border-gray-200">
      <CardHeader><CardTitle className="text-sm">Gemini Analytics Advice</CardTitle></CardHeader>
      <CardContent className="space-y-2 text-xs">
        <Button variant="outline" onClick={onAsk}>Ask Gemini for Analytics Advice</Button>
        {advice ? (
          <div className="space-y-2 rounded border border-gray-200 p-2">
            <p className="font-medium">{advice.summary}</p>
            <div>
              <p className="font-medium">Key Findings</p>
              <ul className="list-disc pl-4">{advice.keyFindings.map((k) => <li key={k}>{k}</li>)}</ul>
            </div>
            <div>
              <p className="font-medium">Root Cause</p>
              <ul className="list-disc pl-4">
                {advice.rootCauseHypotheses.map((h, i) => <li key={i}>[{h.confidence}] {h.title} — {h.detail}</li>)}
              </ul>
            </div>
            <div>
              <p className="font-medium">Optimization Suggestions</p>
              <ul className="list-disc pl-4">
                {advice.optimizationSuggestions.map((s, i) => <li key={i}>[{s.priority}] {s.action} — {s.detail}</li>)}
              </ul>
            </div>
            <p className="text-gray-500">Formula 校准: {advice.formulaCalibrationNotes}</p>
            <p className="text-gray-500">Playtest 校准: {advice.playtestCalibrationNotes}</p>
          </div>
        ) : (
          <p className="text-gray-500">暂无建议</p>
        )}
      </CardContent>
    </Card>
  );
}
