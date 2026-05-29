"use client";

import type { LevelConfig } from "@/types/level";

import { LevelCandidateCard } from "./LevelCandidateCard";

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
  candidates: LevelConfig[];
  validations: Validation[];
  onPreview: (index: number) => void;
  onSave: (index: number) => void;
  onExport: (index: number) => void;
};

export function LevelCandidateList(props: Props) {
  if (props.candidates.length === 0) {
    return <div className="rounded-md border border-dashed border-gray-300 p-8 text-sm text-gray-500">暂无候选关卡</div>;
  }
  return (
    <div className="grid gap-3 xl:grid-cols-2">
      {props.candidates.map((candidate, index) => (
        <LevelCandidateCard
          key={candidate.levelId}
          candidate={candidate}
          validation={props.validations[index]}
          onPreview={() => props.onPreview(index)}
          onSave={() => props.onSave(index)}
          onExport={() => props.onExport(index)}
        />
      ))}
    </div>
  );
}
