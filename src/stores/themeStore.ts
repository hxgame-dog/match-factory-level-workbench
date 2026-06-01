import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ThemePreference = "light" | "dark" | "system";

type ThemeState = {
  theme: ThemePreference;
  setTheme: (theme: ThemePreference) => void;
  cycleTheme: () => void;
};

const THEME_CYCLE: ThemePreference[] = ["light", "dark", "system"];

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: "system",
      setTheme: (theme) => set({ theme }),
      cycleTheme: () => {
        const current = get().theme;
        const index = THEME_CYCLE.indexOf(current);
        const next = THEME_CYCLE[(index + 1) % THEME_CYCLE.length];
        set({ theme: next });
      },
    }),
    { name: "level-work-theme" },
  ),
);
