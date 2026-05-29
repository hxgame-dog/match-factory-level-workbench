import { zh } from "@/lib/i18n/zh";
import { AppHeader } from "@/components/layout/AppHeader";
import { AppShell } from "@/components/layout/AppShell";
import { AutoLevelGeneratorPage } from "@/components/auto-level/AutoLevelGeneratorPage";
import { prisma } from "@/lib/prisma";

export default async function AutoLevelGeneratorRoute() {
  const [levels, presets, runs] = await Promise.all([
    prisma.generatedLevel.findMany({ orderBy: [{ levelIndex: "desc" }, { createdAt: "desc" }], take: 100 }),
    prisma.formulaPreset.findMany({ orderBy: [{ isDefault: "desc" }, { updatedAt: "desc" }], take: 50 }),
    prisma.autoLevelGenerationRun.findMany({ orderBy: { createdAt: "desc" }, take: 20 }),
  ]);
  return (
    <AppShell>
      <AppHeader title={zh.pages.autoLevelGenerator.title} description={zh.pages.autoLevelGenerator.description} />
      <div className="p-6">
        <AutoLevelGeneratorPage
          levels={levels.map((row) => ({ id: row.id, name: row.name, levelIndex: row.levelIndex ?? 0, status: row.status }))}
          presets={presets.map((row) => ({ id: row.id, name: row.name, isDefault: row.isDefault }))}
          initialRuns={runs.map((row) => ({
            id: row.id,
            name: row.name,
            status: row.status,
            generateCount: row.generateCount,
            createdAt: row.createdAt.toISOString(),
          }))}
        />
      </div>
    </AppShell>
  );
}
