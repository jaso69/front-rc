import type {
  ButtonElement,
  Design,
  DesignElement,
  ElementType,
  ImageElement,
  LabelElement,
  LineElement,
  RectangleElement,
  SliderElement,
} from "@schema/design.ts";

let counter = 0;
function genId(): string {
  counter += 1;
  return `el-${Date.now().toString(36)}-${counter}`;
}

export function createElement(type: ElementType, x: number, y: number): DesignElement {
  const id = genId();
  const px = Math.round(x);
  const py = Math.round(y);

  switch (type) {
    case "button": {
      const el: ButtonElement = {
        id,
        type: "button",
        label: "Botón",
        position: { x: px, y: py, width: 140, height: 60 },
        style: { backgroundColor: "#2a6dbd", color: "#fff", borderRadius: 8 },
        action: { type: "http", endpoint: "/api/", method: "POST" },
      };
      return el;
    }
    case "slider": {
      const el: SliderElement = {
        id,
        type: "slider",
        label: "Slider",
        min: 0,
        max: 100,
        step: 1,
        value: 50,
        sendOn: "release",
        position: { x: px, y: py, width: 280, height: 60 },
        action: { type: "http", endpoint: "/api/", method: "POST", payload: { value: "{{value}}" } },
      };
      return el;
    }
    case "image": {
      const el: ImageElement = {
        id,
        type: "image",
        src: "",
        position: { x: px, y: py, width: 200, height: 140 },
      };
      return el;
    }
    case "label": {
      const el: LabelElement = {
        id,
        type: "label",
        text: "Etiqueta",
        align: "left",
        position: { x: px, y: py, width: 200, height: 40 },
        style: { color: "#fff", fontSize: 16 },
      };
      return el;
    }
    case "line": {
      const el: LineElement = {
        id,
        type: "line",
        orientation: "horizontal",
        position: { x: px, y: py, width: 240, height: 2 },
        style: { backgroundColor: "#666" },
      };
      return el;
    }
    case "rectangle": {
      const el: RectangleElement = {
        id,
        type: "rectangle",
        position: { x: px, y: py, width: 280, height: 180 },
        style: {
          backgroundColor: "rgba(255,255,255,0.05)",
          borderRadius: 10,
          borderColor: "rgba(255,255,255,0.15)",
          borderWidth: 1,
        },
      };
      return el;
    }
  }
}

export function createEmptyDesign(name: string, width: number, height: number): Design {
  return {
    config: {
      name,
      baseUrl: "http://localhost:8080",
      canvas: { width, height },
    },
    screens: [{ id: "main", name: "Principal", elements: [] }],
  };
}

export function genScreenId(): string {
  counter += 1;
  return `screen-${Date.now().toString(36)}-${counter}`;
}
