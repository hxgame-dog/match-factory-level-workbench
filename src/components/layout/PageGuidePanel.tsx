"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { BookOpen, PanelRightClose, PanelRightOpen } from "lucide-react";

import { getPageGuide } from "@/lib/guides/pageGuides";
import { zh } from "@/lib/i18n/zh";
import { useLayoutStore } from "@/stores/layoutStore";
import { cn } from "@/lib/utils";

export function PageGuidePanel() {
  const pathname = usePathname();
  const guide = getPageGuide(pathname);
  const { guideCollapsed, toggleGuide, setGuideCollapsed } = useLayoutStore();

  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      setGuideCollapsed(true);
    }
  }, [pathname, setGuideCollapsed]);

  if (!guide) return null;

  return (
    <aside
      className={cn(
        "hidden shrink-0 flex-col border-l border-gray-200 bg-white transition-all duration-200 md:flex",
        guideCollapsed ? "w-10" : "w-72",
      )}
    >
      <div
        className={cn(
          "flex items-center border-b border-gray-200 px-2 py-3",
          guideCollapsed ? "justify-center" : "justify-between px-3",
        )}
      >
        {!guideCollapsed && (
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-900">{zh.common.usageGuide}</span>
          </div>
        )}
        <button
          type="button"
          onClick={toggleGuide}
          className="rounded-md p-1 text-gray-500 hover:bg-gray-100"
          aria-label={guideCollapsed ? zh.common.expand : zh.common.collapse}
          title={guideCollapsed ? zh.common.expand : zh.common.collapse}
        >
          {guideCollapsed ? <PanelRightOpen className="h-4 w-4" /> : <PanelRightClose className="h-4 w-4" />}
        </button>
      </div>
      {!guideCollapsed && (
        <div className="flex-1 overflow-y-auto p-4">
          <h3 className="font-serif text-base text-gray-900">{guide.title}</h3>
          <div className="mt-4 space-y-4">
            {guide.sections.map((section) => (
              <div key={section.heading}>
                <p className="text-sm font-medium text-gray-800">{section.heading}</p>
                <ul className="mt-1.5 list-disc space-y-1 pl-4 text-sm text-gray-600">
                  {section.bullets.map((bullet) => (
                    <li key={bullet}>{bullet}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
}
