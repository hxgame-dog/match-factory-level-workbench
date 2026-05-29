"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type Preset = { id: string; name: string; description?: string | null; isDefault: boolean; updatedAt: string };

export function FormulaPresetManager(props: {
  presets: Preset[];
  selectedId: string;
  name: string;
  description: string;
  onSelect: (id: string) => void;
  onNameChange: (v: string) => void;
  onDescriptionChange: (v: string) => void;
  onCreate: () => void;
  onCopy: () => void;
  onSave: () => void;
  onDelete: () => void;
  onSetDefault: () => void;
  onResetDefault: () => void;
}) {
  const active = props.presets.find((p) => p.id === props.selectedId);
  return (
    <Card className="border border-gray-200 shadow-sm">
      <CardHeader><CardTitle className="text-lg">Formula Preset 管理区</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        <Select value={props.selectedId || "none"} onValueChange={(v) => props.onSelect(v ?? "")}>
          <SelectTrigger><SelectValue placeholder="选择 Preset" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="none">请选择</SelectItem>
            {props.presets.map((preset) => <SelectItem key={preset.id} value={preset.id}>{preset.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Input value={props.name} onChange={(e) => props.onNameChange(e.target.value)} placeholder="Preset Name" />
        <Textarea value={props.description} onChange={(e) => props.onDescriptionChange(e.target.value)} placeholder="Description" />
        <div className="flex flex-wrap gap-2">
          <Button onClick={props.onCreate}>新建</Button>
          <Button variant="outline" onClick={props.onCopy}>复制</Button>
          <Button variant="outline" onClick={props.onSave}>保存</Button>
          <Button variant="outline" onClick={props.onDelete}>删除</Button>
          <Button variant="outline" onClick={props.onSetDefault}>设为默认</Button>
          <Button variant="outline" onClick={props.onResetDefault}>重置默认</Button>
        </div>
        {active ? (
          <div className="rounded-md border border-gray-200 p-3 text-xs text-gray-600">
            <p>Is Default: {active.isDefault ? "Yes" : "No"}</p>
            <p>Updated At: {new Date(active.updatedAt).toLocaleString()}</p>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
