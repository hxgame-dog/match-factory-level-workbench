import type { DifficultyAnomaly } from "@/types/difficulty";

export function AnomalyList({ anomalies }: { anomalies: DifficultyAnomaly[] }) {
  if (anomalies.length === 0) return <div className="text-sm text-muted-foreground">无异常关卡</div>;
  return (
    <div className="space-y-2">
      {anomalies.map((a, i) => (
        <div key={`${a.levelId}-${a.type}-${i}`} className="rounded-md border border-border p-2 text-sm">
          <p className="font-medium">{a.levelName} - {a.type}</p>
          <p>{a.message} / {a.severity}</p>
        </div>
      ))}
    </div>
  );
}
