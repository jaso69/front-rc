// Acciones: lo que hace un elemento al interactuar con él

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export interface HttpAction {
  type: "http";
  /** Path del endpoint, combinado con la baseUrl del diseño. Ej: "/api/power" */
  endpoint: string;
  method: HttpMethod;
  /**
   * Datos a enviar. Los valores son strings y pueden contener interpolación
   * con la variable del elemento, p. ej. { "level": "{{value}}" }.
   * - En GET se envían como query string.
   * - En POST/PUT/PATCH/DELETE se envían como body JSON.
   */
  payload?: Record<string, string>;
}

/**
 * Ejecuta un comando de jaso-rc: `POST /api/devices/{deviceId}/commands/{command}`.
 *
 * Es la forma que tiene la API de verdad, y por eso es la acción por defecto: `GET
 * /api/devices` publica qué equipos hay y qué comandos admite cada uno, así que el editor
 * ofrece una lista cerrada en vez de un endpoint a mano.
 *
 * `value` solo lo usan los comandos parametrizados (faders de la Midas, nivel DALI). Se manda
 * en el cuerpo JSON, que **conserva el tipo numérico** —en GET todo llegaría como string y
 * los drivers que esperan un número lo rechazarían.
 */
export interface DeviceCommandAction {
  type: "command";
  deviceId: string;
  command: string;
  /** Solo en comandos parametrizados. En un slider vale "{{value}}". */
  value?: string;
  /**
   * Una macro se elige en el mismo desplegable que los equipos, pero se dispara con `POST
   * /api/macros/{id}/run`. Ausente en los diseños anteriores a las macros: equivale a "device".
   */
  kind?: "device" | "macro";
}

export interface NavigateAction {
  type: "navigate";
  /** ID de la pantalla destino. */
  screenId: string;
}

export type ElementAction = DeviceCommandAction | HttpAction | NavigateAction;

/** Acciones que hablan con el backend AV (las que un slider puede disparar). */
export type BackendAction = DeviceCommandAction | HttpAction;
