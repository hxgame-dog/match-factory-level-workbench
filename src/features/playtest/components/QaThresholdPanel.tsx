"use client";

import { Input } from "@/components/ui/input";
import type { SimulatorConfig } from "@/types/playtest";

export function QaThresholdPanel({
  value,
  onChange,
}: {
  value: SimulatorConfig["qaThresholds"];
  onChange: (v: SimulatorConfig["qaThresholds"]) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <Input value={value.minPassRate} type="number" onChange={(e) => onChange({ ...value, minPassRate: Number(e.target.value) || 0 })} placeholder="minPassRate" />
      <Input value={value.maxPassRate} type="number" onChange={(e) => onChange({ ...value, maxPassRate: Number(e.target.value) || 1 })} placeholder="maxPassRate" />
      <Input value={value.minAvgRemainingTime} type="number" onChange={(e) => onChange({ ...value, minAvgRemainingTime: Number(e.target.value) || 0 })} placeholder="minAvgRemainingTime" />
      <Input value={value.maxAvgRemainingTime} type="number" onChange={(e) => onChange({ ...value, maxAvgRemainingTime: Number(e.target.value) || 0 })} placeholder="maxAvgRemainingTime" />
      <Input value={value.maxSlotPressure} type="number" onChange={(e) => onChange({ ...value, maxSlotPressure: Number(e.target.value) || 1 })} placeholder="maxSlotPressure" />
      <Input value={value.maxTargetStarvationTurns} type="number" onChange={(e) => onChange({ ...value, maxTargetStarvationTurns: Number(e.target.value) || 0 })} placeholder="maxTargetStarvationTurns" />
    </div>
  );
}
