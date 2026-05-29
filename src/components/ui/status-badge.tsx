import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const STATUS_MAP: Record<
  string,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline"; className?: string }
> = {
  done: { label: "完成", variant: "default", className: "bg-emerald-600 hover:bg-emerald-600" },
  success: { label: "成功", variant: "default", className: "bg-emerald-600 hover:bg-emerald-600" },
  failed: { label: "失败", variant: "destructive" },
  error: { label: "错误", variant: "destructive" },
  pending: { label: "待处理", variant: "outline" },
  generating: { label: "生成中", variant: "secondary", className: "bg-blue-50 text-blue-800" },
  prompt_ready: { label: "Prompt 就绪", variant: "secondary" },
  skipped: { label: "已跳过", variant: "outline" },
  draft: { label: "草稿", variant: "outline" },
  needs_review: { label: "待复核", variant: "secondary", className: "bg-amber-50 text-amber-900" },
};

type StatusBadgeProps = {
  status: string;
  className?: string;
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const mapped = STATUS_MAP[status] ?? { label: status, variant: "outline" as const };
  return (
    <Badge variant={mapped.variant} className={cn(mapped.className, className)}>
      {mapped.label}
    </Badge>
  );
}
