import { promises as fs } from "fs";
import path from "path";

import type { GenerateAssetImageInput } from "@/types/asset";

const COLOR_MAP: Record<string, string> = {
  red: "#ef4444",
  orange: "#f97316",
  yellow: "#eab308",
  green: "#22c55e",
  blue: "#3b82f6",
  purple: "#8b5cf6",
  pink: "#ec4899",
  brown: "#a16207",
  black: "#334155",
  white: "#e2e8f0",
};

function safeName(text: string) {
  return text.replace(/[^a-zA-Z0-9-_]/g, "_").slice(0, 60);
}

function pickColor(color1?: string) {
  if (!color1) return "#64748b";
  const key = color1.toLowerCase();
  return COLOR_MAP[key] ?? "#64748b";
}

function pickShape(name: string, shape?: string) {
  const key = `${name} ${shape ?? ""}`.toLowerCase();
  if (/(round|ball|circle)/.test(key)) return "circle";
  if (/(box|square)/.test(key)) return "square";
  if (/(long|stick|pencil)/.test(key)) return "bar";
  if (/(bottle|cup)/.test(key)) return "cup";
  return "card";
}

function shapeSvg(shapeType: string, color: string) {
  if (shapeType === "circle") return `<circle cx="256" cy="220" r="110" fill="${color}" />`;
  if (shapeType === "square")
    return `<rect x="146" y="110" width="220" height="220" rx="48" fill="${color}" />`;
  if (shapeType === "bar")
    return `<rect x="186" y="90" width="140" height="260" rx="40" fill="${color}" />`;
  if (shapeType === "cup")
    return `<path d="M170 120 H342 L320 330 H192 Z" fill="${color}" />`;
  return `<rect x="126" y="120" width="260" height="200" rx="32" fill="${color}" />`;
}

export async function generateMockAssetImage(
  input: GenerateAssetImageInput,
): Promise<{ imageUrl: string; localPath: string }> {
  const shortName = input.item.name.slice(0, 12);
  const color = pickColor(input.item.color1);
  const shape = pickShape(input.item.name, input.item.shape);

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" fill="#f8fafc"/>
  ${shapeSvg(shape, color)}
  <text x="256" y="462" text-anchor="middle" fill="#334155" font-size="26" font-family="Arial">${shortName}</text>
</svg>`;

  try {
    const baseDir = path.join(process.cwd(), "public", "generated-assets", "mock");
    await fs.mkdir(baseDir, { recursive: true });
    const safe = safeName(input.item.name);
    const fileName = `${safe}_${Date.now()}.svg`;
    const absolutePath = path.join(baseDir, fileName);
    await fs.writeFile(absolutePath, svg, "utf-8");
    return {
      imageUrl: `/generated-assets/mock/${fileName}`,
      localPath: absolutePath,
    };
  } catch {
    const encoded = Buffer.from(svg, "utf-8").toString("base64");
    return {
      imageUrl: `data:image/svg+xml;base64,${encoded}`,
      localPath: "",
    };
  }
}
