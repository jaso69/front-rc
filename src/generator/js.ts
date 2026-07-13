import type { BackendAction, DeviceCommandAction, ElementAction, HttpAction } from "../schema/action.ts";
import type { Design } from "../schema/design.ts";
import type { ButtonElement, DesignElement, ImageElement, LabelElement, SliderElement } from "../schema/design.ts";

/**
 * `POST /api/devices/{id}/commands/{cmd}`, la forma real de la API de jaso-rc.
 *
 * POST y no GET a propósito: en GET todos los parámetros llegan al driver como strings, y los
 * comandos parametrizados (fader de la Midas, nivel DALI) esperan un número. En el cuerpo JSON
 * el tipo se conserva.
 */
function commandActionCall(action: DeviceCommandAction, valueExpr?: string): string {
  const path = `"/api/devices/${encodeURIComponent(action.deviceId)}/commands/${encodeURIComponent(action.command)}"`;

  if (action.value === undefined) {
    return `send(${path}, "POST")`;
  }
  // El slider sustituye {{value}} por su valor; un botón puede llevar una constante fija.
  const value = action.value.includes("{{value}}") && valueExpr ? `Number(${valueExpr})` : JSON.stringify(action.value);
  return `send(${path}, "POST", { value: ${value} })`;
}

function backendActionCall(action: BackendAction, valueExpr?: string): string {
  return action.type === "command" ? commandActionCall(action, valueExpr) : httpActionCall(action, valueExpr);
}

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
  return backendActionCall(action, valueExpr);
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
    case "line":
      return "";
    case "rectangle":
      return "";
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
    ${backendActionCall(el.action, "el.value")}
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

export function generateJs(design: Design, name: string): string {
  const { width: W, height: H } = design.config.canvas;
  const safeName = name.replace(/[^a-zA-Z0-9-_]/g, "");

  const bindings = design.screens
    .flatMap((s) => s.elements)
    .map(elementBinding)
    .filter(Boolean)
    .join("\n\n");

  return `// ─────────────────────────────────────────────
// Configuración del diseño (generada)
// ─────────────────────────────────────────────
// El panel no habla con el backend AV: habla con el servidor que le sirve, y ese
// reenvía poniendo el token. Ni la credencial ni la dirección del backend aparecen
// aquí, y por eso este fichero puede vivir en cualquier tablet.
const BASE_URL = "/av/${safeName}";

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
      const detail = await res.text();
      console.error("[AV] error", res.status, endpoint, detail);
      showToast(errorMessage(res.status, detail));
      return;
    }
    // 200: jaso-rc responde { id, command, result } — result.raw es el eco del equipo y puede
    // venir vacío. No confirma el estado (para eso está /status), así que no lo mostramos.
  } catch (err) {
    console.error("[AV] fallo de red", endpoint, err);
    showToast("Sin conexión con el panel");
  }
}

// Todos los errores de jaso-rc vienen en el mismo sobre: {"error": "..."}. Lo preferimos al
// texto que podamos inventar aquí, salvo donde el código HTTP significa algo que el mensaje
// del backend no dice.
function errorMessage(status, body) {
  const backendMsg = parseError(body);

  if (status === 502) {
    // jaso-rc usa 502 para dos cosas distintas: el equipo no contesta (lo normal: proyector
    // apagado de la pared, cable suelto) y el comando no está configurado (un fallo del
    // diseño, no de la sala). Confundirlos manda a mirar el cable equivocado.
    if (backendMsg && backendMsg.includes("no configurado")) return backendMsg;
    return "El equipo no responde";
  }
  if (status === 401) return "El panel no está autorizado en el equipo AV";
  if (status === 403) return "Este panel es de solo lectura";
  if (status === 404) return "El equipo o el comando ya no existe";
  if (status === 503) return "El servidor no tiene token configurado";

  return backendMsg || "Error " + status;
}

function parseError(body) {
  try {
    const parsed = JSON.parse(body);
    return parsed && parsed.error ? parsed.error : null;
  } catch (e) {
    // El 403 de allow_cidrs llega en texto plano, no en el sobre JSON.
    return null;
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
