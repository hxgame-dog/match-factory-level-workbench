import { zh } from "@/lib/i18n/zh";
import { WorkspacePageLayout } from "@/lib/workspace/pageShell";
import { AnalyticsFeedbackPage } from "@/components/analytics/AnalyticsFeedbackPage";
import { prisma } from "@/lib/prisma";

export default async function AnalyticsFeedbackRoute() {
  const batches = await prisma.analyticsImportBatch.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { rows: { select: { id: true } } },
  });
  return (
    <WorkspacePageLayout
      title={zh.pages.analyticsFeedback.title}
      description={zh.pages.analyticsFeedback.description}
      step="validate"
    >
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
    </WorkspacePageLayout>
  );
}
