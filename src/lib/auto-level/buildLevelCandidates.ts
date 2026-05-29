import type { DifficultyFormulaConfig } from "@/types/difficulty";
import type { AutoGenerateLevelsInput, SourceLevelPatternAnalysis } from "@/types/autoLevel";
import type { LevelConfig, LevelItemEntry } from "@/types/level";

import { diagnoseLevelDifficulty } from "@/lib/difficulty/diagnoseLevelDifficulty";

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

export async function buildLevelCandidates(input: {
  target: { levelIndex: number; targetP: number; label: string };
  sourceLevels: LevelConfig[];
  sourceAnalysis: SourceLevelPatternAnalysis;
  availableItemSets: Array<{ id: string; name: string; theme: string }>;
  availableItems: Array<LevelItemEntry>;
  availableAssetBatches: Array<{ id: string; itemSetId: string }>;
  constraints: AutoGenerateLevelsInput["generationConstraints"];
  candidatesPerLevel: number;
  formulaConfig: DifficultyFormulaConfig;
}): Promise<LevelConfig[]> {
  const source = input.sourceLevels[input.sourceLevels.length - 1] ?? input.sourceLevels[0];
  const candidates: LevelConfig[] = [];
  const targetItems = input.availableItems.filter((i) => i.role === "target");
  const distractorItems = input.availableItems.filter((i) => i.role === "distractor");
  const safeTargetItems = targetItems.length ? targetItems : input.availableItems.slice(0, 3);
  const safeDistractors = distractorItems.length ? distractorItems : input.availableItems.slice(0, 5);

  for (let i = 0; i < input.candidatesPerLevel; i += 1) {
    const level = clone(source);
    level.levelId = `auto_${input.target.levelIndex}_${i + 1}`;
    level.levelIndex = input.target.levelIndex;
    level.name = `${source.name} Auto ${input.target.levelIndex} C${i + 1}`;
    const pressure = input.target.targetP;
    const timeLimit = Math.max(80, Math.round(220 - pressure * 40 + i * 6));
    const spawnFactor = 1 + pressure * 0.22 + i * 0.04;
    level.rules.timeLimitSec = timeLimit;
    level.rules.targetDifficulty = input.target.label as LevelConfig["rules"]["targetDifficulty"];
    level.board.layerCount = Math.max(1, Math.min(5, Math.round(2 + pressure * 0.6)));
    level.targets = safeTargetItems
      .slice(0, Math.max(1, Math.min(4, safeTargetItems.length)))
      .map((item) => ({ ...item, role: "target", count: Math.max(3, Math.round(item.count * (0.8 + pressure * 0.2))), assetKey: item.name }));
    const spawnTargets = level.targets.map((t) => ({ ...t, count: Math.max(t.count, Math.round(t.count * spawnFactor)) }));
    const spawnDistractors = safeDistractors
      .slice(0, Math.max(1, Math.min(5, safeDistractors.length)))
      .map((item) => ({ ...item, role: item.role, count: Math.max(1, Math.round((item.count || 3) * (0.7 + pressure * 0.25))), assetKey: item.name }));
    level.spawns = [...spawnTargets, ...spawnDistractors];
    candidates.push(level);
  }

  candidates.sort((a, b) => {
    const da = diagnoseLevelDifficulty({ level: a, formulaConfig: input.formulaConfig });
    const db = diagnoseLevelDifficulty({ level: b, formulaConfig: input.formulaConfig });
    return Math.abs(da.score.P - input.target.targetP) - Math.abs(db.score.P - input.target.targetP);
  });
  return candidates;
}
