export type ItemCatalogRow = {
  id: string;
  itemId: number | null;
  name: string;
  category1: string;
  category2: string | null;
  color1: string | null;
  color2: string | null;
  shape: string | null;
  size: string | null;
  col7: string | null;
  targetScale: number | null;
  createdAt: string;
  updatedAt: string;
};

export type ItemQuery = {
  search?: string;
  category1?: string;
  color1?: string;
  size?: string;
  page?: number;
  pageSize?: number;
  sortBy?: "itemId" | "name" | "category1" | "targetScale" | "createdAt";
  sortOrder?: "asc" | "desc";
};
