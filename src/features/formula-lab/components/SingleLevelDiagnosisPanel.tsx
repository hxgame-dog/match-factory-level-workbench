"use client";

import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type LevelOption = { id: string; name: string };

export function SingleLevelDiagnosisPanel({
  levels,
  selectedLevelId,
  onSelectLevel,
  onDiagnose,
}: {
  levels: LevelOption[];
  selectedLevelId: string;
  onSelectLevel: (id: string) => void;
  onDiagnose: () => void;
}) {
  return (
    <div className="space-y-2 rounded-md border border-border p-3">
      <p className="font-medium">单关诊断区</p>
      <Select value={selectedLevelId || "none"} onValueChange={(v) => onSelectLevel(v ?? "")}>
        <SelectTrigger><SelectValue placeholder="选择关卡" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="none">请选择</SelectItem>
          {levels.map((level) => <SelectItem key={level.id} value={level.id}>{level.name}</SelectItem>)}
        </SelectContent>
      </Select>
      <Button onClick={onDiagnose}>Diagnose</Button>
    </div>
  );
}
