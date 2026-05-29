"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function AdapterPreviewPanel({
  onUnity,
  onLvl,
  onRuntime,
}: {
  onUnity: () => void;
  onLvl: () => void;
  onRuntime: () => void;
}) {
  return (
    <Card className="border border-gray-200">
      <CardHeader><CardTitle className="text-sm">Adapter Preview</CardTitle></CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={onUnity}>Unity JSON Preview</Button>
        <Button variant="outline" onClick={onLvl}>.lvl Export Preview</Button>
        <Button variant="outline" onClick={onRuntime}>Runtime Config Preview</Button>
      </CardContent>
    </Card>
  );
}
