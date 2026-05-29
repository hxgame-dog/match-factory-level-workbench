"use client";

import { create } from "zustand";

import type { LevelConfig, LevelItemEntry } from "@/types/level";

type SourceItem = LevelItemEntry & { id?: string };
type AssetItem = { generatedItemId?: string; name: string; imageUrl?: string; localPath?: string; prompt?: string };

type LevelEditorStore = {
  level: LevelConfig | null;
  originalLevel: LevelConfig | null;
  sourceItems: SourceItem[];
  assets: AssetItem[];
  selectedLevelId?: string;
  dirty: boolean;
  validation?: unknown;
  difficulty?: unknown;
  boardPreview?: unknown;
  setContext: (input: {
    level: LevelConfig;
    sourceItems: SourceItem[];
    assets: AssetItem[];
    selectedLevelId?: string;
  }) => void;
  setLevel: (level: LevelConfig) => void;
  updateBasicConfig: (patch: Partial<LevelConfig>) => void;
  updateTargetCount: (index: number, count: number) => void;
  updateSpawnCount: (index: number, count: number) => void;
  updateSpawnRole: (index: number, role: LevelItemEntry["role"]) => void;
  addTarget: (item: LevelItemEntry) => void;
  removeTarget: (index: number) => void;
  addSpawn: (item: LevelItemEntry) => void;
  removeSpawn: (index: number) => void;
  replaceTarget: (index: number, item: LevelItemEntry) => void;
  replaceSpawn: (index: number, item: LevelItemEntry) => void;
  setValidation: (v: unknown) => void;
  setDifficulty: (d: unknown) => void;
  setBoardPreview: (p: unknown) => void;
  resetChanges: () => void;
};

export const useLevelEditorStore = create<LevelEditorStore>((set, get) => ({
  level: null,
  originalLevel: null,
  sourceItems: [],
  assets: [],
  selectedLevelId: undefined,
  dirty: false,
  setContext: ({ level, sourceItems, assets, selectedLevelId }) =>
    set({
      level,
      originalLevel: JSON.parse(JSON.stringify(level)),
      sourceItems,
      assets,
      selectedLevelId,
      dirty: false,
    }),
  setLevel: (level) => set({ level, dirty: true }),
  updateBasicConfig: (patch) =>
    set((state) => ({ level: state.level ? { ...state.level, ...patch } : state.level, dirty: true })),
  updateTargetCount: (index, count) =>
    set((state) => {
      if (!state.level) return state;
      const targets = [...state.level.targets];
      targets[index] = { ...targets[index], count: Math.max(1, count) };
      return { level: { ...state.level, targets }, dirty: true };
    }),
  updateSpawnCount: (index, count) =>
    set((state) => {
      if (!state.level) return state;
      const spawns = [...state.level.spawns];
      spawns[index] = { ...spawns[index], count: Math.max(1, count) };
      return { level: { ...state.level, spawns }, dirty: true };
    }),
  updateSpawnRole: (index, role) =>
    set((state) => {
      if (!state.level) return state;
      const spawns = [...state.level.spawns];
      spawns[index] = { ...spawns[index], role };
      return { level: { ...state.level, spawns }, dirty: true };
    }),
  addTarget: (item) =>
    set((state) =>
      state.level
        ? {
            level: { ...state.level, targets: [...state.level.targets, { ...item, role: "target" }] },
            dirty: true,
          }
        : state,
    ),
  removeTarget: (index) =>
    set((state) =>
      state.level
        ? { level: { ...state.level, targets: state.level.targets.filter((_, i) => i !== index) }, dirty: true }
        : state,
    ),
  addSpawn: (item) =>
    set((state) =>
      state.level ? { level: { ...state.level, spawns: [...state.level.spawns, item] }, dirty: true } : state,
    ),
  removeSpawn: (index) =>
    set((state) =>
      state.level ? { level: { ...state.level, spawns: state.level.spawns.filter((_, i) => i !== index) }, dirty: true } : state,
    ),
  replaceTarget: (index, item) =>
    set((state) => {
      if (!state.level) return state;
      const targets = [...state.level.targets];
      targets[index] = { ...item, role: "target" };
      return { level: { ...state.level, targets }, dirty: true };
    }),
  replaceSpawn: (index, item) =>
    set((state) => {
      if (!state.level) return state;
      const spawns = [...state.level.spawns];
      spawns[index] = item;
      return { level: { ...state.level, spawns }, dirty: true };
    }),
  setValidation: (validation) => set({ validation }),
  setDifficulty: (difficulty) => set({ difficulty }),
  setBoardPreview: (boardPreview) => set({ boardPreview }),
  resetChanges: () => {
    const original = get().originalLevel;
    if (!original) return;
    set({ level: JSON.parse(JSON.stringify(original)), dirty: false });
  },
}));
