// Geometría y estilos de los elementos del diseño

export interface Position {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ElementStyle {
  backgroundColor?: string;
  color?: string;
  fontSize?: number;
  borderRadius?: number;
  borderColor?: string;
  borderWidth?: number;
  opacity?: number;
}

// Unidades absolutas en píxeles. El lienzo del editor define el tamaño
// de la pantalla objetivo (p. ej. 1280x800) y las posiciones son relativas a él.
export interface CanvasSize {
  width: number;
  height: number;
}

// ──────────────────────────────────────────────
// Fondo de pantalla
// ──────────────────────────────────────────────

export type Background =
  | { type: "color"; color: string }
  | { type: "gradient"; from: string; to: string; angle: number }
  | { type: "image"; src: string };
