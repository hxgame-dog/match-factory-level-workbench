"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { DifficultyFormulaConfig } from "@/types/difficulty";

import { WeightSliderInput } from "./WeightSliderInput";

type Props = {
  config: DifficultyFormulaConfig;
  onChange: (config: DifficultyFormulaConfig) => void;
};

function updateNumber<T extends object, K extends keyof T>(
  obj: T,
  key: K,
  value: number,
): T {
  return { ...obj, [key]: Math.max(0, value) };
}

export function FormulaWeightTabs({ config, onChange }: Props) {
  return (
    <Tabs defaultValue="complexity">
      <TabsList>
        <TabsTrigger value="complexity">Complexity</TabsTrigger>
        <TabsTrigger value="attr">Attr</TabsTrigger>
        <TabsTrigger value="bucket">Bucket/Size</TabsTrigger>
        <TabsTrigger value="target">Target/Visual</TabsTrigger>
        <TabsTrigger value="rule">Rule/Time</TabsTrigger>
        <TabsTrigger value="label">Label</TabsTrigger>
      </TabsList>
      <TabsContent value="complexity" className="grid gap-2 md:grid-cols-2">
        {(Object.keys(config.complexityWeights) as Array<keyof DifficultyFormulaConfig["complexityWeights"]>).map((k) => (
          <WeightSliderInput key={k} label={k} value={config.complexityWeights[k]} min={0} max={3} step={0.01} onChange={(v) => onChange({ ...config, complexityWeights: updateNumber(config.complexityWeights, k, v) })} />
        ))}
      </TabsContent>
      <TabsContent value="attr" className="grid gap-2 md:grid-cols-2">
        {(Object.keys(config.attrWeights) as Array<keyof DifficultyFormulaConfig["attrWeights"]>).map((k) => (
          <WeightSliderInput key={k} label={k} value={config.attrWeights[k]} min={0} max={3} step={0.01} onChange={(v) => onChange({ ...config, attrWeights: updateNumber(config.attrWeights, k, v) })} />
        ))}
      </TabsContent>
      <TabsContent value="bucket" className="grid gap-2 md:grid-cols-2">
        {(Object.keys(config.bucketWeights) as Array<keyof DifficultyFormulaConfig["bucketWeights"]>).map((k) => (
          <WeightSliderInput key={k} label={`bucket.${k}`} value={config.bucketWeights[k]} min={0} max={3} step={0.01} onChange={(v) => onChange({ ...config, bucketWeights: updateNumber(config.bucketWeights, k, v) })} />
        ))}
        {(Object.keys(config.sizeWeights) as Array<keyof DifficultyFormulaConfig["sizeWeights"]>).map((k) => (
          <WeightSliderInput key={k} label={`size.${k}`} value={config.sizeWeights[k]} min={0} max={3} step={0.01} onChange={(v) => onChange({ ...config, sizeWeights: updateNumber(config.sizeWeights, k, v) })} />
        ))}
      </TabsContent>
      <TabsContent value="target" className="grid gap-2 md:grid-cols-2">
        {(Object.keys(config.targetWeights) as Array<keyof DifficultyFormulaConfig["targetWeights"]>).map((k) => (
          <WeightSliderInput key={k} label={k} value={config.targetWeights[k]} min={0} max={3} step={0.01} onChange={(v) => onChange({ ...config, targetWeights: updateNumber(config.targetWeights, k, v) })} />
        ))}
        {(Object.keys(config.visualWeights) as Array<keyof DifficultyFormulaConfig["visualWeights"]>).map((k) => (
          <WeightSliderInput key={k} label={k} value={config.visualWeights[k]} min={0} max={3} step={0.01} onChange={(v) => onChange({ ...config, visualWeights: updateNumber(config.visualWeights, k, v) })} />
        ))}
      </TabsContent>
      <TabsContent value="rule" className="grid gap-2 md:grid-cols-2">
        {(Object.keys(config.ruleWeights) as Array<keyof DifficultyFormulaConfig["ruleWeights"]>).map((k) => (
          <WeightSliderInput key={k} label={k} value={config.ruleWeights[k]} min={0} max={3} step={0.01} onChange={(v) => onChange({ ...config, ruleWeights: updateNumber(config.ruleWeights, k, v) })} />
        ))}
        {(Object.keys(config.constants) as Array<keyof DifficultyFormulaConfig["constants"]>).map((k) => (
          <WeightSliderInput key={k} label={k} value={config.constants[k]} min={0.01} max={300} step={0.01} onChange={(v) => onChange({ ...config, constants: { ...config.constants, [k]: v } })} />
        ))}
      </TabsContent>
      <TabsContent value="label" className="grid gap-2 md:grid-cols-2">
        {(Object.keys(config.labelThresholds) as Array<keyof DifficultyFormulaConfig["labelThresholds"]>).map((k) => (
          <WeightSliderInput key={k} label={k} value={config.labelThresholds[k]} min={0.1} max={3} step={0.01} onChange={(v) => onChange({ ...config, labelThresholds: { ...config.labelThresholds, [k]: v } })} />
        ))}
      </TabsContent>
    </Tabs>
  );
}
