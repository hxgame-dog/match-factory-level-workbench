import type { GenerateItemsResult } from "@/types/ai";

export type GeneratedItemSetPayload = {
  name: string;
  description: string;
  itemTypeCount: number;
  colorCount: number;
  summary?: string;
  warnings?: string[];
  items: GenerateItemsResult["items"];
};

export type GeneratedItemSetListItem = {
  id: string;
  name: string;
  theme: string;
  itemCount: number;
  createdAt: string;
};
