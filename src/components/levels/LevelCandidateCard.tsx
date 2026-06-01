"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { LevelConfig } from "@/types/level";

import { LevelValidationPanel } from "./LevelValidationPanel";

type Validation = {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  stats: {
    targetTypeCount: number;
    targetTotalCount: number;
    spawnTypeCount: number;
    spawnTotalCount: number;
    distractorTypeCount: number;
    missingAssetCount: number;
  };
};

type Props = {
  candidate: LevelConfig;
  validation: Validation;
  onPreview: () => void;
  onSave: () => void;
  onExport: () => void;
};

export function LevelCandidateCard(props: Props) {
  const c = props.candidate;
  return (
    <Card >
      <CardHeader>
        <CardTitle className="text-base">{c.name}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <p>Level Index: {c.levelIndex ?? "-"}</p>
        <p>Time Limit: {c.rules.timeLimitSec}s / Slot: {c.rules.slotCount}</p>
        <p>Board: {c.board.width}x{c.board.height} / Layer {c.board.layerCount}</p>
        <p>Generator Rule: {c.rules.generatorRuleId}</p>
        <p>Refresh Rule: {c.rules.refreshRuleId}</p>
        <p>Target Count: {c.targets.length} / Spawn Count: {c.spawns.length}</p>
        <p>Estimated Difficulty: {c.diagnostics?.estimatedFinalDifficulty?.toFixed(2) ?? "-"}</p>
        <div className="flex flex-wrap gap-1">
          {(c.diagnostics?.warnings ?? []).slice(0, 3).map((w) => <Badge key={w} variant="outline">{w}</Badge>)}
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={props.onPreview}>Preview JSON</Button>
          <Button size="sm" onClick={props.onSave}>Save</Button>
          <Button size="sm" variant="outline" onClick={props.onExport}>Export JSON</Button>
        </div>
        <LevelValidationPanel validation={props.validation} />
      </CardContent>
    </Card>
  );
}
