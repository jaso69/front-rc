import type { ElementAction, HttpAction } from "../schema/action.ts";
import type { Design } from "../schema/design.ts";
import type { ButtonElement, DesignElement, ImageElement, LabelElement, SliderElement } from "../schema/design.ts";

function httpActionCall(action: HttpAction, valueExpr?: string): string {
  const method = `"${action.method}"`;
  const endpoint = `"${action.endpoint}"`;

  if (!action.payload || Object.keys(action.payload).length === 0) {
    return `send(${endpoint}, ${method})`;
  }

  const payloadJson = JSON.stringify(action.payload);

  if (valueExpr) {
    return `send(${endpoint}, ${method}, interpolate(${payloadJson}, ${valueExpr}))`;
  }
  return `send(${endpoint}, ${method}, ${payloadJson})`;
}

function actionCall(action: ElementAction, valueExpr?: string): string {
  if (action.type === "navigate") {
    return `showScreen("${action.screenId}")`;
  }
  return httpActionCall(action, valueExpr);
}

function elementBinding(el: DesignElement): string {
  switch (el.type) {
    case "button":
      return buttonBinding(el);
    case "slider":
      return sliderBinding(el);
    case "image":
      return imageBinding(el);
    case "label":
      return labelBinding(el);
  }
}

function buttonBinding(el: ButtonElement): string {
  return `(function() {
  const el = document.getElementById("${el.id}");
  el.addEventListener("click", () => {
    ${actionCall(el.action)}
  });
})();`;
}

function sliderBinding(el: SliderElement): string {
  const event = (el.sendOn ?? "release") === "release" ? "change" : "input";
  return `(function() {
  const el = document.getElementById("${el.id}");
  el.addEventListener("${event}", () => {
    ${httpActionCall(el.action, "el.value")}
  });
})();`;
}

function imageBinding(el: ImageElement): string {
  if (!el.action && !el.src) return "";
  const parts: string[] = [];

  if (!el.src) {
    return `(function() {
  const el = document.getElementById("${el.id}");
  el.addEventListener("error", function() {
    el.style.display = "none";
  });
})();`;
  }

  if (el.action) {
    parts.push(`  el.addEventListener("click", () => {
    ${actionCall(el.action)}
  });`);
  }
  return `(function() {
  const el = document.getElementById("${el.id}");
  el.addEventListener("error", function() {
    el.style.opacity = "0.3";
    el.style.background = "#333";
  });
${parts.join("\n")}
})();`;
}

function labelBinding(_el: LabelElement): string {
  return "";
}

export function generateJs(design: Design): string {
  const { baseUrl } = design.config;
  const { width: W, height: H } = design.config.canvas;

  const bindings = design.screens
    .flatMap((s) => s.elements)
    .map(elementBinding)
    .filter(Boolean)
    .join("\n\n");

  return `// ─────────────────────────────────────────────
// Configuración del diseño (generada)
// ─────────────────────────────────────────────
const BASE_URL = "${baseUrl}";

// ─────────────────────────────────────────────
// Helpers (fijos, no generados)
// ─────────────────────────────────────────────

let _toastTimer = null;
function showToast(msg) {
  let t = document.querySelector(".rc-toast");
  if (!t) {
    t = document.createElement("div");
    t.className = "rc-toast";
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(function() { t.classList.remove("show"); }, 3000);
}

async function send(endpoint, method, payload) {
  let url = BASE_URL + endpoint;
  const init = { method, headers: {} };

  if (payload && Object.keys(payload).length > 0) {
    if (method === "GET") {
      url += (endpoint.includes("?") ? "&" : "?") + new URLSearchParams(payload).toString();
    } else {
      init.headers["Content-Type"] = "application/json";
      init.body = JSON.stringify(payload);
    }
  }

  try {
    const res = await fetch(url, init);
    if (!res.ok) {
      console.error("[AV] error", res.status, endpoint);
      showToast("Error " + res.status + ": " + endpoint);
    }
  } catch (err) {
    console.error("[AV] fallo de red", endpoint, err);
    showToast("Sin conexión: " + endpoint);
  }
}

function interpolate(payload, value) {
  const out = {};
  for (const [k, v] of Object.entries(payload)) {
    out[k] = v.replaceAll("{{value}}", String(value));
  }
  return out;
}

function showScreen(id) {
  document.querySelectorAll(".screen").forEach(function(s) {
    s.classList.remove("active");
  });
  const target = document.getElementById("screen-" + id);
  if (target) target.classList.add("active");
}

// Escala el lienzo al viewport manteniendo aspect ratio
function fitCanvas() {
  const canvas = document.getElementById("rc-canvas");
  const W = ${W}, H = ${H};
  const scale = Math.min(window.innerWidth / W, window.innerHeight / H);
  canvas.style.transform = \`scale(\${scale})\`;
}
window.addEventListener("resize", fitCanvas);
fitCanvas();

// ─────────────────────────────────────────────
// Bindings de elementos (generados por elemento)
// ─────────────────────────────────────────────
${bindings}
`;
}
