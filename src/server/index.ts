import express from "express";
import fs from "node:fs";
import path from "node:path";
import { deleteDesign, getDesign, listDesigns, saveDesign } from "./store.ts";
import { generateAndWrite, generatedDir } from "./generate.ts";
import { assetsDir, deleteAsset, listAssets, saveAsset } from "./assets.ts";
import type { Design } from "../schema/design.ts";

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "5mb" }));

// ── Assets estáticos (imágenes subidas) ──
// Se registra ANTES que el editor para que /assets/<img> se sirva desde data/assets/
// y los bundles de Vite (/assets/<hash>.js) caigan al static del editor por fall-through.
app.use("/assets", express.static(assetsDir()));

// ── Editor (React compilado por Vite a dist-editor/) ──
const editorDir = path.join(process.cwd(), "dist-editor");
if (fs.existsSync(editorDir)) {
  app.use(express.static(editorDir));
} else {
  console.warn("⚠ Editor no compilado. Ejecuta `npm run build:editor` primero.");
}

// ── API: diseños ──

// Listar todos los diseños
app.get("/api/designs", (_req, res) => {
  res.json({ designs: listDesigns() });
});

// Obtener un diseño
app.get("/api/designs/:name", (req, res) => {
  const design = getDesign(req.params.name);
  if (!design) {
    res.status(404).json({ error: "Diseño no encontrado" });
    return;
  }
  res.json(design);
});

// Guardar (crear o actualizar) un diseño
app.put("/api/designs/:name", (req, res) => {
  const design = req.body as Design;
  if (!design.config || !design.screens) {
    res.status(400).json({ error: "Estructura de diseño inválida" });
    return;
  }
  if (!design.config.baseUrl?.trim()) {
    res.status(400).json({ error: "La URL base del backend AV es obligatoria" });
    return;
  }
  if (design.screens.length === 0) {
    res.status(400).json({ error: "El diseño debe tener al menos una pantalla" });
    return;
  }
  try {
    saveDesign(req.params.name, design);
    res.status(201).json({ ok: true, name: req.params.name });
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

// Borrar un diseño
app.delete("/api/designs/:name", (req, res) => {
  const deleted = deleteDesign(req.params.name);
  if (!deleted) {
    res.status(404).json({ error: "Diseño no encontrado" });
    return;
  }
  res.status(204).end();
});

// Generar estáticos a partir de un diseño guardado
app.post("/api/designs/:name/generate", (req, res) => {
  const design = getDesign(req.params.name);
  if (!design) {
    res.status(404).json({ error: "Diseño no encontrado" });
    return;
  }
  const files = generateAndWrite(design, req.params.name);
  res.json({ ok: true, files, url: `/designs/${req.params.name}/` });
});

// ── API: assets ──

// Listar assets disponibles
app.get("/api/assets", (_req, res) => {
  res.json({ assets: listAssets() });
});

// Subir un asset (base64 en JSON)
app.post("/api/assets", (req, res) => {
  const { filename, data } = req.body as { filename: string; data: string };
  if (!filename || !data) {
    res.status(400).json({ error: "Faltan filename o data" });
    return;
  }
  try {
    const saved = saveAsset(filename, data);
    res.status(201).json({ ok: true, filename: saved });
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

// Borrar un asset
app.delete("/api/assets/:filename", (req, res) => {
  const deleted = deleteAsset(req.params.filename);
  if (!deleted) {
    res.status(404).json({ error: "Asset no encontrado" });
    return;
  }
  res.status(204).end();
});

// ── Diseños generados (sirve los estáticos al navegador/tablet) ──

const MIME: Record<string, string> = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "text/javascript",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
};

// /designs/:name/        → index.html
// /designs/:name/:file   → el fichero
app.get(/^\/designs\/([\w-]+)\/?$/, (req, res) => {
  const name = req.params[0]!;
  serveGenerated(name, "index.html", res);
});

app.get(/^\/designs\/([\w-]+)\/(.+)$/, (req, res) => {
  const name = req.params[0]!;
  const file = req.params[1]!;
  serveGenerated(name, file, res);
});

function serveGenerated(name: string, file: string, res: express.Response): void {
  const dir = generatedDir(name);
  const filePath = path.join(dir, file);
  if (!filePath.startsWith(dir)) {
    res.status(403).end();
    return;
  }
  if (!fs.existsSync(filePath)) {
    res.status(404).send("Not found");
    return;
  }
  res.setHeader("Content-Type", MIME[path.extname(filePath)] ?? "application/octet-stream");
  res.send(fs.readFileSync(filePath));
}

export function startServer(): void {
  app.listen(PORT, () => {
    console.log(`Servidor local → http://localhost:${PORT}`);
    console.log(`  Editor:        http://localhost:${PORT}/`);
    console.log(`  Diseños:       http://localhost:${PORT}/designs/<nombre>/`);
    console.log(`  API:           http://localhost:${PORT}/api/designs`);
  });
}
