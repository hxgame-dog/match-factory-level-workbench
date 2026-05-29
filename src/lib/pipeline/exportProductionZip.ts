import { promises as fs } from "fs";
import path from "path";
import JSZip from "jszip";
import { diagnoseLevelDifficulty } from "@/lib/difficulty/diagnoseLevelDifficulty";
import { defaultFormulaConfig } from "@/lib/difficulty/defaultFormulaConfig";
import { buildLvlPreview } from "@/lib/pipeline/adapterPreview/lvlPreview";
import { buildRuntimeConfigPreview } from "@/lib/pipeline/adapterPreview/runtimeConfigPreview";
import { buildUnityPreview } from "@/lib/pipeline/adapterPreview/unityPreview";
import type { LevelConfig } from "@/types/level";
import type { ProductionManifest, PackageValidationResult } from "@/types/pipeline";
import * as XLSX from "xlsx";

function safe(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

export async function exportProductionZip(input: {
  manifest: ProductionManifest;
  levels: LevelConfig[];
  validation: PackageValidationResult;
  assets: Array<{ name: string; imageUrl?: string | null; prompt?: string | null; id: string }>;
  formulaJson?: string;
  includeAdapterPreviews: boolean;
  playtestReport?: unknown[];
  analyticsReport?: unknown[];
  optimizationProposals?: unknown[];
}) {
  const zip = new JSZip();
  zip.file("manifest.json", JSON.stringify(input.manifest, null, 2));
  zip.file("README.md", `# ${input.manifest.name}\n\nVersion: ${input.manifest.version}\n`);
  const levelsFolder = zip.folder("levels");
  input.levels.forEach((level, idx) => {
    levelsFolder?.file(
      `level_${String(level.levelIndex ?? idx + 1).padStart(3, "0")}.json`,
      JSON.stringify({ schemaVersion: 1, type: "match3d_level_config", level }, null, 2),
    );
  });
  const assetsFolder = zip.folder("assets")?.folder("images");
  const mapping = input.assets.map((a) => ({ id: a.id, name: a.name, imageUrl: a.imageUrl ?? undefined }));
  for (const asset of input.assets) {
    if (!asset.imageUrl) continue;
    const relative = asset.imageUrl.startsWith("/") ? asset.imageUrl.slice(1) : asset.imageUrl;
    const localPath = path.join(process.cwd(), "public", relative);
    try {
      const file = await fs.readFile(localPath);
      assetsFolder?.file(`${safe(asset.name)}.svg`, file);
    } catch {
      // 忽略不存在文件，validation 会提示
    }
  }
  zip.file("assets/mapping.json", JSON.stringify(mapping, null, 2));
  zip.file("assets/prompts.json", JSON.stringify(input.assets.map((a) => ({ id: a.id, name: a.name, prompt: a.prompt ?? "" })), null, 2));
  const diffReport = input.levels.map((level) => diagnoseLevelDifficulty({ level, formulaConfig: defaultFormulaConfig }));
  zip.file("reports/difficulty_report.json", JSON.stringify(diffReport, null, 2));
  zip.file("reports/validation_report.json", JSON.stringify(input.validation, null, 2));
  zip.file("reports/anomaly_report.json", JSON.stringify({ schemaVersion: 1, anomalies: [] }, null, 2));
  if (input.playtestReport?.length) {
    zip.file("reports/playtest_report.json", JSON.stringify({ schemaVersion: 1, type: "playtest_report", results: input.playtestReport }, null, 2));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(
        input.playtestReport.map((r) => {
          const row = r as {
            levelIndex?: number;
            levelName?: string;
            metrics?: {
              passRate?: number;
              avgCompletionTime?: number;
              avgRemainingTime?: number;
              avgSlotPressure?: number;
            };
            status?: string;
          };
          return {
            LevelIndex: row.levelIndex,
            LevelName: row.levelName,
            PassRate: row.metrics?.passRate,
            AvgCompletionTime: row.metrics?.avgCompletionTime,
            AvgRemainingTime: row.metrics?.avgRemainingTime,
            AvgSlotPressure: row.metrics?.avgSlotPressure,
            Status: row.status,
          };
        }),
      ),
      "Playtest",
    );
    zip.file("reports/playtest_report.xlsx", XLSX.write(wb, { type: "buffer", bookType: "xlsx" }));
  }
  if (input.analyticsReport?.length) {
    zip.file(
      "reports/analytics_feedback_report.json",
      JSON.stringify({ schemaVersion: 1, type: "analytics_feedback_report", diagnoses: input.analyticsReport }, null, 2),
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(
        input.analyticsReport.map((r) => {
          const row = r as {
            levelIndex?: number;
            levelName?: string;
            analytics?: { passRate?: number; quitRate?: number; retryRate?: number };
            formula?: { P?: number };
            severity?: string;
            issueTags?: string[];
          };
          return {
            LevelIndex: row.levelIndex,
            LevelName: row.levelName,
            ActualPassRate: row.analytics?.passRate,
            QuitRate: row.analytics?.quitRate,
            RetryRate: row.analytics?.retryRate,
            FormulaP: row.formula?.P,
            Severity: row.severity,
            IssueTags: (row.issueTags ?? []).join("|"),
          };
        }),
      ),
      "Analytics",
    );
    zip.file("reports/analytics_feedback_report.xlsx", XLSX.write(wb, { type: "buffer", bookType: "xlsx" }));
  }
  if (input.optimizationProposals?.length) {
    zip.file("reports/optimization_proposals.json", JSON.stringify({ schemaVersion: 1, proposals: input.optimizationProposals }, null, 2));
  }
  if (input.formulaJson) {
    zip.file("formula/formula_preset.json", input.formulaJson);
  }
  zip.file("auto_runs/auto_level_run_summary.json", JSON.stringify({ schemaVersion: 1, runs: [] }, null, 2));
  if (input.includeAdapterPreviews) {
    const pMap = new Map(diffReport.map((d) => [d.levelId ?? "", d.score.P]));
    zip.file("adapters/unity_level_export_preview.json", JSON.stringify(buildUnityPreview(input.levels), null, 2));
    zip.file("adapters/lvl_export_preview.json", JSON.stringify(buildLvlPreview(input.levels, pMap), null, 2));
    zip.file("adapters/runtime_config_preview.json", JSON.stringify(buildRuntimeConfigPreview(input.levels), null, 2));
  }
  const output = await zip.generateAsync({ type: "nodebuffer" });
  const dir = path.join(process.cwd(), "public", "exports");
  await fs.mkdir(dir, { recursive: true });
  const fileName = `production_package_${safe(input.manifest.name)}_${safe(input.manifest.version)}.zip`;
  const full = path.join(dir, fileName);
  await fs.writeFile(full, output);
  return { fileName, filePath: `/exports/${fileName}` };
}
