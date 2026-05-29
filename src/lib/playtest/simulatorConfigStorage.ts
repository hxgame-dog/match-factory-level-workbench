import type { SimulatorConfig } from "@/types/playtest";
import { defaultSimulatorConfig } from "@/lib/playtest/defaultSimulatorConfig";
import { simulatorConfigSchema } from "@/lib/validators/playtest";

export const PLAYTEST_CONFIG_STORAGE_KEY = "mf-workbench-playtest-simulator-config";

export function loadSimulatorConfigFromStorage(): SimulatorConfig | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(PLAYTEST_CONFIG_STORAGE_KEY);
    if (!raw) return null;
    return simulatorConfigSchema.parse(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function saveSimulatorConfigToStorage(config: SimulatorConfig): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(PLAYTEST_CONFIG_STORAGE_KEY, JSON.stringify(config));
}

export function clearSimulatorConfigStorage(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(PLAYTEST_CONFIG_STORAGE_KEY);
}

export function getInitialSimulatorConfig(): SimulatorConfig {
  return loadSimulatorConfigFromStorage() ?? defaultSimulatorConfig;
}
