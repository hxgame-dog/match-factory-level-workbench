"use client";

import { Button } from "@/components/ui/button";

export function PlaytestReportExportButton({ onClick }: { onClick: () => void }) {
  return <Button variant="outline" onClick={onClick}>导出 Playtest 报告</Button>;
}
