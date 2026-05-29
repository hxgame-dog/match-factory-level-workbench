import { promises as fs } from "fs";
import path from "path";
import JSZip from "jszip";

export async function exportAssetsZip(assets: Array<{ name: string; imageUrl?: string | null; id: string }>, name: string) {
  const zip = new JSZip();
  const folder = zip.folder("assets")?.folder("images");
  for (const asset of assets) {
    if (!asset.imageUrl) continue;
    const relative = asset.imageUrl.startsWith("/") ? asset.imageUrl.slice(1) : asset.imageUrl;
    const localPath = path.join(process.cwd(), "public", relative);
    try {
      folder?.file(`${asset.name}.svg`, await fs.readFile(localPath));
    } catch {}
  }
  zip.file("assets/mapping.json", JSON.stringify(assets, null, 2));
  const dir = path.join(process.cwd(), "public", "exports");
  await fs.mkdir(dir, { recursive: true });
  const fileName = `assets_${name.replace(/[^a-zA-Z0-9._-]/g, "_")}.zip`;
  await fs.writeFile(path.join(dir, fileName), await zip.generateAsync({ type: "nodebuffer" }));
  return `/exports/${fileName}`;
}
