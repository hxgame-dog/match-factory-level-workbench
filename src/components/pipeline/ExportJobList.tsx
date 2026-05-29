"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function ExportJobList({ jobs }: { jobs: Array<{ id: string; type: string; status: string; name: string; filePath?: string | null }> }) {
  return (
    <Card className="border border-gray-200">
      <CardHeader><CardTitle className="text-sm">Export Jobs</CardTitle></CardHeader>
      <CardContent className="space-y-2 text-xs">
        {jobs.map((job) => (
          <div key={job.id} className="rounded border border-gray-200 p-2">
            <p>{job.type} · {job.name}</p>
            <p className="text-gray-500">{job.status}</p>
            {job.filePath ? <a className="text-blue-600 hover:underline" href={job.filePath}>下载</a> : null}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
