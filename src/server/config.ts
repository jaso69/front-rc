import fs from "node:fs";
import path from "node:path";

// El token vive solo aquí, en el servidor. Se lee del .env al arrancar y nunca
// se sirve al navegador: los paneles hablan con /av/* y este proceso pone el Bearer.
const ENV_FILE = path.join(process.cwd(), ".env");
if (fs.existsSync(ENV_FILE)) {
  process.loadEnvFile(ENV_FILE);
}

/**
 * Puerto en el que escucha el servidor. En Docker no suele tocarse: lo que se cambia es el
 * puerto publicado (`ports: "8080:3000"`), que no requiere reconstruir nada.
 */
export function serverPort(): number {
  const raw = Number(process.env.PORT);
  return Number.isInteger(raw) && raw > 0 && raw < 65536 ? raw : 3000;
}

/** Token de API de jaso-rc, o null si no hay ninguno configurado. */
export function avToken(): string | null {
  const token = process.env.JASO_RC_TOKEN?.trim();
  return token ? token : null;
}

/**
 * Contraseña del editor. Si no hay ninguna, el editor queda abierto: es un cambio de postura
 * consciente y el servidor lo avisa al arrancar, en vez de fingir que está protegido.
 */
export function editorPassword(): string | null {
  const password = process.env.EDITOR_PASSWORD?.trim();
  return password ? password : null;
}

/** Caducidad absoluta de la sesión del editor (no deslizante). */
export function sessionTtlHours(): number {
  const raw = Number(process.env.EDITOR_SESSION_TTL_HOURS);
  return Number.isFinite(raw) && raw > 0 ? raw : 12;
}

/** Marca la cookie de sesión como Secure. Ponlo si sirves el editor por HTTPS. */
export function secureCookies(): boolean {
  return process.env.EDITOR_SECURE_COOKIES?.trim() === "true";
}

/**
 * Acepta certificados TLS que no validan. jaso-rc suele servir HTTPS con un
 * certificado autofirmado en la LAN de control; sin esto, fetch falla al conectar.
 */
export function allowSelfSignedTls(): boolean {
  return process.env.JASO_RC_INSECURE_TLS?.trim() === "true";
}
