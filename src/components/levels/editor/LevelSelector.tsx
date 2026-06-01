"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type LevelOption = {
  id: string;
  name: string;
  levelIndex: number | null;
  theme: string | null;
  targetDifficulty: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
};

type Props = {
  levels: LevelOption[];
  selectedLevelId: string;
  onSelect: (id: string) => void;
  onLoad: () => void;
  onRefresh: () => void;
  onDuplicate: () => void;
  onExport: () => void;
};

export function LevelSelector(props: Props) {
  const selected = props.levels.find((level) => level.id === props.selectedLevelId);
  return (
    <Card>
      <CardHeader><CardTitle className="text-lg">Level 选择区</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        <Select value={props.selectedLevelId || "none"} onValueChange={(v) => props.onSelect(v === "none" ? "" : v ?? "")}>
          <SelectTrigger><SelectValue placeholder="选择关卡" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="none">请选择</SelectItem>
            {props.levels.map((level) => <SelectItem key={level.id} value={level.id}>{level.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="flex flex-wrap gap-2">
          <Button onClick={props.onLoad}>Load Level</Button>
          <Button variant="outline" onClick={props.onRefresh}>Refresh List</Button>
          <Button variant="outline" onClick={props.onDuplicate}>Duplicate Level</Button>
          <Button variant="outline" onClick={props.onExport}>Export JSON</Button>
        </div>
        {selected ? (
          <div className="rounded-md border border-border p-3 text-sm text-foreground">
            <p>Level Name: {selected.name}</p>
            <p>Level Index: {selected.levelIndex ?? "-"}</p>
            <p>Theme: {selected.theme ?? "-"}</p>
            <p>Target Difficulty: {selected.targetDifficulty ?? "-"}</p>
            <p>Status: {selected.status}</p>
            <p>Created: {new Date(selected.createdAt).toLocaleString()}</p>
            <p>Updated: {new Date(selected.updatedAt).toLocaleString()}</p>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
