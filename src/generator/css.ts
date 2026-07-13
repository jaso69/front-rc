import type { Design } from "../schema/design.ts";

export function generateCss(design: Design): string {
  const { width: W, height: H } = design.config.canvas;

  return `* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  -webkit-tap-highlight-color: transparent;
  -webkit-user-select: none;
  user-select: none;
}

html, body {
  height: 100%;
  background: #1a1a1a;
  overflow: hidden;
  font-family: system-ui, -apple-system, sans-serif;
  overscroll-behavior: none;
  touch-action: none;
}

body {
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Lienzo: tamaño fijo del diseño. Se escala con JS para encajar en el viewport. */
#rc-canvas {
  position: relative;
  width: ${W}px;
  height: ${H}px;
  background: #222;
  transform-origin: center center;
  touch-action: none;
}

.screen {
  position: absolute;
  inset: 0;
  display: none;
}
.screen.active { display: block; }

/* ── Botón ── */
.rc-btn {
  position: absolute;
  border: none;
  cursor: pointer;
  font-size: 18px;
  font-weight: 600;
  touch-action: manipulation;
  transition: transform 0.08s ease, filter 0.08s ease;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.rc-btn:active {
  transform: scale(0.96);
  filter: brightness(1.3);
}

/* ── Slider ── */
.rc-slider {
  position: absolute;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 6px;
  color: #fff;
  font-size: 14px;
  touch-action: none;
}
.rc-slider label {
  pointer-events: none;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.rc-slider input[type="range"] {
  width: 100%;
  -webkit-appearance: none;
  appearance: none;
  height: 8px;
  border-radius: 4px;
  background: #444;
  outline: none;
  touch-action: none;
}
/* Slider vertical. writing-mode es la forma estándar de girar un input[type=range] (Chrome 119+,
   Firefox 120+); direction rtl pone el mínimo abajo, que es lo que espera cualquiera que haya
   tocado un fader. El orient="vertical" del HTML cubre a los Firefox antiguos. */
.rc-slider.vertical {
  align-items: center;
}
.rc-slider.vertical input[type="range"] {
  writing-mode: vertical-lr;
  direction: rtl;
  width: 8px;
  height: 100%;
  flex: 1;
  min-height: 0;
}
.rc-slider input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #5af;
  border: 2px solid #fff;
  cursor: pointer;
}
.rc-slider input[type="range"]::-moz-range-thumb {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #5af;
  border: 2px solid #fff;
  cursor: pointer;
  border: none;
}

/* ── Feedback ──
   Dos cosas distintas, y conviene no confundirlas al mirarlas:
   · rc-busy / rc-ok / rc-err: qué ha pasado con LO QUE ACABO DE PULSAR (dura un segundo).
   · rc-active / rc-offline:   cómo está EL EQUIPO ahora mismo (lo dice él, no el botón). */

/* Enviando: la orden va de camino. El pulso deja claro que el panel no se ha quedado colgado. */
.rc-busy {
  animation: rc-pulse 1s ease-in-out infinite;
  cursor: progress;
}
@keyframes rc-pulse {
  0%, 100% { filter: brightness(1); }
  50%      { filter: brightness(1.5); }
}

/* Confirmado por el equipo / rechazado. Un destello, no un estado: lo que perdura es rc-active. */
.rc-ok  { box-shadow: inset 0 0 0 3px #3c9; }
.rc-err { box-shadow: inset 0 0 0 3px #e55; animation: rc-shake 0.3s ease; }
@keyframes rc-shake {
  25%  { transform: translateX(-3px); }
  75%  { transform: translateX(3px); }
}

/* El equipo ESTÁ en ese estado (proyector encendido, entrada activa, mute puesto). Tiene que
   verse desde el otro lado de la sala, que es donde está quien pregunta "¿está encendido?". */
.rc-active {
  filter: brightness(1.45);
  outline: 2px solid #5af;
  outline-offset: -2px;
}

/* El equipo no responde. No es "apagado": es que no sabemos nada de él, y fingir que sabemos es
   peor que no decir nada. Se atenúa, pero se deja pulsar: a veces el comando lo despierta. */
.rc-offline {
  opacity: 0.4;
  filter: grayscale(1);
}

/* ── Imagen ── */
.rc-img {
  position: absolute;
  cursor: pointer;
  object-fit: contain;
  touch-action: manipulation;
}

/* ── Casilla y opción ── */
.rc-check, .rc-radio {
  position: absolute;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 12px;
  color: #fff;
  font-size: 16px;
  cursor: pointer;
  overflow: hidden;
  touch-action: manipulation;
  transition: filter 0.08s ease;
}
.rc-check:active, .rc-radio:active { filter: brightness(1.3); }
/* La caja entera se ilumina al marcarse: en una matriz de vídeo la ruta activa tiene que verse
   desde el otro lado de la sala, no por un tick de 20px. */
.rc-check:has(:checked), .rc-radio:has(:checked) {
  filter: brightness(1.45);
  outline: 2px solid #5af;
  outline-offset: -2px;
}
.rc-check span, .rc-radio span {
  pointer-events: none;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.rc-check input, .rc-radio input {
  flex: none;
  width: 26px;
  height: 26px;
  accent-color: #5af;
  cursor: pointer;
}

/* ── Etiqueta ── */
.rc-label {
  position: absolute;
  display: flex;
  align-items: center;
  padding: 4px 8px;
  overflow: hidden;
  pointer-events: none;
  white-space: nowrap;
  text-overflow: ellipsis;
}

/* ── Línea ── */
.rc-line {
  position: absolute;
  pointer-events: none;
}

/* ── Rectángulo ── */
.rc-rect {
  position: absolute;
  pointer-events: none;
}

/* ── Feedback de error de red ── */
.rc-toast {
  position: fixed;
  bottom: 16px;
  left: 50%;
  transform: translateX(-50%);
  background: #d33;
  color: #fff;
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 14px;
  z-index: 9999;
  opacity: 0;
  transition: opacity 0.3s ease;
  pointer-events: none;
}
.rc-toast.show { opacity: 1; }
`;
}
