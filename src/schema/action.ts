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

export interface NavigateAction {
  type: "navigate";
  /** ID de la pantalla destino. */
  screenId: string;
}

export type ElementAction = HttpAction | NavigateAction;
