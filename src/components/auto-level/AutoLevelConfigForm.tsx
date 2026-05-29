"use client";

import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function AutoLevelConfigForm({
  form,
  onChange,
}: {
  form: Record<string, string | number>;
  onChange: (key: string, value: string | number) => void;
}) {
  return (
    <Card className="border border-gray-200">
      <CardHeader className="pb-2"><CardTitle className="text-sm">生成配置区</CardTitle></CardHeader>
      <CardContent className="grid grid-cols-2 gap-2">
        <Input value={String(form.name ?? "")} onChange={(e) => onChange("name", e.target.value)} placeholder="Run Name" />
        <Input value={String(form.generateCount ?? 5)} type="number" onChange={(e) => onChange("generateCount", Number(e.target.value) || 1)} placeholder="Generate Count" />
        <Input value={String(form.candidatesPerLevel ?? 3)} type="number" onChange={(e) => onChange("candidatesPerLevel", Number(e.target.value) || 1)} placeholder="Candidates Per Level" />
        <Input value={String(form.growthRate ?? 0.08)} type="number" onChange={(e) => onChange("growthRate", Number(e.target.value) || 0)} placeholder="Growth Rate" />
        <Input value={String(form.minP ?? 0.4)} type="number" onChange={(e) => onChange("minP", Number(e.target.value) || 0.3)} placeholder="Min P" />
        <Input value={String(form.maxP ?? 2.0)} type="number" onChange={(e) => onChange("maxP", Number(e.target.value) || 2)} placeholder="Max P" />
      </CardContent>
    </Card>
  );
}
