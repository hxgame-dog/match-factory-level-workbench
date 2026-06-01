export type PlaytestCompareRow = {
  id: string;
  name: string;
  levelIndex?: number | null;
  formulaP: number;
  formulaLabel: string;
  playtestPassRate: number | null;
  consistency: string;
};

export type BatchReplaySummary = {
  count: number;
  avgP: number;
  minP: number;
  maxP: number;
};
