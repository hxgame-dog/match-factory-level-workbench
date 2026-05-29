"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { BookOpen, PanelRightClose, PanelRightOpen, X } from "lucide-react";

import { getPageGuide } from "@/lib/guides/pageGuides";
import { zh } from "@/lib/i18n/zh";
import { useLayoutStore } from "@/stores/layoutStore";
import { cn } from "@/lib/utils";

function GuideContent({ guide }: { guide: NonNullable<ReturnType<typeof getPageGuide>> }) {
  return (
    <>
      <h3 className="font-serif text-base text-foreground">{guide.title}</h3>
      <div className="mt-4 space-y-4">
        {guide.sections.map((section) => (
          <div key={section.heading}>
            <p className="text-sm font-medium text-foreground">{section.heading}</p>
            <ul className="mt-1.5 list-disc space-y-1 pl-4 text-sm text-muted-foreground">
              {section.bullets.map((bullet) => (
                <li key={bullet}>{bullet}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </>
  );
}

export function PageGuidePanel() {
  const pathname = usePathname();
  const guide = getPageGuide(pathname);
  const { guideCollapsed, toggleGuide, setGuideCollapsed } = useLayoutStore();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      setGuideCollapsed(true);
      setMobileOpen(false);
    }
  }, [pathname, setGuideCollapsed]);

  if (!guide) return null;

  return (
    <>
      {/* 桌面端右侧栏 */}
      <aside
        className={cn(
          "hidden shrink-0 flex-col border-l border-border bg-card transition-all duration-200 md:flex",
          guideCollapsed ? "w-10" : "w-72",
        )}
      >
        <div
          className={cn(
            "flex items-center border-b border-border px-2 py-3",
            guideCollapsed ? "justify-center" : "justify-between px-3",
          )}
        >
          {!guideCollapsed && (
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">{zh.common.usageGuide}</span>
            </div>
          )}
          <button
            type="button"
            onClick={toggleGuide}
            className="rounded-md p-1 text-muted-foreground hover:bg-muted"
            aria-label={guideCollapsed ? zh.common.expand : zh.common.collapse}
          >
            {guideCollapsed ? <PanelRightOpen className="h-4 w-4" /> : <PanelRightClose className="h-4 w-4" />}
          </button>
        </div>
        {!guideCollapsed && (
          <div className="flex-1 overflow-y-auto p-4">
            <GuideContent guide={guide} />
          </div>
        )}
      </aside>

      {/* 移动端浮动按钮 + 抽屉 */}
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        className="fixed bottom-4 right-4 z-40 flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium shadow-sm md:hidden"
      >
        <BookOpen className="h-4 w-4" />
        {zh.common.usageGuide}
      </button>
      {mobileOpen ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/30"
            aria-label="关闭"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute bottom-0 left-0 right-0 max-h-[70vh] overflow-y-auto rounded-t-xl border border-border bg-card p-4 shadow-lg">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-medium">{zh.common.usageGuide}</span>
              <button type="button" onClick={() => setMobileOpen(false)} className="rounded-md p-1 hover:bg-muted">
                <X className="h-4 w-4" />
              </button>
            </div>
            <GuideContent guide={guide} />
          </div>
        </div>
      ) : null}
    </>
  );
}
