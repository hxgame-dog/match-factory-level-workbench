import { Suspense, type ReactNode } from "react";

import { AppHeader } from "@/components/layout/AppHeader";
import { AppShell } from "@/components/layout/AppShell";
import { PageContent } from "@/components/layout/PageContent";
import { WorkspaceRouteHydrator } from "@/components/shell/WorkspaceRouteHydrator";
import { WorkspaceShell } from "@/components/shell/WorkspaceShell";
import type { PipelineStepId } from "@/types/workspace";

type WorkspacePageLayoutProps = {
  title: string;
  description: string;
  step: PipelineStepId;
  children: ReactNode;
  fluid?: boolean;
  contentClassName?: string;
};

/** 工作台页统一布局：Header + Hydrator + 流水线 Shell */
export function WorkspacePageLayout({
  title,
  description,
  step,
  children,
  fluid = true,
  contentClassName,
}: WorkspacePageLayoutProps) {
  return (
    <AppShell>
      <AppHeader title={title} description={description} fluid={fluid} />
      <PageContent fluid={fluid} className={contentClassName}>
        <Suspense fallback={null}>
          <WorkspaceRouteHydrator />
        </Suspense>
        <WorkspaceShell step={step}>{children}</WorkspaceShell>
      </PageContent>
    </AppShell>
  );
}
