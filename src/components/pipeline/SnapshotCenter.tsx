"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export function SnapshotCenter({
  levelId,
  snapshotName,
  onLevelIdChange,
  onNameChange,
  onCreate,
}: {
  levelId: string;
  snapshotName: string;
  onLevelIdChange: (v: string) => void;
  onNameChange: (v: string) => void;
  onCreate: () => void;
}) {
  return (
    <Card className="border border-border">
      <CardHeader><CardTitle className="text-sm">Snapshot Center</CardTitle></CardHeader>
      <CardContent className="space-y-2">
        <Input value={levelId} onChange={(e) => onLevelIdChange(e.target.value)} placeholder="GeneratedLevel ID" />
        <Input value={snapshotName} onChange={(e) => onNameChange(e.target.value)} placeholder="Snapshot Name" />
        <Button onClick={onCreate}>创建快照</Button>
      </CardContent>
    </Card>
  );
}
