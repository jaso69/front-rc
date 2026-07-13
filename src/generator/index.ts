import type { Design } from "../schema/design.ts";
import { generateHtml } from "./html.ts";
import { generateCss } from "./css.ts";
import { generateJs } from "./js.ts";
import type { GeneratedFiles } from "./types.ts";

/** `name` es el nombre del diseño: da la ruta del proxy AV (`/av/<name>`) del panel. */
export function generateDesign(design: Design, name: string): GeneratedFiles {
  return {
    "index.html": generateHtml(design),
    "styles.css": generateCss(design),
    "app.js": generateJs(design, name),
  };
}
