"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

type LayoutState = {
  sidebarCollapsed: boolean;
  guideCollapsed: boolean;
  toggleSidebar: () => void;
  toggleGuide: () => void;
  setGuideCollapsed: (collapsed: boolean) => void;
};

export const useLayoutStore = create<LayoutState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      guideCollapsed: false,
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      toggleGuide: () => set((s) => ({ guideCollapsed: !s.guideCollapsed })),
      setGuideCollapsed: (collapsed) => set({ guideCollapsed: collapsed }),
    }),
    { name: "mf-layout" },
  ),
);
