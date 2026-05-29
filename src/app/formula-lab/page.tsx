import { FormulaLabPage } from "@/components/formula-lab/FormulaLabPage";
import { AppHeader } from "@/components/layout/AppHeader";
import { AppShell } from "@/components/layout/AppShell";
import { getAiStatus } from "@/lib/ai/gemini";
import { diagnoseLevelDifficulty } from "@/lib/difficulty/diagnoseLevelDifficulty";
import { getDefaultFormulaPreset } from "@/lib/difficulty/formulaPresetService";
import { prisma } from "@/lib/prisma";
import { difficultyFormulaConfigSchema } from "@/lib/validators/difficulty";
import { levelConfigSchema } from "@/lib/validators/level";

function playtestConsistency(formulaP: number, passRate: number): string {
  if ((formulaP > 1.4 && passRate < 0.7) || (formulaP < 1.0 && passRate > 0.75)) return "较一致";
  return "可能需复核";
}

export default async function FormulaLabRoute() {
  const defaultPreset = await getDefaultFormulaPreset();
  const defaultConfig = difficultyFormulaConfigSchema.parse(JSON.parse(defaultPreset.configJson));

  const [levels, presets, runs, playtestResults, aiStatus] = await Promise.all([
    prisma.generatedLevel.findMany({
      orderBy: [{ levelIndex: "asc" }, { updatedAt: "desc" }],
      take: 100,
      select: { id: true, name: true, levelIndex: true, levelJson: true },
    }),
    prisma.formulaPreset.findMany({ orderBy: { updatedAt: "desc" } }),
    prisma.difficultyDiagnosisRun.findMany({ orderBy: { createdAt: "desc" }, take: 50 }),
    prisma.playtestLevelResult.findMany({ orderBy: { createdAt: "desc" }, take: 200 }),
    getAiStatus(),
  ]);

  const latestPlaytestByLevel = new Map<string, (typeof playtestResults)[number]>();
  for (const row of playtestResults) {
    if (!latestPlaytestByLevel.has(row.levelId)) latestPlaytestByLevel.set(row.levelId, row);
  }

  const playtestCompare = levels.slice(0, 30).map((row) => {
    const level = levelConfigSchema.parse(JSON.parse(row.levelJson));
    const diagnosis = diagnoseLevelDifficulty({ level, formulaConfig: defaultConfig });
    const playtest = latestPlaytestByLevel.get(row.id);
    const passRate = playtest?.passRate ?? null;
    return {
      id: row.id,
      name: row.name,
      levelIndex: row.levelIndex,
      formulaP: diagnosis.score.P,
      formulaLabel: diagnosis.score.label,
      playtestPassRate: passRate,
      consistency: passRate != null ? playtestConsistency(diagnosis.score.P, passRate) : "无 Playtest 数据",
    };
  });

  return (
    <AppShell>
      <AppHeader
        title="Formula Lab"
        description="配置难度公式、单关诊断、批量回放、异常检测，并与 Playtest 结果对比。"
      />
      <div className="p-6">
        <FormulaLabPage
          levels={levels.map((l) => ({ id: l.id, name: l.name, levelIndex: l.levelIndex }))}
          initialPresets={presets.map((p) => ({
            id: p.id,
            name: p.name,
            description: p.description,
            isDefault: p.isDefault,
            updatedAt: p.updatedAt.toISOString(),
          }))}
          initialRuns={runs.map((r) => ({
            id: r.id,
            levelName: r.levelName,
            formulaName: r.formulaName,
            createdAt: r.createdAt.toISOString(),
          }))}
          playtestCompare={playtestCompare}
          mockMode={aiStatus.mockMode}
          initialPresetId={defaultPreset.id.startsWith("system-default") ? "" : defaultPreset.id}
          initialPresetName={defaultPreset.name}
          initialPresetDescription={defaultPreset.description ?? ""}
          initialFormulaConfig={defaultConfig}
        />
      </div>
    </AppShell>
  );
}
