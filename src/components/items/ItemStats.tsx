import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type ItemStatsProps = {
  total: number;
};

export function ItemStats({ total }: ItemStatsProps) {
  return (
    <Card >
      <CardHeader>
        <CardTitle className="text-lg">道具统计</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-semibold text-foreground">{total}</p>
        <p className="text-sm text-muted-foreground">当前数据库道具总量</p>
      </CardContent>
    </Card>
  );
}
