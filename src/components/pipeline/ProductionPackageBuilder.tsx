"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export function ProductionPackageBuilder({
  form,
  onChange,
  onDryRun,
  onBuild,
}: {
  form: { name: string; version: string; description: string };
  onChange: (key: string, value: string) => void;
  onDryRun: () => void;
  onBuild: () => void;
}) {
  return (
    <Card className="border border-border">
      <CardHeader><CardTitle className="text-sm">Production Package Builder</CardTitle></CardHeader>
      <CardContent className="grid gap-2 md:grid-cols-3">
        <Input value={form.name} onChange={(e) => onChange("name", e.target.value)} placeholder="包名称" />
        <Input value={form.version} onChange={(e) => onChange("version", e.target.value)} placeholder="版本号" />
        <Input value={form.description} onChange={(e) => onChange("description", e.target.value)} placeholder="描述" />
        <div className="col-span-full flex gap-2">
          <Button variant="outline" onClick={onDryRun}>Dry Run Validate</Button>
          <Button onClick={onBuild}>Build Package</Button>
        </div>
      </CardContent>
    </Card>
  );
}
