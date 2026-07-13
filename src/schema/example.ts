import type { Design } from "./design.ts";

// Ejemplo de diseño válido. Sirve de documentación viva del contrato.
//
// Los `deviceId` y los `command` no son inventados: son los que publica `GET /api/devices` de
// jaso-rc. Cámbialos por los de tu instalación —el editor los ofrece en un desplegable.
export const exampleDesign: Design = {
  config: {
    name: "Salón",
    baseUrl: "http://localhost:8080",
    canvas: { width: 1280, height: 800 },
  },
  screens: [
    {
      id: "main",
      name: "Principal",
      background: { type: "gradient", from: "#1a2a3a", to: "#0a0a0a", angle: 135 },
      elements: [
        {
          id: "lbl-title",
          type: "label",
          text: "Control Salón",
          align: "center",
          position: { x: 340, y: 20, width: 600, height: 50 },
          style: { color: "#fff", fontSize: 28 },
        },
        {
          id: "btn-power",
          type: "button",
          label: "Encender",
          position: { x: 40, y: 100, width: 160, height: 80 },
          style: { backgroundColor: "#d33", color: "#fff", borderRadius: 8 },
          action: { type: "command", deviceId: "monitor", command: "power_on" },
        },
        {
          id: "slider-volume",
          type: "slider",
          label: "Volumen",
          // El fader de la Midas va de 0 a 1: el rango del slider es el del comando, no un 0–100
          // de adorno. `value` viaja como número en el cuerpo JSON.
          min: 0,
          max: 1,
          step: 0.01,
          value: 0.35,
          sendOn: "release",
          position: { x: 40, y: 220, width: 300, height: 60 },
          action: { type: "command", deviceId: "midas", command: "main_fader", value: "{{value}}" },
        },
        {
          id: "img-logo",
          type: "image",
          src: "/assets/logo.png",
          position: { x: 1000, y: 100, width: 200, height: 120 },
          action: { type: "command", deviceId: "monitor", command: "input_hdmi1" },
        },
        {
          id: "btn-to-settings",
          type: "button",
          label: "Ajustes →",
          position: { x: 40, y: 700, width: 160, height: 60 },
          style: { backgroundColor: "#444", color: "#fff", borderRadius: 8 },
          action: { type: "navigate", screenId: "settings" },
        },
      ],
    },
    {
      id: "settings",
      name: "Ajustes",
      background: { type: "color", color: "#1a1a2a" },
      elements: [
        {
          id: "lbl-settings",
          type: "label",
          text: "Ajustes del sistema",
          align: "center",
          position: { x: 340, y: 20, width: 600, height: 50 },
          style: { color: "#fff", fontSize: 28 },
        },
        {
          id: "btn-back",
          type: "button",
          label: "← Volver",
          position: { x: 40, y: 100, width: 160, height: 60 },
          style: { backgroundColor: "#444", color: "#fff", borderRadius: 8 },
          action: { type: "navigate", screenId: "main" },
        },
        {
          id: "slider-ch1",
          type: "slider",
          label: "Canal 1",
          min: 0,
          max: 1,
          step: 0.01,
          value: 0.75,
          sendOn: "release",
          position: { x: 40, y: 220, width: 300, height: 60 },
          action: { type: "command", deviceId: "midas", command: "ch1_fader", value: "{{value}}" },
        },
      ],
    },
  ],
};
