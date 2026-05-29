"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Rule = { id: string; name: string; difficultyValue: number; description: string };
type Props = {
  generatorRules: Rule[];
  refreshRules: Rule[];
  selectedGeneratorRuleId: string;
  selectedRefreshRuleId: string;
  onChange: (next: { generatorRuleId?: string; refreshRuleId?: string }) => void;
};

export function LevelRulePresetSelector(props: Props) {
  const g = props.generatorRules.find((r) => r.id === props.selectedGeneratorRuleId);
  const r = props.refreshRules.find((x) => x.id === props.selectedRefreshRuleId);
  return (
    <Card className="border border-gray-200 shadow-sm">
      <CardHeader><CardTitle className="text-lg">规则 Preset 区</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        <Select value={props.selectedGeneratorRuleId} onValueChange={(v) => props.onChange({ generatorRuleId: v ?? "" })}>
          <SelectTrigger><SelectValue placeholder="生成规则" /></SelectTrigger>
          <SelectContent>{props.generatorRules.map((rule) => <SelectItem key={rule.id} value={rule.id}>{rule.name}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={props.selectedRefreshRuleId} onValueChange={(v) => props.onChange({ refreshRuleId: v ?? "" })}>
          <SelectTrigger><SelectValue placeholder="刷新规则" /></SelectTrigger>
          <SelectContent>{props.refreshRules.map((rule) => <SelectItem key={rule.id} value={rule.id}>{rule.name}</SelectItem>)}</SelectContent>
        </Select>
        <div className="rounded-md border border-gray-200 p-3 text-sm text-gray-700">
          <p>Generator: {g?.name} / 难度值 {g?.difficultyValue}</p>
          <p>{g?.description}</p>
          <p className="mt-2">Refresh: {r?.name} / 难度值 {r?.difficultyValue}</p>
          <p>{r?.description}</p>
        </div>
      </CardContent>
    </Card>
  );
}
