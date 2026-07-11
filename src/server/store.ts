import fs from "node:fs";
import path from "node:path";
import type { Design } from "../schema/design.ts";

const DATA_DIR = path.join(process.cwd(), "data", "designs");

// Migra diseños antiguos: acciones sin type → { type: "http", ... }
function migrateDesign(raw: unknown): Design {
  const design = raw as Record<string, unknown>;
  const screens = (design.screens as Record<string, unknown>[]) ?? [];
  for (const screen of screens) {
    const elements = (screen.elements as Record<string, unknown>[]) ?? [];
    for (const el of elements) {
      const action = el.action as Record<string, unknown> | undefined;
      if (action && !action.type) {
        action.type = "http";
      }
    }
  }
  return design as unknown as Design;
}

function ensureDir(): void {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Sanea el nombre para evitar path traversal: solo alfanuméricos, guiones y guiones bajos.
function safeName(name: string): string {
  const cleaned = name.replace(/[^a-zA-Z0-9-_]/g, "");
  if (!cleaned) throw new Error(`Nombre de diseño inválido: "${name}"`);
  return cleaned;
}

function designPath(name: string): string {
  return path.join(DATA_DIR, `${safeName(name)}.json`);
}

export function listDesigns(): string[] {
  ensureDir();
  return fs
    .readdirSync(DATA_DIR)
    .filter((f) => f.endsWith(".json"))
    .map((f) => f.slice(0, -5))
    .sort();
}

export function getDesign(name: string): Design | null {
  const file = designPath(name);
  if (!fs.existsSync(file)) return null;
  return migrateDesign(JSON.parse(fs.readFileSync(file, "utf-8")));
}

export function saveDesign(name: string, design: Design): void {
  ensureDir();
  fs.writeFileSync(designPath(name), JSON.stringify(design, null, 2));
}

export function deleteDesign(name: string): boolean {
  const file = designPath(name);
  if (!fs.existsSync(file)) return false;
  fs.unlinkSync(file);
  return true;
}
