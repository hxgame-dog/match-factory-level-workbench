"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OptimizationDiffViewer } from "./OptimizationDiffViewer";
import type { OptimizationProposalResult } from "@/types/analytics";

export function OptimizationProposalPanel({
  mode,
  onModeChange,
  onGenerate,
  proposal,
  optimizedFormula,
  onSaveAsLevel,
  onReject,
}: {
  mode: "conservative" | "balanced" | "aggressive";
  onModeChange: (m: "conservative" | "balanced" | "aggressive") => void;
  onGenerate: () => void;
  proposal: OptimizationProposalResult | null;
  optimizedFormula: { P: number; label: string } | null;
  onSaveAsLevel: () => void;
  onReject: () => void;
}) {
  return (
    <Card className="border border-gray-200">
      <CardHeader><CardTitle className="text-sm">Optimization Proposal</CardTitle></CardHeader>
      <CardContent className="space-y-2 text-xs">
        <div className="flex items-center gap-2">
          <select value={mode} onChange={(e) => onModeChange(e.target.value as "conservative" | "balanced" | "aggressive")} className="h-8 rounded-md border border-gray-200 px-2">
            <option value="conservative">conservative</option>
            <option value="balanced">balanced</option>
            <option value="aggressive">aggressive</option>
          </select>
          <Button variant="outline" onClick={onGenerate}>Generate Proposal</Button>
        </div>
        {proposal ? (
          <div className="space-y-2">
            <p className="font-medium">{proposal.proposalName}</p>
            {optimizedFormula ? <p>优化后 Formula P: {optimizedFormula.P.toFixed(3)} ({optimizedFormula.label})</p> : null}
            <OptimizationDiffViewer diff={proposal.diff} />
            {proposal.warnings.length ? <p className="text-amber-600">{proposal.warnings.join("; ")}</p> : null}
            <div className="flex gap-2">
              <Button onClick={onSaveAsLevel}>Save as New GeneratedLevel</Button>
              <Button variant="outline" onClick={onReject}>Reject Proposal</Button>
            </div>
          </div>
        ) : (
          <p className="text-gray-500">先选择一个关卡并生成方案</p>
        )}
      </CardContent>
    </Card>
  );
}
