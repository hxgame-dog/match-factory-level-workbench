export function PlaytestChartEmpty({ message = "暂无数据，请先运行模拟" }: { message?: string }) {
  return (
    <div className="flex h-[220px] items-center justify-center rounded-md border border-dashed border-border bg-muted text-sm text-muted-foreground">
      {message}
    </div>
  );
}
