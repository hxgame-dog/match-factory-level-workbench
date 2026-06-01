"use client";

import type { PlayerProfile } from "@/types/playtest";
import { Input } from "@/components/ui/input";

export function PlayerProfileEditor({
  profiles,
  onChange,
}: {
  profiles: PlayerProfile[];
  onChange: (next: PlayerProfile[]) => void;
}) {
  return (
    <div className="space-y-2">
      {profiles.map((p, idx) => (
        <div key={p.id} className="grid grid-cols-4 gap-2 rounded border border-border p-2 text-xs">
          <p className="col-span-4 font-medium">{p.name}</p>
          <Input value={p.weight} type="number" onChange={(e) => onChange(profiles.map((x, i) => (i === idx ? { ...x, weight: Number(e.target.value) || 0 } : x)))} placeholder="weight" />
          <Input value={p.scanSpeed} type="number" onChange={(e) => onChange(profiles.map((x, i) => (i === idx ? { ...x, scanSpeed: Number(e.target.value) || 0 } : x)))} placeholder="scanSpeed" />
          <Input value={p.mistakeRate} type="number" onChange={(e) => onChange(profiles.map((x, i) => (i === idx ? { ...x, mistakeRate: Number(e.target.value) || 0 } : x)))} placeholder="mistakeRate" />
          <Input value={p.targetPriority} type="number" onChange={(e) => onChange(profiles.map((x, i) => (i === idx ? { ...x, targetPriority: Number(e.target.value) || 0 } : x)))} placeholder="targetPriority" />
        </div>
      ))}
    </div>
  );
}
