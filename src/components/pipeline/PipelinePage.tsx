"use client";

import { useState } from "react";
import type { PackageValidationResult } from "@/types/pipeline";
import { ProductionPackageBuilder } from "./ProductionPackageBuilder";
import { PackageValidationPanel } from "./PackageValidationPanel";
import { ImportCenter } from "./ImportCenter";
import { SnapshotCenter } from "./SnapshotCenter";
import { AdapterPreviewPanel } from "./AdapterPreviewPanel";
import { ExportJobList } from "./ExportJobList";
import { PackageHistory } from "./PackageHistory";
import { ManifestPreviewDialog } from "./ManifestPreviewDialog";

export function PipelinePage({
  levels,
  packages: initPackages,
  exportJobs: initJobs,
}: {
  levels: Array<{ id: string; name: string }>;
  packages: Array<{ id: string; name: string; version: string; status: string; exportPath?: string | null }>;
  exportJobs: Array<{ id: string; type: string; status: string; name: string; filePath?: string | null }>;
}) {
  const [form, setForm] = useState({ name: "production_package", version: "v1.0.0", description: "" });
  const [validation, setValidation] = useState<PackageValidationResult | null>(null);
  const [manifest, setManifest] = useState<unknown>(null);
  const [packages, setPackages] = useState(initPackages);
  const [jobs, setJobs] = useState(initJobs);
  const [importContent, setImportContent] = useState("");
  const [snapshotLevelId, setSnapshotLevelId] = useState(levels[0]?.id ?? "");
  const [snapshotName, setSnapshotName] = useState("snapshot");
  const [previewOpen, setPreviewOpen] = useState(false);

  const levelIds = levels.map((l) => l.id);
  const packagePayload = {
    ...form,
    levelIds,
    includeOnlyUsedAssets: true,
    includeReports: true,
    includeExcelTables: true,
    includeAdapterPreviews: true,
  };

  async function refresh() {
    const [p, j] = await Promise.all([
      fetch("/api/pipeline/packages").then((r) => r.json()),
      fetch("/api/pipeline/export-jobs").then((r) => r.json()),
    ]);
    if (p.success) setPackages(p.data);
    if (j.success) setJobs(j.data);
  }

  return (
    <div className="space-y-4">
      <ProductionPackageBuilder
        form={form}
        onChange={(key, value) => setForm((prev) => ({ ...prev, [key]: value }))}
        onDryRun={async () => {
          const res = await fetch("/api/pipeline/packages/dry-run", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(packagePayload) }).then((r) => r.json());
          if (res.success) {
            setValidation(res.data.validation);
            setManifest(res.data.manifest);
          }
        }}
        onBuild={async () => {
          const res = await fetch("/api/pipeline/packages/build", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(packagePayload) }).then((r) => r.json());
          if (res.success) {
            setValidation(res.data.validation);
            setManifest(res.data.manifest);
            await refresh();
          }
        }}
      />
      <PackageValidationPanel validation={validation} />
      <div className="grid gap-4 lg:grid-cols-2">
        <ImportCenter
          content={importContent}
          onContentChange={setImportContent}
          onDryRun={() => fetch("/api/pipeline/import/level-json/dry-run", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ fileContent: importContent }) })}
          onConfirm={() => fetch("/api/pipeline/import/level-json/confirm", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ fileContent: importContent }) })}
        />
        <SnapshotCenter
          levelId={snapshotLevelId}
          snapshotName={snapshotName}
          onLevelIdChange={setSnapshotLevelId}
          onNameChange={setSnapshotName}
          onCreate={() => fetch("/api/pipeline/snapshots", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ levelId: snapshotLevelId, snapshotName }) })}
        />
      </div>
      <AdapterPreviewPanel
        onUnity={() => fetch("/api/pipeline/adapters/unity-preview", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ levelIds }) })}
        onLvl={() => fetch("/api/pipeline/adapters/lvl-preview", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ levelIds }) })}
        onRuntime={() => fetch("/api/pipeline/adapters/runtime-preview", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ levelIds }) })}
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <ExportJobList jobs={jobs} />
        <PackageHistory
          packages={packages}
          onOpen={async (id) => {
            const res = await fetch(`/api/pipeline/packages/${id}`).then((r) => r.json());
            if (res.success && res.data?.manifestJson) {
              setManifest(JSON.parse(res.data.manifestJson));
              setPreviewOpen(true);
            }
          }}
        />
      </div>
      <ManifestPreviewDialog open={previewOpen} manifest={manifest} onClose={() => setPreviewOpen(false)} />
    </div>
  );
}
