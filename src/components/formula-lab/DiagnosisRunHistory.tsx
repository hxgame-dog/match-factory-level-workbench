type Run = {
  id: string;
  levelName?: string | null;
  formulaName?: string | null;
  createdAt: string;
};

export function DiagnosisRunHistory({ runs }: { runs: Run[] }) {
  return (
    <div className="space-y-2 rounded-md border border-gray-200 p-3">
      <p className="font-medium">诊断历史</p>
      {runs.map((run) => (
        <div key={run.id} className="text-sm text-gray-700">
          {run.levelName ?? "-"} / {run.formulaName ?? "-"} / {new Date(run.createdAt).toLocaleString()}
        </div>
      ))}
      {runs.length === 0 ? <p className="text-sm text-gray-500">暂无记录</p> : null}
    </div>
  );
}
