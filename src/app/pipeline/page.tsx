import { zh } from "@/lib/i18n/zh";
import { AppHeader } from "@/components/layout/AppHeader";
import { AppShell } from "@/components/layout/AppShell";
import { PipelinePage } from "@/components/pipeline/PipelinePage";
import { prisma } from "@/lib/prisma";

export default async function PipelineRoute() {
  const [levels, packages, exportJobs] = await Promise.all([
    prisma.generatedLevel.findMany({ orderBy: [{ levelIndex: "asc" }, { createdAt: "desc" }], take: 200 }),
    prisma.productionPackage.findMany({ orderBy: { createdAt: "desc" }, take: 50 }),
    prisma.exportJob.findMany({ orderBy: { createdAt: "desc" }, take: 50 }),
  ]);
  return (
    <AppShell>
      <AppHeader title={zh.pages.pipeline.title} description={zh.pages.pipeline.description} />
      <div className="p-6">
        <PipelinePage
          levels={levels.map((l) => ({ id: l.id, name: l.name }))}
          packages={packages.map((p) => ({ id: p.id, name: p.name, version: p.version, status: p.status, exportPath: p.exportPath }))}
          exportJobs={exportJobs.map((j) => ({ id: j.id, type: j.type, status: j.status, name: j.name, filePath: j.filePath }))}
        />
      </div>
    </AppShell>
  );
}
