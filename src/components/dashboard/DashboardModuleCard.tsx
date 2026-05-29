import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export type DashboardStatLine = { label: string; value: string };

export function DashboardModuleCard({
  title,
  description,
  href,
  stats,
}: {
  title: string;
  description: string;
  href: string;
  stats: DashboardStatLine[];
}) {
  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="font-serif text-base">{title}</CardTitle>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardHeader>
      <CardContent className="mt-auto space-y-3">
        <dl className="space-y-2 text-sm">
          {stats.map((line) => (
            <div key={line.label} className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 gap-y-0.5">
              <dt className="text-muted-foreground">{line.label}</dt>
              <dd className="text-right font-medium text-foreground">{line.value}</dd>
            </div>
          ))}
        </dl>
        <Link href={href} className="inline-flex text-sm text-primary hover:underline">
          进入模块 →
        </Link>
      </CardContent>
    </Card>
  );
}
