import fs from "node:fs";
import path from "node:path";
import { generateDesign } from "./generator/index.ts";
import { exampleDesign } from "./schema/example.ts";

const outDir = path.join(import.meta.dirname, "..", "dist-test");
fs.mkdirSync(outDir, { recursive: true });

const files = generateDesign(exampleDesign);

for (const [name, content] of Object.entries(files)) {
  fs.writeFileSync(path.join(outDir, name), content);
  console.log(`  ${name} (${content.length} bytes)`);
}

console.log(`\nGenerado en ${outDir}`);
