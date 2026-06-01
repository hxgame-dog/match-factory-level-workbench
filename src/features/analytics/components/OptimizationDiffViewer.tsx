"use client";

type DiffEntry = { path: string; before: unknown; after: unknown; reason: string };

export function OptimizationDiffViewer({ diff }: { diff: DiffEntry[] }) {
  if (!diff.length) return <p className="text-xs text-muted-foreground">无差异</p>;
  return (
    <div className="space-y-1 text-xs">
      {diff.map((d, i) => (
        <div key={i} className="rounded border border-border p-2">
          <p className="font-medium">{d.path}</p>
          <p className="text-red-600">- {JSON.stringify(d.before)}</p>
          <p className="text-green-600">+ {JSON.stringify(d.after)}</p>
          <p className="text-muted-foreground">{d.reason}</p>
        </div>
      ))}
    </div>
  );
}
