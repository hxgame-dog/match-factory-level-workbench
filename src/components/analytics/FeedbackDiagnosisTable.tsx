"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { LevelFeedbackDiagnosisResult } from "@/types/analytics";

type Row = LevelFeedbackDiagnosisResult & { matched?: boolean; matchedLevelId?: string };

export function FeedbackDiagnosisTable({
  rows,
  onSelect,
}: {
  rows: Row[];
  onSelect: (row: Row) => void;
}) {
  if (!rows.length) return null;
  return (
    <Card className="border border-gray-200">
      <CardHeader><CardTitle className="text-sm">Feedback Diagnosis Table</CardTitle></CardHeader>
      <CardContent className="overflow-x-auto text-xs">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b text-left">
              <th className="py-1">Level</th>
              <th className="py-1">Starts</th>
              <th className="py-1">PassRate</th>
              <th className="py-1">QuitRate</th>
              <th className="py-1">RetryRate</th>
              <th className="py-1">Formula P</th>
              <th className="py-1">Playtest</th>
              <th className="py-1">Severity</th>
              <th className="py-1">Tags</th>
              <th className="py-1"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={`${r.levelId ?? r.levelName ?? i}`} className="border-b">
                <td className="py-1">{r.levelIndex ?? "-"} · {r.levelName ?? "未匹配"}</td>
                <td className="py-1">{r.dataQuality.starts ?? "-"}</td>
                <td className="py-1">{r.analytics.passRate !== undefined ? `${Math.round(r.analytics.passRate * 100)}%` : "-"}</td>
                <td className="py-1">{r.analytics.quitRate !== undefined ? `${Math.round(r.analytics.quitRate * 100)}%` : "-"}</td>
                <td className="py-1">{r.analytics.retryRate !== undefined ? `${Math.round(r.analytics.retryRate * 100)}%` : "-"}</td>
                <td className="py-1">{r.formula?.P?.toFixed(2) ?? "-"}</td>
                <td className="py-1">{r.playtest?.passRate !== undefined ? `${Math.round(r.playtest.passRate * 100)}%` : "-"}</td>
                <td className="py-1">
                  <span className={severityClass(r.severity)}>{r.severity}</span>
                </td>
                <td className="py-1">{r.issueTags.slice(0, 2).join(",")}</td>
                <td className="py-1"><Button variant="outline" onClick={() => onSelect(r)}>Detail</Button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}

function severityClass(severity: string) {
  if (severity === "critical") return "rounded bg-red-100 px-1 text-red-700";
  if (severity === "high") return "rounded bg-orange-100 px-1 text-orange-700";
  if (severity === "medium") return "rounded bg-amber-100 px-1 text-amber-700";
  if (severity === "low") return "rounded bg-gray-100 px-1 text-gray-700";
  return "rounded bg-green-100 px-1 text-green-700";
}
