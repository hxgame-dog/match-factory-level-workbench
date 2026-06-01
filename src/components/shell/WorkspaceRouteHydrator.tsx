"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

import { useWorkspaceStore } from "@/stores/workspaceStore";

type Props = {
  /** 来自服务端的默认工作区（如 URL 指定 id 对应名称） */
  workspaceId?: string | null;
  workspaceName?: string | null;
};

/** 将 URL ?workspace= 与服务端默认值同步到 workspaceStore */
export function WorkspaceRouteHydrator({ workspaceId, workspaceName }: Props) {
  const searchParams = useSearchParams();
  const setActive = useWorkspaceStore((s) => s.setActive);
  const activeId = useWorkspaceStore((s) => s.activeId);

  useEffect(() => {
    const fromUrl = searchParams.get("workspace");
    const id = fromUrl ?? workspaceId ?? null;
    const name = workspaceName ?? null;
    if (id && name && activeId !== id) {
      setActive(id, name);
    } else if (id && !activeId) {
      setActive(id, name ?? "工作区");
    }
  }, [searchParams, workspaceId, workspaceName, setActive, activeId]);

  return null;
}
