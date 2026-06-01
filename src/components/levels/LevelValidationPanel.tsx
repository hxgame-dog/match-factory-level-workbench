import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Validation = {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  stats: {
    targetTypeCount: number;
    targetTotalCount: number;
    spawnTypeCount: number;
    spawnTotalCount: number;
    distractorTypeCount: number;
    missingAssetCount: number;
  };
};

export function LevelValidationPanel({ validation }: { validation: Validation }) {
  return (
    <Card >
      <CardHeader><CardTitle className="text-base">Level Validation</CardTitle></CardHeader>
      <CardContent className="space-y-1 text-sm">
        <p>状态: {validation.isValid ? "通过" : "未通过"}</p>
        <p>errors: {validation.errors.join("；") || "无"}</p>
        <p>warnings: {validation.warnings.join("；") || "无"}</p>
        <p>target 类型: {validation.stats.targetTypeCount} / target 总数: {validation.stats.targetTotalCount}</p>
        <p>spawn 类型: {validation.stats.spawnTypeCount} / spawn 总数: {validation.stats.spawnTotalCount}</p>
      </CardContent>
    </Card>
  );
}
