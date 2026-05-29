import { LevelEditorPage } from "@/components/levels/editor/LevelEditorPage";
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
      <AppHeader title="Level Editor" description="打开、预览、编辑、校验并保存标准 LevelConfig JSON。" />
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
