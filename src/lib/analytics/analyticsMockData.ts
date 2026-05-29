import { SeededRandom } from "@/lib/playtest/random";
import type { StandardLevelAnalyticsRow } from "@/types/analytics";

type MockLevelInput = {
  levelId: string;
  levelIndex?: number | null;
  levelName: string;
  formulaP?: number;
  playtestPassRate?: number;
};

type Mode = "mixed" | "hard" | "easy";

export function generateMockAnalytics(input: { levels: MockLevelInput[]; mode: Mode; seed?: string }): StandardLevelAnalyticsRow[] {
  const rng = new SeededRandom(input.seed ?? `mock_${input.mode}`);
  return input.levels.map((level) => {
    const P = level.formulaP ?? 1;
    // P 越高 passRate 越低，加入噪音
    let basePass = Math.max(0.1, Math.min(0.97, 1.15 - P * 0.45));
    if (input.mode === "hard") basePass = Math.max(0.1, basePass - 0.25);
    if (input.mode === "easy") basePass = Math.min(0.97, basePass + 0.2);
    const noise = (rng.next() - 0.5) * 0.3; // ±15%
    const passRate = Math.max(0.05, Math.min(0.98, basePass + noise));

    const starts = 50 + Math.floor(rng.next() * 600);
    const completes = Math.round(starts * passRate);
    const fails = Math.round((starts - completes) * (0.55 + rng.next() * 0.25));
    const quits = Math.max(0, starts - completes - fails);
    const retries = Math.round(starts * (0.2 + (1 - passRate) * 0.4));
    const avgDurationSec = Math.round(60 + P * 50 + rng.next() * 40);
    const avgRemainingTimeSec = Math.max(0, Math.round(30 - P * 12 + rng.next() * 20));
    const avgMoves = Math.round(20 + P * 12 + rng.next() * 10);
    const avgBoostersUsed = Number((Math.max(0, (1 - passRate) * 2.5 + rng.next() * 0.5)).toFixed(2));

    return {
      levelId: level.levelId,
      levelIndex: level.levelIndex ?? undefined,
      levelName: level.levelName,
      users: starts,
      starts,
      completes,
      fails,
      quits,
      retries,
      passRate: Number(passRate.toFixed(4)),
      failRate: Number((fails / starts).toFixed(4)),
      quitRate: Number((quits / starts).toFixed(4)),
      retryRate: Number((retries / starts).toFixed(4)),
      avgDurationSec,
      avgRemainingTimeSec,
      avgMoves,
      avgBoostersUsed,
      avgHintsUsed: Number((avgBoostersUsed * 0.5).toFixed(2)),
      avgShuffleUsed: Number((avgBoostersUsed * 0.3).toFixed(2)),
      revenue: Number((rng.next() * 50).toFixed(2)),
      adImpressions: Math.round(starts * (0.5 + rng.next())),
      iapPurchases: Math.round(starts * rng.next() * 0.05),
    };
  });
}
