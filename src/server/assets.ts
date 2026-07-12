import fs from "node:fs";
import path from "node:path";

const ASSETS_DIR = path.join(process.cwd(), "data", "assets");

const ALLOWED_EXT = [".png", ".jpg", ".jpeg", ".gif", ".svg", ".webp", ".ico"];

function ensureDir(): void {
  fs.mkdirSync(ASSETS_DIR, { recursive: true });
}

// Sanea el nombre para evitar path traversal.
function safeFilename(name: string): string {
  const base = path.basename(name).replace(/[^a-zA-Z0-9._-]/g, "");
  if (!base) throw new Error(`Nombre de archivo inválido: "${name}"`);
  return base;
}

export function listAssets(): string[] {
  ensureDir();
  return fs
    .readdirSync(ASSETS_DIR)
    .filter((f) => ALLOWED_EXT.includes(path.extname(f).toLowerCase()))
    .sort();
}

export function saveAsset(filename: string, dataB64: string): string {
  ensureDir();
  const safe = safeFilename(filename);
  const ext = path.extname(safe).toLowerCase();
  if (!ALLOWED_EXT.includes(ext)) {
    throw new Error(`Extensión no permitida: ${ext}`);
  }
  const filePath = path.join(ASSETS_DIR, safe);
  fs.writeFileSync(filePath, Buffer.from(dataB64, "base64"));
  return safe;
}

export function deleteAsset(filename: string): boolean {
  const safe = safeFilename(filename);
  const filePath = path.join(ASSETS_DIR, safe);
  if (!filePath.startsWith(ASSETS_DIR) || !fs.existsSync(filePath)) return false;
  fs.unlinkSync(filePath);
  return true;
}

export function assetsDir(): string {
  return ASSETS_DIR;
}
