"use client";

import { useEffect, useMemo, useState } from "react";
import type { GenerateItemsResult } from "@/types/ai";

const PAGE_SIZE = 24;

export function useGeneratedItemsFilter(items: GenerateItemsResult["items"]) {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [page, setPage] = useState(1);

  const categories = useMemo(
    () => [...new Set(items.map((item) => item.category1))].filter(Boolean),
    [items],
  );

  const filteredWithIndex = useMemo(() => {
    return items
      .map((item, index) => ({ item, index }))
      .filter(({ item }) => {
        const matchSearch =
          !search ||
          item.name.toLowerCase().includes(search.toLowerCase()) ||
          (item.displayName ?? "").toLowerCase().includes(search.toLowerCase());
        const matchCategory = categoryFilter === "all" || item.category1 === categoryFilter;
        return matchSearch && matchCategory;
      });
  }, [items, search, categoryFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredWithIndex.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageSlice = filteredWithIndex.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [search, categoryFilter, items.length]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  return {
    search,
    setSearch,
    categoryFilter,
    setCategoryFilter,
    categories,
    filteredWithIndex,
    pageSlice,
    safePage,
    totalPages,
    pageSize: PAGE_SIZE,
    setPage,
  };
}
