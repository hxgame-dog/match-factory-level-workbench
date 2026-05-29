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
    <Card className="flex h-full flex-col border border-gray-200 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="font-serif text-base text-gray-900">{title}</CardTitle>
        <p className="text-xs text-gray-500">{description}</p>
      </CardHeader>
      <CardContent className="mt-auto space-y-3">
        <ul className="space-y-1 text-sm text-gray-600">
          {stats.map((line) => (
            <li key={line.label} className="flex justify-between gap-2">
              <span>{line.label}</span>
              <span className="font-medium text-gray-900">{line.value}</span>
            </li>
          ))}
        </ul>
        <Link href={href} className="inline-flex text-sm text-blue-600 hover:underline">
          进入模块 →
        </Link>
      </CardContent>
    </Card>
  );
}
