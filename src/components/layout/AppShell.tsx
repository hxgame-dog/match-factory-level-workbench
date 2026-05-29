"use client";

import { AppSidebar } from "@/components/layout/AppSidebar";
import { PageGuidePanel } from "@/components/layout/PageGuidePanel";

type AppShellProps = {
  children: React.ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <AppSidebar />
      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <div className="flex min-h-0 flex-1">
          <main className="min-w-0 flex-1 overflow-auto">{children}</main>
          <PageGuidePanel />
        </div>
      </div>
    </div>
  );
}
