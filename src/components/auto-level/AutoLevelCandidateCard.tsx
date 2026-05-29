"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AutoGenerateLevelsResult } from "@/types/autoLevel";

type Candidate = AutoGenerateLevelsResult["generated"][number]["candidates"][number];

export function AutoLevelCandidateCard({
  candidate,
  onPreview,
  onSelect,
  onReject,
  onSave,
}: {
  candidate: Candidate;
  onPreview: () => void;
  onSelect: () => void;
  onReject: () => void;
  onSave: () => void;
}) {
  return (
    <Card className="border border-gray-200">
      <CardHeader className="pb-2"><CardTitle className="text-sm">候选 #{candidate.candidateRank}</CardTitle></CardHeader>
      <CardContent className="space-y-2 text-xs">
        <p>Actual P: {candidate.actualP?.toFixed?.(3) ?? "-"}</p>
        <p>Distance: {candidate.distance?.toFixed?.(3) ?? "-"}</p>
        <p>Status: {candidate.status}</p>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={onPreview}>Preview JSON</Button>
          <Button variant="outline" onClick={onSelect}>Select</Button>
          <Button variant="outline" onClick={onReject}>Reject</Button>
          <Button onClick={onSave}>Save as GeneratedLevel</Button>
        </div>
      </CardContent>
    </Card>
  );
}
