import fs from "node:fs";
import path from "node:path";
import { generateDesign } from "../generator/index.ts";
import type { Design } from "../schema/design.ts";

const GENERATED_DIR = path.join(process.cwd(), "generated");

export function generateAndWrite(design: Design, name: string): string[] {
  const safe = name.replace(/[^a-zA-Z0-9-_]/g, "");
  const dir = path.join(GENERATED_DIR, safe);
  fs.mkdirSync(dir, { recursive: true });

  const files = generateDesign(design, safe);
  const written: string[] = [];
  for (const [filename, content] of Object.entries(files)) {
    fs.writeFileSync(path.join(dir, filename), content);
    written.push(filename);
  }
  return written;
}

export function generatedDir(name: string): string {
  return path.join(GENERATED_DIR, name.replace(/[^a-zA-Z0-9-_]/g, ""));
}
