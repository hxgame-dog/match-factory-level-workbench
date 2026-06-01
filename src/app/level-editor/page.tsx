import { LevelEditorPage } from "@/features/level-editor";
import { WorkspacePageLayout } from "@/features/workspace";
import { zh } from "@/lib/i18n/zh";
import { prisma } from "@/lib/prisma";

export default async function LevelEditor() {
  const levels = await prisma.generatedLevel.findMany({
    orderBy: { updatedAt: "desc" },
    take: 50,
  });
  return (
    <WorkspacePageLayout
      title={zh.pages.levelEditor.title}
      description={zh.pages.levelEditor.description}
      step="levels"
    >
      <LevelEditorPage
        initialLevels={levels.map((row) => ({
          id: row.id,
          name: row.name,
          levelIndex: row.levelIndex,
          theme: row.theme,
          targetDifficulty: row.targetDifficulty,
          status: row.status,
          itemSetId: row.itemSetId,
          createdAt: row.createdAt.toISOString(),
          updatedAt: row.updatedAt.toISOString(),
        }))}
      />
    </WorkspacePageLayout>
  );
}
