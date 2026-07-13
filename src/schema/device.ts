// Las respuestas de jaso-rc, tal como vienen. No las adornamos: si el backend añade un
// driver nuevo, aquí no hay que tocar nada.

/** `GET /api/devices` → { devices: [...] }, y `GET /api/devices/{id}` → un elemento suelto. */
export interface DeviceView {
  id: string;
  driver: string;
  /** Vacío en las cargas DALI: no tienen red propia, hablan por su pasarela. */
  host: string;
  /** 0 en las cargas DALI. No lo pintes como ":0". */
  port: number;
  /** Nombres lógicos de los comandos que admite el equipo. Es todo lo que publica la API. */
  commands: string[];
  /**
   * Las macros viajan por el mismo catálogo que los equipos —el editor las ofrece en el mismo
   * desplegable—, pero se disparan por otra ruta (`/api/macros/{id}/run`, no
   * `/api/devices/{id}/commands/{cmd}`). Sin esta marca no hay forma de saber cuál toca.
   */
  kind?: "device" | "macro";
}

/** `GET /api/macros` → { macros: [...] }. Solo nos interesa el id; el resto es informativo. */
export interface MacroView {
  id: string;
  /** Nombre legible, si el backend lo publica. Cae al id cuando no viene. */
  name?: string;
  description?: string;
}

/** El único "comando" de una macro: ejecutarla. */
export const MACRO_COMMAND = "run";

export function isMacro(device: DeviceView): boolean {
  return device.kind === "macro";
}

/**
 * `GET /api/devices/{id}/status`. El contenido de `status` **depende del driver** y es un
 * mapa abierto: `reachable` lo ponen todos, y el resto (power, input, lamp, level…) varía.
 * Cuando `reachable` es false suele venir `error` con el motivo.
 */
export interface DeviceStatus {
  id: string;
  status: { reachable?: boolean; error?: string } & Record<string, unknown>;
}

/** Un equipo sin red propia (carga DALI): host vacío y puerto 0. */
export function isGatewayDevice(device: DeviceView): boolean {
  if (isMacro(device)) return false;
  return device.driver === "dali-load" || device.host === "";
}
