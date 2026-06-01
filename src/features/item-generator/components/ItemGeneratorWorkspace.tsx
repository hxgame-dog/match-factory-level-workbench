"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { ItemCatalogUploadPanel } from "./ItemCatalogUploadPanel";
import { ItemGeneratorForm } from "./ItemGeneratorForm";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { zh } from "@/lib/i18n/zh";
import type { ItemCatalogRow } from "@/types/item";
import type { GeneratedItemSetListItem } from "@/types/generatedItemSet";

const t = zh.pages.itemGenerator;

type Props = {
  initialHistory: GeneratedItemSetListItem[];
  initialCatalogTotal: number;
  initialCatalogRows: ItemCatalogRow[];
  initialCatalogFilters: {
    category1: string[];
    color1: string[];
    size: string[];
  };
};

function ItemGeneratorWorkspaceInner(props: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab") === "upload" ? "upload" : "generate";

  function setTab(next: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (next === "upload") {
      params.set("tab", "upload");
    } else {
      params.delete("tab");
    }
    const q = params.toString();
    router.replace(q ? `/item-generator?${q}` : "/item-generator");
  }

  return (
    <Tabs value={tab} onValueChange={setTab} className="gap-4">
      <TabsList>
        <TabsTrigger value="generate">{t.tabs.generate}</TabsTrigger>
        <TabsTrigger value="upload">{t.tabs.upload}</TabsTrigger>
      </TabsList>
      <TabsContent value="generate" className="mt-0">
        <ItemGeneratorForm initialHistory={props.initialHistory} />
      </TabsContent>
      <TabsContent value="upload" className="mt-0">
        <ItemCatalogUploadPanel
          initialTotal={props.initialCatalogTotal}
          initialRows={props.initialCatalogRows}
          initialFilters={props.initialCatalogFilters}
        />
      </TabsContent>
    </Tabs>
  );
}

export function ItemGeneratorWorkspace(props: Props) {
  return (
    <Suspense fallback={<div className="text-sm text-muted-foreground">加载中…</div>}>
      <ItemGeneratorWorkspaceInner {...props} />
    </Suspense>
  );
}
