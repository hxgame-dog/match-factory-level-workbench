import { promises as fs } from "fs";
import path from "path";
import * as XLSX from "xlsx";
import { prisma } from "@/lib/prisma";

function safe(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

export async function exportPlaytestReport(runId: string) {
  const run = await prisma.playtestSimulationRun.findUnique({
    where: { id: runId },
    include: { results: { orderBy: [{ levelIndex: "asc" }, { createdAt: "asc" }] } },
  });
  if (!run) throw new Error("模拟 Run 不存在");
  const summary = run.summaryJson ? JSON.parse(run.summaryJson) : {};
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet([
      {
        RunName: run.name,
        LevelCount: summary.levelCount ?? run.results.length,
        SimulationCount: summary.simulationCountPerLevel ?? 0,
        AvgPassRate: summary.avgPassRate ?? 0,
        AvgCompletionTime: summary.avgCompletionTime ?? 0,
        AvgRemainingTime: summary.avgRemainingTime ?? 0,
        NeedsReviewCount: summary.needsReviewCount ?? 0,
        CriticalIssueCount: 0,
        HighIssueCount: 0,
      },
    ]),
    "Summary",
  );
  const levelRows = run.results.map((r) => {
    const fails = r.failReasonsJson ? JSON.parse(r.failReasonsJson) : [];
    const mainFail = fails[0]?.reason ?? "";
    const issues = r.qaIssuesJson ? JSON.parse(r.qaIssuesJson) : [];
    return {
      LevelIndex: r.levelIndex,
      LevelName: r.levelName,
      PassRate: r.passRate ?? 0,
      FailRate: 1 - (r.passRate ?? 0),
      AvgCompletionTime: r.avgCompletionTime ?? 0,
      AvgRemainingTime: r.avgRemainingTime ?? 0,
      AvgMoves: r.avgMoves ?? 0,
      AvgSlotPressure: r.avgSlotPressure ?? 0,
      MainFailReason: mainFail,
      QAIssueCount: issues.length,
      Status: r.status,
    };
  });
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(levelRows), "Level Results");
  const issueRows = run.results.flatMap((r) => {
    const issues = r.qaIssuesJson
      ? (JSON.parse(r.qaIssuesJson) as Array<{ severity?: string; code?: string; title?: string; detail?: string }>)
      : [];
    return issues.map((i) => ({
      LevelIndex: r.levelIndex,
      LevelName: r.levelName,
      Severity: i.severity,
      Code: i.code,
      Title: i.title,
      Detail: i.detail,
      SuggestedAction: "",
    }));
  });
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(issueRows), "QA Issues");
  const profileRows = run.results.flatMap((r) => {
    const sim = r.simulationJson
      ? (JSON.parse(r.simulationJson) as { profileBreakdown?: Array<{ profileName?: string; passRate?: number; avgCompletionTime?: number; avgRemainingTime?: number; avgMoves?: number; mainFailReason?: string }> })
      : null;
    return (sim?.profileBreakdown ?? []).map((p) => ({
      LevelIndex: r.levelIndex,
      LevelName: r.levelName,
      Profile: p.profileName,
      PassRate: p.passRate,
      AvgCompletionTime: p.avgCompletionTime,
      AvgRemainingTime: p.avgRemainingTime,
      AvgMoves: p.avgMoves,
      MainFailReason: p.mainFailReason ?? "",
    }));
  });
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(profileRows), "Profile Breakdown");
  const jsonReport = {
    schemaVersion: 1,
    type: "playtest_report",
    run: { id: run.id, name: run.name, status: run.status },
    summary,
    results: run.results.map((r) => (r.simulationJson ? JSON.parse(r.simulationJson) : null)),
  };
  const dir = path.join(process.cwd(), "public", "exports");
  await fs.mkdir(dir, { recursive: true });
  const ts = new Date().toISOString().replace(/[:.]/g, "-");
  const xlsxName = `playtest_report_${safe(run.name)}_${ts}.xlsx`;
  const jsonName = `playtest_report_${safe(run.name)}_${ts}.json`;
  await fs.writeFile(path.join(dir, xlsxName), XLSX.write(wb, { type: "buffer", bookType: "xlsx" }));
  await fs.writeFile(path.join(dir, jsonName), JSON.stringify(jsonReport, null, 2));
  return {
    jsonUrl: `/exports/${jsonName}`,
    excelUrl: `/exports/${xlsxName}`,
    report: jsonReport,
  };
}
