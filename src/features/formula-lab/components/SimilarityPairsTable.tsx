"use client";

import type { DifficultyDiagnosisResult } from "@/types/difficulty";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export function SimilarityPairsTable({ diagnosis }: { diagnosis?: DifficultyDiagnosisResult | null }) {
  const pairs = diagnosis?.breakdown.similarity.highSimilarityPairs ?? [];
  return (
    <div className="rounded-md border border-border">
      <Table>
        <TableHeader><TableRow><TableHead>ItemA</TableHead><TableHead>ItemB</TableHead><TableHead>Similarity</TableHead><TableHead>Reasons</TableHead></TableRow></TableHeader>
        <TableBody>
          {pairs.map((p, i) => (
            <TableRow key={`${p.itemA}-${p.itemB}-${i}`}>
              <TableCell>{p.itemA}</TableCell>
              <TableCell>{p.itemB}</TableCell>
              <TableCell>{p.similarity.toFixed(3)}</TableCell>
              <TableCell>{p.reasons.join(", ")}</TableCell>
            </TableRow>
          ))}
          {pairs.length === 0 ? <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">无高相似度道具对</TableCell></TableRow> : null}
        </TableBody>
      </Table>
    </div>
  );
}
