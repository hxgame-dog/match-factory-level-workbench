"use client";

import type { DifficultyFormulaConfig } from "@/types/difficulty";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { FormulaPresetManager } from "./FormulaPresetManager";
import { FormulaWeightTabs } from "./FormulaWeightTabs";

type PresetRow = {
  id: string;
  name: string;
  description?: string | null;
  isDefault: boolean;
  updatedAt: string;
};

type Props = {
  presets: PresetRow[];
  selectedPresetId: string;
  presetName: string;
  presetDescription: string;
  formulaConfig: DifficultyFormulaConfig;
  onSelectPreset: (id: string) => void;
  onNameChange: (name: string) => void;
  onDescriptionChange: (desc: string) => void;
  onCreate: () => void;
  onCopy: () => void;
  onSave: () => void;
  onDelete: () => void;
  onSetDefault: () => void;
  onResetDefault: () => void;
  onFormulaConfigChange: (config: DifficultyFormulaConfig) => void;
};

export function FormulaPresetSidebar({
  presets,
  selectedPresetId,
  presetName,
  presetDescription,
  formulaConfig,
  onSelectPreset,
  onNameChange,
  onDescriptionChange,
  onCreate,
  onCopy,
  onSave,
  onDelete,
  onSetDefault,
  onResetDefault,
  onFormulaConfigChange,
}: Props) {
  return (
    <div className="space-y-4">
      <FormulaPresetManager
        presets={presets}
        selectedId={selectedPresetId}
        name={presetName}
        description={presetDescription}
        onSelect={(id) => onSelectPreset(id === "none" ? "" : id)}
        onNameChange={onNameChange}
        onDescriptionChange={onDescriptionChange}
        onCreate={onCreate}
        onCopy={onCopy}
        onSave={onSave}
        onDelete={onDelete}
        onSetDefault={onSetDefault}
        onResetDefault={onResetDefault}
      />
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">公式权重配置</CardTitle>
        </CardHeader>
        <CardContent>
          <FormulaWeightTabs config={formulaConfig} onChange={onFormulaConfigChange} />
        </CardContent>
      </Card>
    </div>
  );
}
