import { promises as fs } from "fs";
import path from "path";
import * as XLSX from "xlsx";

import { prisma } from "@/lib/prisma";
import { summarizeCalibration } from "./compareFormulaPlaytestAnalytics";
import type { LevelFeedbackDiagnosisResult } from "@/types/analytics";

function safe(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

export async function exportAnalyticsFeedbackReport(batchId: string) {
  const batch = await prisma.analyticsImportBatch.findUnique({ where: { id: batchId }, include: { rows: true } });
  if (!batch) throw new Error("数据批次不存在");
  const diagnoses = await prisma.levelFeedbackDiagnosis.findMany({
    where: { analyticsBatchId: batchId },
    orderBy: { createdAt: "desc" },
  });
  const parsedDiagnoses = diagnoses.map((d) => JSON.parse(d.resultJson) as LevelFeedbackDiagnosisResult);
  const proposals = await prisma.levelOptimizationProposal.findMany({ orderBy: { createdAt: "desc" }, take: 200 });
  const calibration = summarizeCalibration(parsedDiagnoses);

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet([
      {
        BatchName: batch.name,
        Source: batch.source ?? "",
        LevelCount: batch.rows.length,
        TotalStarts: batch.rows.reduce((s, r) => s + (r.starts ?? 0), 0),
        AvgPassRate: calibration.avgPassRate ?? "",
        AvgQuitRate: avg(batch.rows.map((r) => r.quitRate)),
        AvgRetryRate: avg(batch.rows.map((r) => r.retryRate)),
        HighSeverityCount: calibration.highSeverityCount,
        FormulaMismatchCount: calibration.formulaMismatchCount,
        PlaytestMismatchCount: calibration.playtestMismatchCount,
      },
    ]),
    "Summary",
  );
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet(
      batch.rows.map((r) => ({
        LevelIndex: r.levelIndex,
        LevelName: r.levelName,
        Starts: r.starts,
        Completes: r.completes,
        Fails: r.fails,
        Quits: r.quits,
        Retries: r.retries,
        PassRate: r.passRate,
        FailRate: r.failRate,
        QuitRate: r.quitRate,
        RetryRate: r.retryRate,
        AvgDurationSec: r.avgDurationSec,
        AvgRemainingTimeSec: r.avgRemainingTimeSec,
        AvgMoves: r.avgMoves,
        AvgBoostersUsed: r.avgBoostersUsed,
        AvgHintsUsed: r.avgHintsUsed,
        AvgShuffleUsed: r.avgShuffleUsed,
      })),
    ),
    "Level Metrics",
  );
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet(
      parsedDiagnoses.map((d) => ({
        LevelIndex: d.levelIndex,
        LevelName: d.levelName,
        FormulaP: d.formula?.P,
        FormulaLabel: d.formula?.label,
        PlaytestPassRate: d.playtest?.passRate,
        ActualPassRate: d.analytics.passRate,
        FormulaMismatch: d.comparison.formulaVsAnalytics?.mismatchLevel ?? "none",
        PlaytestMismatch: d.comparison.playtestVsAnalytics?.mismatchLevel ?? "none",
        IssueTags: d.issueTags.join("|"),
        Severity: d.severity,
        Suggestions: d.suggestions.map((s) => s.action).join("|"),
      })),
    ),
    "Feedback Diagnosis",
  );
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet(
      proposals.map((p) => {
        const diff = p.diffJson ? (JSON.parse(p.diffJson) as Array<{ path: string }>) : [];
        return {
          LevelIndex: p.levelIndex,
          LevelName: p.levelName,
          ProposalName: p.proposalName,
          Status: p.status,
          DiffSummary: diff.map((x) => x.path).join("|"),
        };
      }),
    ),
    "Optimization Proposals",
  );

  const jsonReport = {
    schemaVersion: 1,
    type: "analytics_feedback_report",
    batch: { id: batch.id, name: batch.name, source: batch.source },
    summary: calibration,
    diagnoses: parsedDiagnoses,
  };

  const dir = path.join(process.cwd(), "public", "exports");
  await fs.mkdir(dir, { recursive: true });
  const ts = new Date().toISOString().replace(/[:.]/g, "-");
  const xlsxName = `analytics_feedback_report_${safe(batch.name)}_${ts}.xlsx`;
  const jsonName = `analytics_feedback_report_${safe(batch.name)}_${ts}.json`;
  await fs.writeFile(path.join(dir, xlsxName), XLSX.write(wb, { type: "buffer", bookType: "xlsx" }));
  await fs.writeFile(path.join(dir, jsonName), JSON.stringify(jsonReport, null, 2));
  return { excelUrl: `/exports/${xlsxName}`, jsonUrl: `/exports/${jsonName}`, report: jsonReport };
}

function avg(list: Array<number | null | undefined>): number | "" {
  const valid = list.filter((v): v is number => typeof v === "number");
  if (!valid.length) return "";
  return Number((valid.reduce((a, b) => a + b, 0) / valid.length).toFixed(4));
}
