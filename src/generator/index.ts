import type { Design } from "../schema/design.ts";
import { generateHtml } from "./html.ts";
import { generateCss } from "./css.ts";
import { generateJs } from "./js.ts";
import type { GeneratedFiles } from "./types.ts";

export function generateDesign(design: Design): GeneratedFiles {
  return {
    "index.html": generateHtml(design),
    "styles.css": generateCss(design),
    "app.js": generateJs(design),
  };
}
