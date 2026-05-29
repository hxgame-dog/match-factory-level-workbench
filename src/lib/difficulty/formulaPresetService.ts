import { prisma } from "@/lib/prisma";

import { defaultFormulaConfig } from "./defaultFormulaConfig";

export async function getDefaultFormulaPreset() {
  const preset = await prisma.formulaPreset.findFirst({ where: { isDefault: true } });
  return (
    preset ?? {
      id: "system-default",
      name: "System Default",
      description: "系统默认公式",
      configJson: JSON.stringify(defaultFormulaConfig),
      isDefault: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  );
}
