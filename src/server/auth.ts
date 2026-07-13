import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import type express from "express";
import { editorPassword, secureCookies, sessionTtlHours } from "./config.ts";

const COOKIE = "rc_session";

/**
 * Sesiones en memoria. Del identificador se guarda su SHA-256, no el identificador: quien
 * consiga leer la memoria (o un volcado) no puede suplantar una sesión viva.
 *
 * Reiniciar el servidor cierra las sesiones. Es un servidor de una instalación, no una granja:
 * volver a escribir la contraseña una vez al día es un precio razonable por no tener que
 * persistir credenciales.
 */
const sessions = new Map<string, number>();

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function pruneExpired(now: number): void {
  for (const [hash, expiresAt] of sessions) {
    if (expiresAt <= now) sessions.delete(hash);
  }
}

/** Compara en tiempo constante: una comparación normal filtra la contraseña carácter a carácter. */
function passwordMatches(candidate: string, expected: string): boolean {
  const a = Buffer.from(sha256(candidate), "hex");
  const b = Buffer.from(sha256(expected), "hex");
  return timingSafeEqual(a, b);
}

export function createSession(): { id: string; maxAgeMs: number } {
  const id = randomBytes(32).toString("base64url");
  const maxAgeMs = sessionTtlHours() * 3600_000;
  const now = Date.now();
  pruneExpired(now);
  sessions.set(sha256(id), now + maxAgeMs);
  return { id, maxAgeMs };
}

function readCookie(req: express.Request): string | null {
  const header = req.headers.cookie;
  if (!header) return null;
  for (const part of header.split(";")) {
    const [name, ...rest] = part.trim().split("=");
    if (name === COOKIE) return rest.join("=");
  }
  return null;
}

/** Caducidad absoluta, no deslizante: una sesión robada no se renueva sola para siempre. */
export function isAuthenticated(req: express.Request): boolean {
  if (!editorPassword()) return true; // Sin contraseña configurada, el editor queda abierto.

  const id = readCookie(req);
  if (!id) return false;

  const expiresAt = sessions.get(sha256(id));
  if (expiresAt === undefined) return false;
  if (expiresAt <= Date.now()) {
    sessions.delete(sha256(id));
    return false;
  }
  return true;
}

export function destroySession(req: express.Request): void {
  const id = readCookie(req);
  if (id) sessions.delete(sha256(id));
}

function setSessionCookie(res: express.Response, id: string, maxAgeMs: number): void {
  res.cookie(COOKIE, id, {
    httpOnly: true, // El JS del navegador no la ve: un XSS no se lleva la sesión.
    sameSite: "strict", // La cookie no viaja desde otra página: no hay CSRF contra el editor.
    secure: secureCookies(),
    maxAge: maxAgeMs,
    path: "/",
  });
}

// ── Handlers ──

export function login(req: express.Request, res: express.Response): void {
  const expected = editorPassword();
  if (!expected) {
    res.status(400).json({ error: "El editor no tiene contraseña configurada" });
    return;
  }

  const { password } = (req.body ?? {}) as { password?: string };
  if (typeof password !== "string" || !passwordMatches(password, expected)) {
    // Ni "usuario no existe" ni "contraseña incorrecta": un solo mensaje, y un retardo para que
    // probar contraseñas a mano sea tedioso.
    setTimeout(() => res.status(401).json({ error: "Contraseña incorrecta" }), 400);
    return;
  }

  const { id, maxAgeMs } = createSession();
  setSessionCookie(res, id, maxAgeMs);
  res.json({ ok: true });
}

export function logout(req: express.Request, res: express.Response): void {
  destroySession(req);
  res.clearCookie(COOKIE, { path: "/" });
  res.json({ ok: true });
}

export function session(req: express.Request, res: express.Response): void {
  res.json({ authenticated: isAuthenticated(req), passwordSet: Boolean(editorPassword()) });
}

/**
 * Protege el editor y la API de diseños.
 *
 * NO protege los paneles generados (`/designs/*`) ni su proxy (`/av/*`): una tablet colgada en
 * la pared no puede escribir una contraseña. Es la misma frontera que traza jaso-rc —cookie
 * para las personas, token para las máquinas— y el motivo de que el proxy sea de solo comandos.
 */
export function requireAuth(req: express.Request, res: express.Response, next: express.NextFunction): void {
  if (isAuthenticated(req)) {
    next();
    return;
  }
  res.status(401).json({ error: "No autenticado" });
}
