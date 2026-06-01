"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DifficultyDiagnosisResult } from "@/types/difficulty";

export function DifficultyScoreCards({ diagnosis }: { diagnosis?: DifficultyDiagnosisResult | null }) {
  if (!diagnosis) return <div className="text-sm text-muted-foreground">暂无诊断结果</div>;
  return (
    <div className="grid gap-3 md:grid-cols-5">
      <Card><CardHeader><CardTitle>P</CardTitle></CardHeader><CardContent>{diagnosis.score.P.toFixed(3)} <Badge>{diagnosis.score.label}</Badge></CardContent></Card>
      <Card><CardHeader><CardTitle>M</CardTitle></CardHeader><CardContent>{diagnosis.score.normalizedM.toFixed(3)}</CardContent></Card>
      <Card><CardHeader><CardTitle>D</CardTitle></CardHeader><CardContent>{diagnosis.score.D.toFixed(3)}</CardContent></Card>
      <Card><CardHeader><CardTitle>T</CardTitle></CardHeader><CardContent>{diagnosis.score.T.toFixed(3)}</CardContent></Card>
      <Card><CardHeader><CardTitle>Confidence</CardTitle></CardHeader><CardContent>{diagnosis.score.confidence.toFixed(2)}</CardContent></Card>
    </div>
  );
}
