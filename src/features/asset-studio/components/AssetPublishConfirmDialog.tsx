"use client";

import { Button } from "@/components/ui/button";

type Props = {
  open: boolean;
  batchName: string;
  stats: {
    total: number;
    done: number;
    failed: number;
    missing: number;
    coveragePercent: number;
  };
  onCancel: () => void;
  onConfirm: () => void;
};

export function AssetPublishConfirmDialog(props: Props) {
  if (!props.open) return null;

  const hasRisk = props.stats.missing > 0 || props.stats.failed > 0;
  const riskLines: string[] = [];
  if (props.stats.missing > 0) riskLines.push(`缺图 ${props.stats.missing} 张`);
  if (props.stats.failed > 0) riskLines.push(`失败 ${props.stats.failed} 张`);
  if (props.stats.coveragePercent < 100) {
    riskLines.push(`覆盖率 ${props.stats.coveragePercent}%（未满）`);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <div className="w-full max-w-md rounded-md border border-border bg-card p-4 shadow-sm">
        <h3 className="text-lg font-semibold text-foreground">确认发布到关卡生成器</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          将使用批次「{props.batchName}」作为关卡生成器的默认资源批次。
        </p>
        <ul className="mt-3 space-y-1 text-sm text-foreground">
          <li>总资源：{props.stats.total}</li>
          <li>成功：{props.stats.done}</li>
          <li>失败：{props.stats.failed}</li>
          <li>缺图：{props.stats.missing}</li>
          <li>覆盖率：{props.stats.coveragePercent}%</li>
        </ul>
        {hasRisk ? (
          <p className="mt-3 rounded-md border border-border bg-muted px-3 py-2 text-sm text-foreground">
            存在风险：{riskLines.join("、")}。建议先补齐后再发布；也可选择继续发布。
          </p>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">资源批次已就绪，可安全发布。</p>
        )}
        <div className="mt-4 flex flex-wrap gap-2">
          <Button onClick={props.onConfirm}>{hasRisk ? "仍要发布" : "确认发布"}</Button>
          <Button variant="outline" onClick={props.onCancel}>
            取消
          </Button>
        </div>
      </div>
    </div>
  );
}
