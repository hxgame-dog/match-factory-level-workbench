import JSZip from "jszip";

type ExportCandidate = {
  id: string;
  targetLevelIndex: number;
  candidateRank: number;
  levelJson: string;
};

export async function exportAutoLevelsZip(input: {
  runId: string;
  summary: unknown;
  targetCurve: unknown;
  sourceAnalysis: unknown;
  candidates: ExportCandidate[];
}) {
  const zip = new JSZip();
  const levels = zip.folder("levels");
  if (!levels) throw new Error("无法创建 ZIP 目录");
  input.candidates.forEach((c) => {
    const level = JSON.parse(c.levelJson);
    levels.file(
      `level_${c.targetLevelIndex}_candidate_${c.candidateRank}.json`,
      JSON.stringify(
        {
          schemaVersion: 1,
          type: "match3d_level_config",
          level,
        },
        null,
        2,
      ),
    );
  });
  zip.file("run_summary.json", JSON.stringify(input.summary, null, 2));
  zip.file("target_curve.json", JSON.stringify(input.targetCurve, null, 2));
  zip.file("source_analysis.json", JSON.stringify(input.sourceAnalysis, null, 2));
  return zip.generateAsync({ type: "nodebuffer" });
}
