"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function PackageHistory({
  packages,
  onOpen,
}: {
  packages: Array<{ id: string; name: string; version: string; status: string; exportPath?: string | null }>;
  onOpen: (id: string) => void;
}) {
  return (
    <Card className="border border-gray-200">
      <CardHeader><CardTitle className="text-sm">Package History</CardTitle></CardHeader>
      <CardContent className="space-y-2">
        {packages.map((pkg) => (
          <div key={pkg.id} className="flex items-center justify-between rounded border border-gray-200 p-2 text-xs">
            <div>
              <p>{pkg.name} · {pkg.version}</p>
              <p className="text-gray-500">{pkg.status}</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpen(pkg.id)}>Manifest</Button>
              {pkg.exportPath ? <a href={pkg.exportPath} className="text-blue-600 hover:underline">下载</a> : null}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
