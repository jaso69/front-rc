import type { Design } from "./design.ts";

// Ejemplo de diseño válido. Sirve de documentación viva del contrato
// y de entrada para el prototipo de generación (Fase 2).
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
          label: "Power",
          position: { x: 40, y: 100, width: 160, height: 80 },
          style: { backgroundColor: "#d33", color: "#fff", borderRadius: 8 },
          action: {
            type: "http",
            endpoint: "/api/power",
            method: "POST",
            payload: { device: "tv", state: "on" },
          },
        },
        {
          id: "slider-volume",
          type: "slider",
          label: "Volumen",
          min: 0,
          max: 100,
          step: 1,
          value: 35,
          sendOn: "release",
          position: { x: 40, y: 220, width: 300, height: 60 },
          action: {
            type: "http",
            endpoint: "/api/volume",
            method: "POST",
            payload: { level: "{{value}}" },
          },
        },
        {
          id: "img-logo",
          type: "image",
          src: "/assets/logo.png",
          position: { x: 1000, y: 100, width: 200, height: 120 },
          action: {
            type: "http",
            endpoint: "/api/input",
            method: "PUT",
            payload: { source: "hdmi1" },
          },
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
          id: "slider-brightness",
          type: "slider",
          label: "Brillo",
          min: 0,
          max: 100,
          step: 1,
          value: 75,
          sendOn: "release",
          position: { x: 40, y: 220, width: 300, height: 60 },
          action: {
            type: "http",
            endpoint: "/api/brightness",
            method: "POST",
            payload: { level: "{{value}}" },
          },
        },
      ],
    },
  ],
};
