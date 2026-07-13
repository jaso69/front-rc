import type { BackendAction, ElementAction } from "./action.ts";
import type { Background, CanvasSize, ElementStyle, Position } from "./style.ts";

// ──────────────────────────────────────────────
// Ajustes a nivel de diseño completo
// ──────────────────────────────────────────────

export interface DesignConfig {
  name: string;
  /** URL base del backend AV (intocable). Ej: "http://192.168.1.10:8080" */
  baseUrl: string;
  /** Tamaño del lienzo objetivo de las pantallas. */
  canvas: CanvasSize;
}

// ──────────────────────────────────────────────
// Elementos
// ──────────────────────────────────────────────

export type ElementType =
  | "button"
  | "slider"
  | "image"
  | "label"
  | "line"
  | "rectangle"
  | "checkbox"
  | "radio";

interface BaseElement {
  id: string;
  type: ElementType;
  position: Position;
  style?: ElementStyle;
}

/**
 * Feedback de estado: el elemento refleja lo que el equipo dice de sí mismo
 * (`GET /api/devices/{id}/status`), en vez de fingir que el comando que mandó surtió efecto.
 *
 * El contenido de `status` **depende del driver** y es un mapa abierto (power, input, level,
 * mute…): la API no publica qué claves trae cada equipo, así que el editor las descubre
 * preguntándole al equipo de verdad y ofrece las que ha devuelto.
 *
 * `reachable` lo pone todo equipo, y por eso un elemento con `state` se apaga solo cuando su
 * equipo no responde: en una sala, "el proyector está apagado" y "el proyector no contesta" son
 * cosas distintas y llevan a sitios distintos.
 */
export interface StateBinding {
  deviceId: string;
  /** Clave dentro de `status`. Ej: "power", "input", "level". */
  field: string;
  /**
   * Valor que se considera "encendido" en un botón, una casilla o un radio. Se compara como
   * texto (`"true"`, `"on"`, `"hdmi1"`). El slider y la etiqueta no lo usan: pintan el valor.
   */
  activeWhen?: string;
}

export interface ButtonElement extends BaseElement {
  type: "button";
  label: string;
  action: ElementAction;
  /** Si está, el botón se ilumina cuando el equipo está en ese estado. */
  state?: StateBinding;
}

export interface SliderElement extends BaseElement {
  type: "slider";
  label?: string;
  min: number;
  max: number;
  step: number;
  value: number;
  /** Por defecto "horizontal". En vertical, el mínimo queda abajo. */
  orientation?: "horizontal" | "vertical";
  /** Momento en el que se dispara la acción. Por defecto "release". */
  sendOn?: "change" | "release";
  action: BackendAction;
  /** Si está, el slider se coloca solo en el valor real del equipo (salvo mientras se arrastra). */
  state?: StateBinding;
}

export interface ImageElement extends BaseElement {
  type: "image";
  src: string;
  /** Una imagen puede ser pulsable y disparar una acción opcional. */
  action?: ElementAction;
}

export interface LabelElement extends BaseElement {
  type: "label";
  /** Con `state`, un "{{value}}" dentro del texto se sustituye por el valor real del equipo. */
  text: string;
  align?: "left" | "center" | "right";
  state?: StateBinding;
}

/** Línea divisoria horizontal o vertical. El color viene de style.backgroundColor. */
export interface LineElement extends BaseElement {
  type: "line";
  orientation: "horizontal" | "vertical";
}

/** Rectángulo decorativo para agrupar o separar secciones. */
export interface RectangleElement extends BaseElement {
  type: "rectangle";
}

/**
 * Casilla de dos estados. Marcar dispara `action`; desmarcar dispara `actionOff` si está
 * definida (encender/apagar, mute/unmute). Sin `actionOff`, desmarcar no manda nada.
 */
export interface CheckboxElement extends BaseElement {
  type: "checkbox";
  label: string;
  /** Estado con el que se pinta al cargar el panel, mientras no haya `state` que lo corrija. */
  checked?: boolean;
  action: BackendAction;
  actionOff?: BackendAction;
  /** Si está, la casilla se marca y se desmarca sola siguiendo al equipo. */
  state?: StateBinding;
}

/**
 * Opción excluyente. Los radios que comparten `group` dentro de una pantalla se excluyen entre
 * sí, que es justo lo que hace una matriz: una salida solo puede escuchar una entrada, así que
 * la fila de la salida es un grupo y cada entrada un radio. Solo dispara al seleccionarse.
 */
export interface RadioElement extends BaseElement {
  type: "radio";
  label: string;
  /** Nombre del grupo excluyente. Ej: "salida-1". */
  group: string;
  /** Opción marcada al cargar. Si hay varias del mismo grupo, gana la última. */
  selected?: boolean;
  action: BackendAction;
  /** Si está, el radio se marca solo cuando el equipo está en ese estado (la entrada activa). */
  state?: StateBinding;
}

export type DesignElement =
  | ButtonElement
  | SliderElement
  | ImageElement
  | LabelElement
  | LineElement
  | RectangleElement
  | CheckboxElement
  | RadioElement;

// ──────────────────────────────────────────────
// Pantalla y diseño completo
// ──────────────────────────────────────────────

export interface Screen {
  id: string;
  name: string;
  background?: Background;
  elements: DesignElement[];
}

export interface Design {
  config: DesignConfig;
  screens: Screen[];
}

// ──────────────────────────────────────────────
// Type guards de utilidad
// ──────────────────────────────────────────────

export function isButton(el: DesignElement): el is ButtonElement {
  return el.type === "button";
}

export function isSlider(el: DesignElement): el is SliderElement {
  return el.type === "slider";
}

export function isImage(el: DesignElement): el is ImageElement {
  return el.type === "image";
}

export function isLabel(el: DesignElement): el is LabelElement {
  return el.type === "label";
}
