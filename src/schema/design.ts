import type { ElementAction, HttpAction } from "./action.ts";
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

export type ElementType = "button" | "slider" | "image" | "label" | "line" | "rectangle";

interface BaseElement {
  id: string;
  type: ElementType;
  position: Position;
  style?: ElementStyle;
}

export interface ButtonElement extends BaseElement {
  type: "button";
  label: string;
  action: ElementAction;
}

export interface SliderElement extends BaseElement {
  type: "slider";
  label?: string;
  min: number;
  max: number;
  step: number;
  value: number;
  /** Momento en el que se dispara la acción. Por defecto "release". */
  sendOn?: "change" | "release";
  action: HttpAction;
}

export interface ImageElement extends BaseElement {
  type: "image";
  src: string;
  /** Una imagen puede ser pulsable y disparar una acción opcional. */
  action?: ElementAction;
}

export interface LabelElement extends BaseElement {
  type: "label";
  text: string;
  align?: "left" | "center" | "right";
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

export type DesignElement =
  | ButtonElement
  | SliderElement
  | ImageElement
  | LabelElement
  | LineElement
  | RectangleElement;

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
