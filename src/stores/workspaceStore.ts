"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

type WorkspaceState = {
  activeId: string | null;
  activeName: string | null;
  recentIds: string[];
  setActive: (id: string, name: string) => void;
  clearActive: () => void;
};

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set, get) => ({
      activeId: null,
      activeName: null,
      recentIds: [],
      setActive: (id, name) => {
        const recent = [id, ...get().recentIds.filter((x) => x !== id)].slice(0, 8);
        set({ activeId: id, activeName: name, recentIds: recent });
      },
      clearActive: () => set({ activeId: null, activeName: null }),
    }),
    { name: "mf-workspace" },
  ),
);
