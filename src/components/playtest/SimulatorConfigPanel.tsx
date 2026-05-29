"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { SimulatorConfig } from "@/types/playtest";
import {
  clearSimulatorConfigStorage,
  loadSimulatorConfigFromStorage,
  saveSimulatorConfigToStorage,
} from "@/lib/playtest/simulatorConfigStorage";
import { PlayerProfileEditor } from "./PlayerProfileEditor";
import { QaThresholdPanel } from "./QaThresholdPanel";

export function SimulatorConfigPanel({
  config,
  onChange,
  onResetDefault,
}: {
  config: SimulatorConfig;
  onChange: (v: SimulatorConfig) => void;
  onResetDefault: () => void;
}) {
  const [presetHint, setPresetHint] = useState<string | null>(null);

  function handleSavePreset() {
    saveSimulatorConfigToStorage(config);
    setPresetHint("已保存为本地默认配置");
    window.setTimeout(() => setPresetHint(null), 2500);
  }

  function handleLoadPreset() {
    const loaded = loadSimulatorConfigFromStorage();
    if (!loaded) {
      setPresetHint("本地暂无已保存配置");
      window.setTimeout(() => setPresetHint(null), 2500);
      return;
    }
    onChange(loaded);
    setPresetHint("已加载本地默认配置");
    window.setTimeout(() => setPresetHint(null), 2500);
  }

  function handleClearPreset() {
    clearSimulatorConfigStorage();
    setPresetHint("已清除本地保存");
    window.setTimeout(() => setPresetHint(null), 2500);
  }

  return (
    <Card className="border border-gray-200">
      <CardHeader>
        <CardTitle className="text-sm">模拟器配置</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="mb-1 block text-xs text-gray-500">每关模拟次数</label>
            <Input
              value={config.simulationCount}
              type="number"
              onChange={(e) => onChange({ ...config, simulationCount: Number(e.target.value) || 1 })}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-gray-500">槽位容量</label>
            <Input
              value={config.rules.slotCapacity}
              type="number"
              onChange={(e) => onChange({ ...config, rules: { ...config.rules, slotCapacity: Number(e.target.value) || 7 } })}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-gray-500">消除所需数量</label>
            <Input
              value={config.rules.matchRequiredCount}
              type="number"
              onChange={(e) =>
                onChange({ ...config, rules: { ...config.rules, matchRequiredCount: Number(e.target.value) || 3 } })
              }
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-gray-500">时间上限覆盖（秒，可选）</label>
            <Input
              value={config.rules.timeLimitSecOverride ?? ""}
              type="number"
              onChange={(e) =>
                onChange({
                  ...config,
                  rules: {
                    ...config.rules,
                    timeLimitSecOverride: e.target.value ? Number(e.target.value) : undefined,
                  },
                })
              }
            />
          </div>
        </div>
        <PlayerProfileEditor
          profiles={config.playerProfiles}
          onChange={(profiles) => onChange({ ...config, playerProfiles: profiles })}
        />
        <QaThresholdPanel value={config.qaThresholds} onChange={(qaThresholds) => onChange({ ...config, qaThresholds })} />
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={handleSavePreset}>
            保存为本地默认
          </Button>
          <Button variant="outline" onClick={handleLoadPreset}>
            加载本地默认
          </Button>
          <Button variant="outline" onClick={handleClearPreset}>
            清除本地保存
          </Button>
          <Button variant="outline" onClick={onResetDefault}>
            恢复系统默认
          </Button>
        </div>
        {presetHint ? <p className="text-xs text-blue-600">{presetHint}</p> : null}
      </CardContent>
    </Card>
  );
}
