import { cn } from "@/lib/utils";

type Props = {
  title: string;
  description?: string;
  current: number;
  total: number;
  className?: string;
  /** 不确定总量时显示脉动条 */
  indeterminate?: boolean;
};

export function TaskProgressCard({ title, description, current, total, className, indeterminate }: Props) {
  const pct = total > 0 ? Math.min(100, Math.round((current / total) * 100)) : 0;

  return (
    <div className={cn("rounded-lg border border-border bg-card px-4 py-3", className)}>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-sm">
        <span className="font-medium text-foreground">{title}</span>
        {!indeterminate && total > 0 ? (
          <span className="text-muted-foreground">
            {current} / {total}（{pct}%）
          </span>
        ) : null}
      </div>
      {description ? <p className="mb-2 text-xs text-muted-foreground">{description}</p> : null}
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        {indeterminate ? (
          <div className="h-full w-1/3 animate-pulse rounded-full bg-primary" />
        ) : (
          <div className="h-full bg-primary transition-all duration-300" style={{ width: `${pct}%` }} />
        )}
      </div>
    </div>
  );
}
