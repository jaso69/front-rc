import type express from "express";
import { avToken } from "./config.ts";
import { getDesign } from "./store.ts";
import { MACRO_COMMAND, type DeviceView, type MacroView } from "../schema/device.ts";
import type { Design } from "../schema/design.ts";

// Tiempo máximo de espera al backend AV. jaso-rc caduca un `status` a los 5 s y un comando a
// los 10 s, así que 12 s cubre lo suyo sin dejar peticiones colgadas contra un equipo mudo.
const TIMEOUT_MS = 12_000;

/**
 * Habla con jaso-rc poniendo el token del servidor. Todo lo que sale hacia el backend AV pasa
 * por aquí: el proxy de los paneles y el catálogo que consume el editor.
 */
async function callAv(design: Design, path: string, init: RequestInit = {}): Promise<Response> {
  const token = avToken();
  if (!token) throw new NoTokenError();

  const url = design.config.baseUrl.replace(/\/+$/, "") + path;
  return fetch(url, {
    ...init,
    headers: { ...init.headers, Authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
}

class NoTokenError extends Error {
  constructor() {
    super("El servidor no tiene token de jaso-rc configurado");
  }
}

/**
 * BFF hacia jaso-rc. El panel generado llama a `/av/<diseño>/<endpoint>` en su propio origen y
 * este handler reenvía a la `baseUrl` del diseño añadiendo el `Authorization: Bearer`. Dos
 * cosas a la vez:
 *
 *  - el token nunca sale al navegador (el bundle es público para cualquier tablet);
 *  - la petición del panel es same-origin, así que no hay CORS ni preflight.
 *
 * Deliberadamente NO se reenvía la cabecera `Authorization` que traiga el cliente: la
 * credencial es la del servidor, no la que diga quien llame.
 */
export async function avProxy(req: express.Request, res: express.Response): Promise<void> {
  const name = req.params[0]!;
  const design = getDesign(name);
  if (!design) {
    res.status(404).json({ error: "Diseño no encontrado" });
    return;
  }

  // El sufijo se toma de la URL original para conservar la query string tal cual la construyó
  // el panel.
  const suffix = req.originalUrl.slice(`/av/${name}`.length);

  const headers: Record<string, string> = {};
  let body: string | undefined;
  if (req.method !== "GET" && req.method !== "HEAD" && req.body && Object.keys(req.body).length > 0) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(req.body);
  }

  try {
    const upstream = await callAv(design, suffix, { method: req.method, headers, body });
    const text = await upstream.text();
    if (!upstream.ok) {
      console.error(`[AV] ${req.method} ${suffix} → ${upstream.status}`);
    }
    // El cuerpo se reenvía tal cual: los errores de jaso-rc ya vienen en {"error": "..."} y el
    // panel sabe leerlos. Un 502 aquí significa "el equipo no responde", no "jaso-rc roto".
    res.status(upstream.status);
    res.setHeader("Content-Type", upstream.headers.get("content-type") ?? "application/json");
    res.send(text);
  } catch (err) {
    if (err instanceof NoTokenError) {
      console.error("[AV] JASO_RC_TOKEN no configurado: no se puede hablar con jaso-rc");
      res.status(503).json({ error: err.message });
      return;
    }
    console.error(`[AV] fallo de red hacia ${design.config.baseUrl}${suffix}:`, (err as Error).message);
    res.status(502).json({ error: "No se pudo contactar con el backend AV" });
  }
}

/**
 * Catálogo de equipos para el editor: qué equipos hay y qué comandos admite cada uno. Es la
 * llamada que construye la UI —sin ella habría que teclear los nombres a mano y confiar en no
 * equivocarse—, y el editor la usa para ofrecer listas cerradas.
 */
export async function avDevices(req: express.Request, res: express.Response): Promise<void> {
  const design = getDesign(String(req.params.name));
  if (!design) {
    res.status(404).json({ error: "Diseño no encontrado" });
    return;
  }

  try {
    const upstream = await callAv(design, "/api/devices");
    if (!upstream.ok) {
      const detail = await upstream.text();
      res.status(upstream.status).json({ error: avErrorMessage(upstream.status, detail) });
      return;
    }
    const data = (await upstream.json()) as { devices?: DeviceView[] };
    const devices = (data.devices ?? []).map((d) => ({ ...d, kind: "device" as const }));
    res.json({ devices: [...devices, ...(await macrosAsDevices(design))] });
  } catch (err) {
    if (err instanceof NoTokenError) {
      res.status(503).json({ error: err.message });
      return;
    }
    res.status(502).json({ error: `No se pudo contactar con ${design.config.baseUrl}` });
  }
}

/**
 * Las macros de `GET /api/macros`, vestidas de equipo para que entren por el mismo desplegable.
 * Cada una expone un único comando —ejecutarla—; `kind: "macro"` es lo que luego hace que el
 * generador emita `POST /api/macros/{id}/run` en vez de la ruta de comandos.
 *
 * Un fallo aquí no tumba el catálogo: un jaso-rc sin macros (o anterior al endpoint) responde
 * 404, y quedarse sin equipos por eso sería peor que quedarse sin macros.
 */
async function macrosAsDevices(design: Design): Promise<DeviceView[]> {
  try {
    const upstream = await callAv(design, "/api/macros");
    if (!upstream.ok) {
      console.error(`[AV] GET /api/macros → ${upstream.status}: se sirve el catálogo sin macros`);
      return [];
    }
    const data = (await upstream.json()) as { macros?: MacroView[] };
    return (data.macros ?? [])
      .filter((m) => typeof m.id === "string" && m.id !== "")
      .map((m) => ({
        id: m.id,
        driver: m.name ?? "macro",
        host: "",
        port: 0,
        commands: [MACRO_COMMAND],
        kind: "macro" as const,
      }));
  } catch (err) {
    console.error("[AV] no se pudieron leer las macros:", (err as Error).message);
    return [];
  }
}

/**
 * Estado de un equipo, para el editor. Es lo que permite configurar el feedback sin adivinar:
 * las claves de `status` (power, input, level…) **dependen del driver** y la API no las publica
 * en ningún catálogo, así que la única fuente fiable es preguntarle al equipo de verdad y
 * ofrecer las que ha devuelto.
 */
export async function avDeviceStatus(req: express.Request, res: express.Response): Promise<void> {
  const design = getDesign(String(req.params.name));
  if (!design) {
    res.status(404).json({ error: "Diseño no encontrado" });
    return;
  }

  try {
    const upstream = await callAv(design, `/api/devices/${encodeURIComponent(String(req.params.id))}/status`);
    if (!upstream.ok) {
      const detail = await upstream.text();
      res.status(upstream.status).json({ error: avErrorMessage(upstream.status, detail) });
      return;
    }
    // Se reenvía tal cual, incluido el caso de equipo inalcanzable: es un 200 con
    // { reachable: false, error }, no un error HTTP, y el editor sabe distinguirlo.
    res.json(await upstream.json());
  } catch (err) {
    if (err instanceof NoTokenError) {
      res.status(503).json({ error: err.message });
      return;
    }
    res.status(502).json({ error: `No se pudo contactar con ${design.config.baseUrl}` });
  }
}

/**
 * Prueba de conexión para el editor: dice si la URL responde, si el token vale y si es de solo
 * lectura. Distingue los tres fallos, que se parecen mucho desde fuera y se arreglan de forma
 * muy distinta (IP mal puesta / token caducado / token readonly).
 */
export async function avHealth(req: express.Request, res: express.Response): Promise<void> {
  const design = getDesign(String(req.params.name));
  if (!design) {
    res.status(404).json({ error: "Diseño no encontrado" });
    return;
  }

  try {
    const upstream = await callAv(design, "/api/devices");
    if (upstream.status === 401) {
      res.json({ ok: false, error: "El token no es válido para este servidor" });
      return;
    }
    if (!upstream.ok) {
      res.json({ ok: false, error: avErrorMessage(upstream.status, await upstream.text()) });
      return;
    }
    const data = (await upstream.json()) as { devices?: DeviceView[] };
    res.json({ ok: true, devices: data.devices?.length ?? 0, baseUrl: design.config.baseUrl });
  } catch (err) {
    if (err instanceof NoTokenError) {
      res.json({ ok: false, error: err.message });
      return;
    }
    res.json({ ok: false, error: `No responde ${design.config.baseUrl}` });
  }
}

function avErrorMessage(status: number, body: string): string {
  // `allow_cidrs` responde 403 en TEXTO PLANO, no en JSON: es un problema de red (tu IP no está
  // en la lista blanca), no de token, y conviene no confundirlos.
  if (status === 403 && !body.trimStart().startsWith("{")) {
    return "Tu IP no está autorizada en el backend AV (allow_cidrs)";
  }
  try {
    const parsed = JSON.parse(body) as { error?: string };
    if (parsed.error) return parsed.error;
  } catch {
    /* no era JSON */
  }
  return `El backend AV respondió ${status}`;
}
