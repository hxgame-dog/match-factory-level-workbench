import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type ItemStatsProps = {
  total: number;
};

export function ItemStats({ total }: ItemStatsProps) {
  return (
    <Card className="border border-gray-200 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg">道具统计</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-semibold text-gray-900">{total}</p>
        <p className="text-sm text-gray-500">当前数据库道具总量</p>
      </CardContent>
    </Card>
  );
}
