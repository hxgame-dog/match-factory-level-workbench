import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { itemQuerySchema } from "@/lib/validators/item";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const query = itemQuerySchema.parse({
      search: url.searchParams.get("search") ?? undefined,
      category1: url.searchParams.get("category1") ?? undefined,
      color1: url.searchParams.get("color1") ?? undefined,
      size: url.searchParams.get("size") ?? undefined,
      page: url.searchParams.get("page") ?? "1",
      pageSize: url.searchParams.get("pageSize") ?? "20",
      sortBy: url.searchParams.get("sortBy") ?? "createdAt",
      sortOrder: url.searchParams.get("sortOrder") ?? "desc",
    });

    const where: Prisma.ItemCatalogWhereInput = {
      AND: [
        query.search
          ? {
              OR: [
                { name: { contains: query.search } },
                { category1: { contains: query.search } },
                { category2: { contains: query.search } },
              ],
            }
          : {},
        query.category1 ? { category1: query.category1 } : {},
        query.color1 ? { color1: query.color1 } : {},
        query.size ? { size: query.size } : {},
      ],
    };

    const [total, rows, categoryList, colorList, sizeList] = await Promise.all([
      prisma.itemCatalog.count({ where }),
      prisma.itemCatalog.findMany({
        where,
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        orderBy: { [query.sortBy]: query.sortOrder },
      }),
      prisma.itemCatalog.findMany({
        select: { category1: true },
        distinct: ["category1"],
        orderBy: { category1: "asc" },
      }),
      prisma.itemCatalog.findMany({
        where: { color1: { not: null } },
        select: { color1: true },
        distinct: ["color1"],
        orderBy: { color1: "asc" },
      }),
      prisma.itemCatalog.findMany({
        where: { size: { not: null } },
        select: { size: true },
        distinct: ["size"],
        orderBy: { size: "asc" },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: rows,
      total,
      page: query.page,
      pageSize: query.pageSize,
      filters: {
        category1: categoryList.map((x) => x.category1),
        color1: colorList.map((x) => x.color1).filter(Boolean),
        size: sizeList.map((x) => x.size).filter(Boolean),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "获取道具列表失败";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
