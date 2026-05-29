import type { SimulatorConfig } from "@/types/playtest";

export const defaultSimulatorConfig: SimulatorConfig = {
  simulationCount: 100,
  playerProfiles: [
    { id: "beginner", name: "Beginner Player", weight: 0.25, skillLevel: "beginner", scanSpeed: 0.65, mistakeRate: 0.18, targetPriority: 0.65, distractorClickChance: 0.12, memoryFactor: 0.35, panicFactor: 0.35 },
    { id: "normal", name: "Normal Player", weight: 0.45, skillLevel: "normal", scanSpeed: 0.85, mistakeRate: 0.1, targetPriority: 0.78, distractorClickChance: 0.07, memoryFactor: 0.55, panicFactor: 0.25 },
    { id: "advanced", name: "Advanced Player", weight: 0.25, skillLevel: "advanced", scanSpeed: 1.05, mistakeRate: 0.05, targetPriority: 0.9, distractorClickChance: 0.03, memoryFactor: 0.75, panicFactor: 0.15 },
    { id: "expert", name: "Expert Player", weight: 0.05, skillLevel: "expert", scanSpeed: 1.25, mistakeRate: 0.02, targetPriority: 0.95, distractorClickChance: 0.01, memoryFactor: 0.9, panicFactor: 0.08 },
  ],
  rules: {
    slotCapacity: 7,
    matchRequiredCount: 3,
    allowShuffleAssist: false,
    allowHintAssist: false,
    allowBoosterAssist: false,
  },
  strategy: {
    selectionStrategy: "target_first",
    considerSimilarity: true,
    considerSize: true,
    considerLayerBlocking: true,
    considerRefreshRules: true,
  },
  qaThresholds: {
    minPassRate: 0.65,
    maxPassRate: 0.98,
    minAvgRemainingTime: 10,
    maxAvgRemainingTime: 120,
    maxSlotPressure: 0.85,
    maxTargetStarvationTurns: 8,
    maxWarningCount: 5,
  },
};
