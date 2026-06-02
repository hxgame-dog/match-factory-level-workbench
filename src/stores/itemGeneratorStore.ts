"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

type ItemGeneratorState = {
  defaultItemSetId: string | null;
  setDefaultItemSetId: (id: string | null) => void;
};

export const useItemGeneratorStore = create<ItemGeneratorState>()(
  persist(
    (set) => ({
      defaultItemSetId: null,
      setDefaultItemSetId: (id) => set({ defaultItemSetId: id }),
    }),
    { name: "mf-item-generator" },
  ),
);
