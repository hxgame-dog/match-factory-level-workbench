import { AppHeader } from "@/components/layout/AppHeader";
import { AppShell } from "@/components/layout/AppShell";
import { AnalyticsFeedbackPage } from "@/components/analytics/AnalyticsFeedbackPage";
import { prisma } from "@/lib/prisma";

export default async function AnalyticsFeedbackRoute() {
  const batches = await prisma.analyticsImportBatch.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { rows: { select: { id: true } } },
  });
  return (
    <AppShell>
      <AppHeader title="Analytics Feedback" description="导入玩家数据、诊断真实表现、对比公式和模拟、生成优化建议。" />
      <div className="p-6">
        <AnalyticsFeedbackPage
          batches={batches.map((b) => ({
            id: b.id,
            name: b.name,
            source: b.source,
            status: b.status,
            rowCount: b.rows.length,
            createdAt: b.createdAt.toISOString(),
          }))}
        />
      </div>
    </AppShell>
  );
}
