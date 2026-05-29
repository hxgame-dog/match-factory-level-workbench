import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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

export function LevelValidationPanel({ validation }: { validation?: Validation }) {
  return (
    <Card className="border border-gray-200 shadow-sm">
      <CardHeader><CardTitle className="text-lg">Validation</CardTitle></CardHeader>
      <CardContent className="space-y-2 text-sm">
        {!validation ? (
          <p className="text-gray-500">暂无校验结果</p>
        ) : (
          <>
            <p>isValid: {validation.isValid ? "true" : "false"}</p>
            {validation.errors.length > 0 ? (
              <Alert variant="destructive"><AlertTitle>Errors</AlertTitle><AlertDescription>{validation.errors.join("；")}</AlertDescription></Alert>
            ) : null}
            {validation.warnings.length > 0 ? (
              <Alert className="border-yellow-200 bg-yellow-50 text-yellow-900"><AlertTitle>Warnings</AlertTitle><AlertDescription>{validation.warnings.join("；")}</AlertDescription></Alert>
            ) : null}
            <p>targetTypeCount: {validation.stats.targetTypeCount}</p>
            <p>targetTotalCount: {validation.stats.targetTotalCount}</p>
            <p>spawnTypeCount: {validation.stats.spawnTypeCount}</p>
            <p>spawnTotalCount: {validation.stats.spawnTotalCount}</p>
            <p>distractorTypeCount: {validation.stats.distractorTypeCount}</p>
            <p>missingAssetCount: {validation.stats.missingAssetCount}</p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
