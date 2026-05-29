import { LevelEditorPage } from "@/components/levels/editor/LevelEditorPage";
import { zh } from "@/lib/i18n/zh";
import { AppHeader } from "@/components/layout/AppHeader";
import { AppShell } from "@/components/layout/AppShell";
import { prisma } from "@/lib/prisma";

export default async function LevelEditor() {
  const levels = await prisma.generatedLevel.findMany({
    orderBy: { updatedAt: "desc" },
    take: 50,
  });
  return (
    <AppShell>
      <AppHeader title={zh.pages.levelEditor.title} description={zh.pages.levelEditor.description} />
      <div className="p-6">
        <LevelEditorPage
          initialLevels={levels.map((row) => ({
            id: row.id,
            name: row.name,
            levelIndex: row.levelIndex,
            theme: row.theme,
            targetDifficulty: row.targetDifficulty,
            status: row.status,
            createdAt: row.createdAt.toISOString(),
            updatedAt: row.updatedAt.toISOString(),
          }))}
        />
      </div>
    </AppShell>
  );
}
