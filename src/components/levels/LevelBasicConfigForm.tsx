"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Props = {
  values: {
    levelName: string;
    levelIndex: number;
    targetDifficulty: "easy" | "normal" | "hard" | "expert";
    timeLimitSec: number;
    slotCount: number;
    boardWidth: number;
    boardHeight: number;
    layerCount: number;
    layoutMode: "flat" | "stacked" | "clustered" | "random";
    candidateCount: number;
  };
  onChange: (next: Partial<Props["values"]>) => void;
};

export function LevelBasicConfigForm({ values, onChange }: Props) {
  return (
    <Card className="border border-gray-200 shadow-sm">
      <CardHeader><CardTitle className="text-lg">关卡基础配置区</CardTitle></CardHeader>
      <CardContent className="grid gap-2 md:grid-cols-2">
        <Input value={values.levelName} onChange={(e) => onChange({ levelName: e.target.value })} placeholder="Level Name" />
        <Input type="number" value={values.levelIndex} onChange={(e) => onChange({ levelIndex: Number(e.target.value) || 1 })} placeholder="Level Index" />
        <Select value={values.targetDifficulty} onValueChange={(v) => onChange({ targetDifficulty: (v ?? "normal") as Props["values"]["targetDifficulty"] })}>
          <SelectTrigger><SelectValue placeholder="Target Difficulty" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="easy">easy</SelectItem><SelectItem value="normal">normal</SelectItem><SelectItem value="hard">hard</SelectItem><SelectItem value="expert">expert</SelectItem>
          </SelectContent>
        </Select>
        <Input type="number" value={values.timeLimitSec} onChange={(e) => onChange({ timeLimitSec: Number(e.target.value) || 180 })} placeholder="Time Limit Sec" />
        <Input type="number" value={values.slotCount} onChange={(e) => onChange({ slotCount: Number(e.target.value) || 7 })} placeholder="Slot Count" />
        <Input type="number" value={values.boardWidth} onChange={(e) => onChange({ boardWidth: Number(e.target.value) || 8 })} placeholder="Board Width" />
        <Input type="number" value={values.boardHeight} onChange={(e) => onChange({ boardHeight: Number(e.target.value) || 8 })} placeholder="Board Height" />
        <Input type="number" value={values.layerCount} onChange={(e) => onChange({ layerCount: Number(e.target.value) || 3 })} placeholder="Layer Count" />
        <Select value={values.layoutMode} onValueChange={(v) => onChange({ layoutMode: (v ?? "flat") as Props["values"]["layoutMode"] })}>
          <SelectTrigger><SelectValue placeholder="Layout Mode" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="flat">flat</SelectItem><SelectItem value="stacked">stacked</SelectItem><SelectItem value="clustered">clustered</SelectItem><SelectItem value="random">random</SelectItem>
          </SelectContent>
        </Select>
        <Input type="number" value={values.candidateCount} onChange={(e) => onChange({ candidateCount: Number(e.target.value) || 3 })} placeholder="Candidate Count" />
      </CardContent>
    </Card>
  );
}
