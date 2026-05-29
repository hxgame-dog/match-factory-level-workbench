import type { GenerateItemsResult } from "@/types/ai";

export type GeneratedItemSetPayload = {
  name: string;
  theme: string;
  prompt: string;
  totalItemCount: number;
  targetTypeCount: number;
  targetCountEach: number;
  distractorTypeCount: number;
  difficultyIntent?: string;
  constraints?: string;
  useExistingCatalogOnly: boolean;
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
