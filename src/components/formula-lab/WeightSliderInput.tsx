"use client";

import { Input } from "@/components/ui/input";

export function WeightSliderInput({
  label,
  description,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  description?: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="space-y-1 rounded-md border border-border p-2">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">{label}</p>
        <Input
          type="number"
          className="w-28"
          value={value}
          onChange={(e) => onChange(Math.min(max, Math.max(min, Number(e.target.value) || min)))}
        />
      </div>
      {description ? <p className="text-xs text-muted-foreground">{description}</p> : null}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full"
      />
    </div>
  );
}
