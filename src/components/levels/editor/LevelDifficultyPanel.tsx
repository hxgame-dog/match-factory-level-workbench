import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Difficulty = {
  itemComplexity: number;
  ruleDifficulty: number;
  timePressure: number;
  finalDifficulty: number;
  label: "easy" | "normal" | "hard" | "expert";
  warnings: string[];
  suggestions: string[];
};

export function LevelDifficultyPanel({ difficulty }: { difficulty?: Difficulty }) {
  return (
    <Card>
      <CardHeader><CardTitle className="text-lg">Difficulty</CardTitle></CardHeader>
      <CardContent className="space-y-2 text-sm">
        {!difficulty ? (
          <p className="text-muted-foreground">暂无难度估算</p>
        ) : (
          <>
            <Badge>{difficulty.label}</Badge>
            <p>itemComplexity: {difficulty.itemComplexity.toFixed(3)}</p>
            <p>ruleDifficulty: {difficulty.ruleDifficulty.toFixed(3)}</p>
            <p>timePressure: {difficulty.timePressure.toFixed(3)}</p>
            <p>finalDifficulty: {difficulty.finalDifficulty.toFixed(3)}</p>
            <p className="text-amber-700">{difficulty.warnings.join("；")}</p>
            <p className="text-blue-700">{difficulty.suggestions.join("；")}</p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
