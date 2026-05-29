import { zh } from "@/lib/i18n/zh";
import { AppHeader } from "@/components/layout/AppHeader";
import { AppShell } from "@/components/layout/AppShell";
import { PageContent } from "@/components/layout/PageContent";
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
      <AppHeader title={zh.pages.analyticsFeedback.title} description={zh.pages.analyticsFeedback.description} />
      <PageContent>
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
      </PageContent>
    </AppShell>
  );
}
