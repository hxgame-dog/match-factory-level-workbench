import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { PlaytestCompareRow } from "@/features/formula-lab/types";

export function FormulaPlaytestCompareTable({ rows }: { rows: PlaytestCompareRow[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">公式 vs 试玩对比</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto text-xs">
          <table className="w-full min-w-[640px] border-collapse">
            <thead className="sticky top-0 bg-card">
              <tr className="border-b border-border">
                <th className="py-2 text-left font-medium text-foreground">关卡</th>
                <th className="py-2 text-left font-medium text-foreground">Formula P</th>
                <th className="py-2 text-left font-medium text-foreground">难度标签</th>
                <th className="py-2 text-left font-medium text-foreground">Playtest 通关率</th>
                <th className="py-2 text-left font-medium text-foreground">一致性</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-border/60">
                  <td className="py-2">
                    {row.levelIndex ?? "-"} · {row.name}
                  </td>
                  <td className="py-2">{row.formulaP.toFixed(3)}</td>
                  <td className="py-2">{row.formulaLabel}</td>
                  <td className="py-2">
                    {row.playtestPassRate != null ? `${Math.round(row.playtestPassRate * 100)}%` : "-"}
                  </td>
                  <td className="py-2">{row.consistency}</td>
                </tr>
              ))}
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-4 text-center text-muted-foreground">
                    暂无关卡或 Playtest 数据
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
