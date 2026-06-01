"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AutoGenerateLevelsResult } from "@/types/autoLevel";
import { AutoLevelCandidateCard } from "./AutoLevelCandidateCard";

type Candidate = AutoGenerateLevelsResult["generated"][number]["candidates"][number];

export function AutoLevelResultPanel({
  result,
  onPreviewCandidate,
  onSelectCandidate,
  onRejectCandidate,
  onSaveCandidate,
}: {
  result: AutoGenerateLevelsResult | null;
  onPreviewCandidate: (c: Candidate) => void;
  onSelectCandidate: (id: string) => void;
  onRejectCandidate: (id: string) => void;
  onSaveCandidate: (id: string) => void;
}) {
  if (!result) return null;
  return (
    <Card className="border border-border">
      <CardHeader><CardTitle className="text-sm">生成结果区</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        {result.generated?.map((row) => (
          <details key={row.targetLevelIndex} open className="rounded-md border border-border p-2">
            <summary className="cursor-pointer text-sm">L{row.targetLevelIndex} · Target P {row.targetP?.toFixed?.(3)}</summary>
            <div className="mt-2 grid gap-2 md:grid-cols-2">
              {row.candidates?.map((candidate) => (
                <AutoLevelCandidateCard
                  key={candidate.candidateId ?? `${row.targetLevelIndex}_${candidate.candidateRank}`}
                  candidate={candidate}
                  onPreview={() => onPreviewCandidate(candidate)}
                  onSelect={() => candidate.candidateId && onSelectCandidate(candidate.candidateId)}
                  onReject={() => candidate.candidateId && onRejectCandidate(candidate.candidateId)}
                  onSave={() => candidate.candidateId && onSaveCandidate(candidate.candidateId)}
                />
              ))}
            </div>
          </details>
        ))}
      </CardContent>
    </Card>
  );
}
