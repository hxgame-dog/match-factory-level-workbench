import { prisma } from "@/lib/prisma";
import { formulaPresetImportSchema } from "@/lib/validators/pipeline";

export async function importFormulaPreset(input: { fileContent: string; dryRun: boolean }) {
  const parsed = JSON.parse(input.fileContent) as unknown;
  const payload = formulaPresetImportSchema.parse(parsed);
  const preset = "preset" in payload ? payload.preset : payload;
  if (!input.dryRun) {
    await prisma.formulaPreset.create({
      data: {
        name: preset.name,
        description: preset.description,
        configJson: preset.configJson,
      },
    });
  }
  return {
    success: true,
    summary: input.dryRun ? "FormulaPreset Dry Run 通过" : "FormulaPreset 导入成功",
    presetName: preset.name,
  };
}
