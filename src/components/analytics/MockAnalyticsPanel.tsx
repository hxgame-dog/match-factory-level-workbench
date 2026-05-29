"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function MockAnalyticsPanel({ onGenerate }: { onGenerate: (mode: "mixed" | "hard" | "easy") => void }) {
  return (
    <Card className="border border-gray-200">
      <CardHeader><CardTitle className="text-sm">Mock Analytics Dataset</CardTitle></CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={() => onGenerate("mixed")}>Generate Mock Mixed</Button>
        <Button variant="outline" onClick={() => onGenerate("hard")}>Generate Mock Hard</Button>
        <Button variant="outline" onClick={() => onGenerate("easy")}>Generate Mock Easy</Button>
      </CardContent>
    </Card>
  );
}
