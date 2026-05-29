"use client";

import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { LevelConfig } from "@/types/level";

type Rule = { id: string; name: string };

type Props = {
  level: LevelConfig;
  generatorRules: Rule[];
  refreshRules: Rule[];
  onChange: (next: LevelConfig) => void;
};

export function LevelBasicConfigPanel({ level, generatorRules, refreshRules, onChange }: Props) {
  return (
    <div className="grid gap-2 md:grid-cols-2">
      <Input value={level.name} onChange={(e) => onChange({ ...level, name: e.target.value })} placeholder="Level Name" />
      <Input type="number" value={level.levelIndex ?? 1} onChange={(e) => onChange({ ...level, levelIndex: Number(e.target.value) || 1 })} placeholder="Level Index" />
      <Input value={level.theme ?? ""} onChange={(e) => onChange({ ...level, theme: e.target.value })} placeholder="Theme" />
      <Input type="number" value={level.rules.timeLimitSec} onChange={(e) => onChange({ ...level, rules: { ...level.rules, timeLimitSec: Number(e.target.value) || 180 } })} placeholder="Time Limit" />
      <Input type="number" value={level.rules.slotCount} onChange={(e) => onChange({ ...level, rules: { ...level.rules, slotCount: Number(e.target.value) || 7 } })} placeholder="Slot Count" />
      <Input type="number" value={level.board.width} onChange={(e) => onChange({ ...level, board: { ...level.board, width: Number(e.target.value) || 8 } })} placeholder="Board Width" />
      <Input type="number" value={level.board.height} onChange={(e) => onChange({ ...level, board: { ...level.board, height: Number(e.target.value) || 8 } })} placeholder="Board Height" />
      <Input type="number" value={level.board.layerCount} onChange={(e) => onChange({ ...level, board: { ...level.board, layerCount: Number(e.target.value) || 1 } })} placeholder="Layer Count" />
      <Select value={level.board.layoutMode} onValueChange={(v) => onChange({ ...level, board: { ...level.board, layoutMode: (v ?? "flat") as LevelConfig["board"]["layoutMode"] } })}>
        <SelectTrigger><SelectValue placeholder="Layout Mode" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="flat">flat</SelectItem><SelectItem value="stacked">stacked</SelectItem><SelectItem value="clustered">clustered</SelectItem><SelectItem value="random">random</SelectItem>
        </SelectContent>
      </Select>
      <Select value={level.rules.targetDifficulty} onValueChange={(v) => onChange({ ...level, rules: { ...level.rules, targetDifficulty: (v ?? "normal") as LevelConfig["rules"]["targetDifficulty"] } })}>
        <SelectTrigger><SelectValue placeholder="Target Difficulty" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="easy">easy</SelectItem><SelectItem value="normal">normal</SelectItem><SelectItem value="hard">hard</SelectItem><SelectItem value="expert">expert</SelectItem>
        </SelectContent>
      </Select>
      <Select value={level.rules.generatorRuleId} onValueChange={(v) => onChange({ ...level, rules: { ...level.rules, generatorRuleId: v ?? level.rules.generatorRuleId } })}>
        <SelectTrigger><SelectValue placeholder="Generator Rule" /></SelectTrigger>
        <SelectContent>{generatorRules.map((r) => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}</SelectContent>
      </Select>
      <Select value={level.rules.refreshRuleId} onValueChange={(v) => onChange({ ...level, rules: { ...level.rules, refreshRuleId: v ?? level.rules.refreshRuleId } })}>
        <SelectTrigger><SelectValue placeholder="Refresh Rule" /></SelectTrigger>
        <SelectContent>{refreshRules.map((r) => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}</SelectContent>
      </Select>
      <Textarea
        value={level.meta.notes ?? ""}
        onChange={(e) => onChange({ ...level, meta: { ...level.meta, notes: e.target.value } })}
        placeholder="Notes"
        className="md:col-span-2"
      />
    </div>
  );
}
