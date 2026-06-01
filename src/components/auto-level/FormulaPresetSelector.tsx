"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function FormulaPresetSelector({
  presets,
  value,
  onChange,
}: {
  presets: Array<{ id: string; name: string; isDefault: boolean }>;
  value?: string;
  onChange: (v: string) => void;
}) {
  return (
    <Card className="border border-border">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Formula Preset 选择区</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <select
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 w-full rounded-md border border-border px-2 text-sm"
        >
          <option value="">使用默认公式</option>
          {presets.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
              {p.isDefault ? "（默认）" : ""}
            </option>
          ))}
        </select>
        <Link href="/formula-lab" className="inline-block">
          <Button variant="outline">Open Formula Lab</Button>
        </Link>
      </CardContent>
    </Card>
  );
}
