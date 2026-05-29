export function PlaytestChartEmpty({ message = "暂无数据，请先运行模拟" }: { message?: string }) {
  return (
    <div className="flex h-[220px] items-center justify-center rounded-md border border-dashed border-gray-200 bg-gray-50 text-sm text-gray-500">
      {message}
    </div>
  );
}
