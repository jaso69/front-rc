import fs from "node:fs";
import path from "node:path";
import type { Design } from "../schema/design.ts";
import { deleteDesign, getDesign, listDesigns, saveDesign } from "./store.ts";
import { assetsDir, listAssets, saveAsset } from "./assets.ts";
import { generateAndWrite } from "./generate.ts";

/**
 * Copia de seguridad completa del editor: diseños y assets en un único fichero JSON.
 *
 * Los paneles de `generated/` NO van dentro: son derivados: se vuelven a generar a partir de los
 * diseños, y meterlos multiplicaría el tamaño del backup sin añadir nada que no se pueda
 * reconstruir. Al restaurar se regeneran solos.
 */
export interface Backup {
  version: 1;
  createdAt: string;
  designs: Record<string, Design>;
  /** filename → contenido en base64. */
  assets: Record<string, string>;
}

export type RestoreMode = "merge" | "replace";

export interface RestoreResult {
  designs: string[];
  assets: string[];
  removed: string[];
}

export function buildBackup(): Backup {
  const designs: Record<string, Design> = {};
  for (const name of listDesigns()) {
    const design = getDesign(name);
    if (design) designs[name] = design;
  }

  const assets: Record<string, string> = {};
  for (const filename of listAssets()) {
    assets[filename] = fs.readFileSync(path.join(assetsDir(), filename)).toString("base64");
  }

  return { version: 1, createdAt: new Date().toISOString(), designs, assets };
}

function assertBackup(raw: unknown): asserts raw is Backup {
  const b = raw as Partial<Backup> | null;
  if (!b || typeof b !== "object") throw new Error("El fichero no es una copia de seguridad válida");
  if (b.version !== 1) throw new Error(`Versión de copia no soportada: ${String(b.version)}`);
  if (!b.designs || typeof b.designs !== "object") throw new Error("La copia no contiene diseños");
  if (b.assets && typeof b.assets !== "object") throw new Error("La copia tiene assets con formato inválido");
}

/**
 * Restaura una copia. En modo `merge` los diseños de la copia pisan a los del mismo nombre y el
 * resto se queda; en modo `replace` se borran antes los diseños que no estén en la copia, que es
 * lo que se quiere al clonar un servidor entero. Los assets nunca se borran: son ficheros
 * compartidos entre diseños y perder el logo de un panel que no venía en la copia sería peor que
 * dejar un icono huérfano.
 */
export function restoreBackup(raw: unknown, mode: RestoreMode): RestoreResult {
  assertBackup(raw);

  const names = Object.keys(raw.designs);
  const removed: string[] = [];
  if (mode === "replace") {
    for (const existing of listDesigns()) {
      if (!names.includes(existing) && deleteDesign(existing)) removed.push(existing);
    }
  }

  const assets: string[] = [];
  for (const [filename, data] of Object.entries(raw.assets ?? {})) {
    // Un asset con nombre o extensión inválidos no debe tumbar la restauración entera: el resto
    // de la copia sigue siendo bueno y el usuario necesita recuperarla.
    try {
      assets.push(saveAsset(filename, data));
    } catch (err) {
      console.error(`[backup] asset "${filename}" descartado:`, (err as Error).message);
    }
  }

  const designs: string[] = [];
  for (const [name, design] of Object.entries(raw.designs)) {
    saveDesign(name, design);
    designs.push(name);
    // Los paneles no viajan en la copia: se reconstruyen aquí para que /designs/<nombre>/
    // responda en cuanto termina la restauración, sin tener que abrir cada diseño y darle a
    // generar.
    generateAndWrite(design, name);
  }

  return { designs, assets, removed };
}
