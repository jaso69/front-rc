import type { BackendAction, DeviceCommandAction, ElementAction, HttpAction } from "../schema/action.ts";
import type { Design } from "../schema/design.ts";
import type { ButtonElement, CheckboxElement, DesignElement, ImageElement, LabelElement, RadioElement, SliderElement } from "../schema/design.ts";

/**
 * `POST /api/devices/{id}/commands/{cmd}`, la forma real de la API de jaso-rc.
 *
 * POST y no GET a propósito: en GET todos los parámetros llegan al driver como strings, y los
 * comandos parametrizados (fader de la Midas, nivel DALI) esperan un número. En el cuerpo JSON
 * el tipo se conserva.
 */
function commandActionCall(action: DeviceCommandAction, valueExpr?: string): string {
  // Una macro no es un equipo: se lanza con `POST /api/macros/{id}/run`, que responde 202 y
  // sigue en segundo plano. No admite parámetros, así que aquí se acaba.
  if (action.kind === "macro") {
    return `runMacro("${encodeURIComponent(action.deviceId)}")`;
  }

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

/**
 * Lo que dispara un elemento al tocarlo, envuelto en el feedback de pulsación: el elemento se
 * marca "enviando" y termina en verde o en rojo. Una orden que viaja por red y llega a un
 * proyector tarda lo suyo, y un botón que no acusa recibo se pulsa tres veces.
 *
 * Navegar entre pantallas no se envuelve: es instantáneo y no puede fallar.
 */
function dispatch(action: ElementAction, valueExpr?: string): string {
  if (action.type === "navigate") return actionCall(action, valueExpr);
  return `feedback(el, ${actionCall(action, valueExpr)})`;
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
    case "checkbox":
      return checkboxBinding(el);
    case "radio":
      return radioBinding(el);
    case "line":
      return "";
    case "rectangle":
      return "";
  }
}

function checkboxBinding(el: CheckboxElement): string {
  const off = el.actionOff ? dispatch(el.actionOff) : "";
  return `(function() {
  const el = document.getElementById("${el.id}");
  el.addEventListener("change", () => {
    if (el.checked) {
      ${dispatch(el.action)};
    }${off ? ` else {
      ${off};
    }` : ""}
  });
})();`;
}

/** El radio solo manda al quedar marcado: el que se apaga del grupo no dispara nada. */
function radioBinding(el: RadioElement): string {
  return `(function() {
  const el = document.getElementById("${el.id}");
  el.addEventListener("change", () => {
    if (el.checked) {
      ${dispatch(el.action)};
    }
  });
})();`;
}

function buttonBinding(el: ButtonElement): string {
  return `(function() {
  const el = document.getElementById("${el.id}");
  el.addEventListener("click", () => {
    ${dispatch(el.action)}
  });
})();`;
}

function sliderBinding(el: SliderElement): string {
  const event = (el.sendOn ?? "release") === "release" ? "change" : "input";
  return `(function() {
  const el = document.getElementById("${el.id}");
  el.addEventListener("${event}", () => {
    ${dispatch(el.action, "el.value")}
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
    ${dispatch(el.action)}
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

  const elements = design.screens.flatMap((s) => s.elements);

  const bindings = elements.map(elementBinding).filter(Boolean).join("\n\n");

  const stateBindings = elements.flatMap((el) => {
    if (!("state" in el) || !el.state?.deviceId || !el.state.field) return [];
    return [
      {
        id: el.id,
        type: el.type,
        device: el.state.deviceId,
        field: el.state.field,
        activeWhen: el.state.activeWhen ?? "",
        // La etiqueta necesita su plantilla para interpolar el valor ("Volumen: {{value}}").
        ...(el.type === "label" ? { text: el.text } : {}),
      },
    ];
  });

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
      return false;
    }
    // 200: jaso-rc responde { id, command, result } — result.raw es el eco del equipo y puede
    // venir vacío. No confirma el estado (para eso está /status), así que no lo mostramos.
    return true;
  } catch (err) {
    console.error("[AV] fallo de red", endpoint, err);
    showToast("Sin conexión con el panel");
    return false;
  }
}

// ── Feedback de pulsación ──
// Un comando AV no es instantáneo: viaja por red y termina en un proyector que tarda en
// contestar. Sin acuse de recibo, el usuario pulsa otra vez —y esa es la forma de mandar dos
// veces "cambiar de entrada"—. El elemento se marca mientras va, y termina en verde o en rojo.

const OK_MS = 1200;

function feedback(el, promise) {
  // La casilla, el radio y el slider son un <input> dentro de una etiqueta: lo que se ve (y lo
  // que hay que pintar) es el envoltorio.
  const box = el.closest(".rc-check, .rc-radio, .rc-slider") || el;
  box.classList.remove("rc-ok", "rc-err");
  box.classList.add("rc-busy");

  return Promise.resolve(promise).then(function(ok) {
    box.classList.remove("rc-busy");
    box.classList.add(ok ? "rc-ok" : "rc-err");
    setTimeout(function() { box.classList.remove("rc-ok", "rc-err"); }, OK_MS);
    // Un comando que ha ido bien cambia el equipo: preguntamos por su estado en vez de dar por
    // hecho lo que hemos pedido. El equipo es la fuente de verdad, no el botón.
    if (ok) setTimeout(refreshStatus, 300);
    return ok;
  });
}

// ── Macros ──
// Una macro no responde como un comando: POST /api/macros/{id}/run devuelve 202 al instante
// con el id de la ejecución y la secuencia sigue en el servidor. El 202 solo dice "lo he
// cogido", no "ha salido bien" —un proyector que no arranca lo dirá minutos después—, así que
// sondeamos GET /api/runs/{id} hasta que la ejecución termina.

const MACRO_POLL_MS = 1000;
// Cortamos a los 2 min: una macro que sigue viva ahí no ha dejado de ir necesariamente, pero
// el panel no puede sondear para siempre, y quien está en la sala ya lo ha visto o no.
const MACRO_TIMEOUT_MS = 120000;

// Una macro en curso no se relanza: dos secuencias solapadas se pisan los comandos, y el doble
// clic en una pantalla táctil es lo normal, no la excepción.
const _running = new Set();

async function runMacro(id) {
  if (_running.has(id)) return false;
  _running.add(id);
  showToast("Ejecutando " + id + "…");

  try {
    const res = await fetch(BASE_URL + "/api/macros/" + id + "/run", { method: "POST" });
    if (!res.ok) {
      const detail = await res.text();
      console.error("[AV] error al lanzar la macro", res.status, id, detail);
      showToast(errorMessage(res.status, detail));
      return false;
    }

    const runId = readRunId(await res.json().catch(function() { return null; }));
    if (!runId) {
      // Sin id no hay nada que sondear. La macro se está ejecutando igual: el 2xx ya lo dice.
      console.warn("[AV] la macro no devolvió id de ejecución: no se puede seguir su estado");
      showToast("Macro lanzada");
      return true;
    }
    return await pollRun(id, runId);
  } catch (err) {
    console.error("[AV] fallo de red al lanzar la macro", id, err);
    showToast("Sin conexión con el panel");
    return false;
  } finally {
    _running.delete(id);
  }
}

async function pollRun(macroId, runId) {
  const deadline = Date.now() + MACRO_TIMEOUT_MS;

  while (Date.now() < deadline) {
    await new Promise(function(r) { setTimeout(r, MACRO_POLL_MS); });

    let run;
    try {
      const res = await fetch(BASE_URL + "/api/runs/" + encodeURIComponent(runId));
      if (!res.ok) {
        // Un fallo puntual del sondeo no significa que la macro haya fallado: seguimos mirando
        // hasta el plazo, y si de verdad está caído se agotará solo.
        console.error("[AV] no se pudo leer la ejecución", res.status, runId);
        continue;
      }
      run = await res.json();
    } catch (err) {
      console.error("[AV] fallo de red al leer la ejecución", runId, err);
      continue;
    }

    const state = runState(run);
    if (state === "running") continue;
    if (state === "ok") {
      showToast("Macro " + macroId + " completada");
    } else {
      console.error("[AV] la macro falló", macroId, run);
      showToast("Macro " + macroId + ": " + failureReason(run));
    }
    return state === "ok";
  }

  showToast("La macro " + macroId + " sigue en marcha");
  // Ni completada ni fallida: no sabemos. Lo tratamos como fallo a efectos del botón —el verde
  // significa "lo he visto terminar bien", y aquí no lo hemos visto.
  return false;
}

// El id de la ejecución, mire como lo mire el backend. Es el único dato del 202 que usamos.
function readRunId(body) {
  if (!body) return null;
  const id = body.id || body.run_id || body.runId || (body.run && body.run.id);
  return id ? String(id) : null;
}

/**
 * Traduce el estado de la ejecución a las tres cosas que el panel sabe pintar: sigue, ha ido
 * bien, ha fallado. Deliberadamente tolerante con el nombre del estado —lo que no reconocemos
 * lo damos por terminado y correcto, para no gritar "ha fallado" por un sinónimo.
 */
function runState(run) {
  if (!run) return "failed";
  if (run.error) return "failed";

  const raw = String(run.status || run.state || "").toLowerCase();
  if (["running", "pending", "queued", "in_progress"].includes(raw)) return "running";
  if (["failed", "error", "cancelled", "canceled", "aborted", "timeout"].includes(raw)) return "failed";
  return "ok";
}

/**
 * Por qué falló, en los términos de quien está en la sala. jaso-rc no pone un motivo en la
 * raíz: lo pone en el paso que se rompió (con on_error "continue" la macro sigue y el resto de
 * pasos salen bien), así que el primer paso en error es lo que hay que contar.
 */
function failureReason(run) {
  if (run && run.error) return run.error;

  const steps = (run && run.steps) || [];
  const bad = steps.find(function(s) { return s.status === "error" || s.status === "failed"; });
  if (!bad) return "ha fallado";

  const what = bad.device ? bad.device + " " + bad.command : "paso " + bad.index;
  // El error del driver trae la dirección y el puerto ("dial tcp 10.0.0.5:4352: i/o timeout"):
  // es ruido en un toast, pero el "no responde" de fondo es justo lo que hay que ver.
  const why = /timeout|refused|no route|unreachable/i.test(String(bad.error)) ? "no responde" : String(bad.error || "error");
  return what + " " + why;
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
// Feedback de estado (generado a partir del diseño)
// ─────────────────────────────────────────────
// Qué elemento sigue a qué equipo. Sale del diseño; si nadie pide estado, aquí no hay nada y
// el panel no sondea: una tablet no debe estar preguntando por equipos que a nadie le importan.
const STATE_BINDINGS = ${JSON.stringify(stateBindings)};

// jaso-rc cachea el estado 5 s: sondear más rápido no da datos más frescos, solo más tráfico.
const STATUS_POLL_MS = 5000;

/**
 * Pregunta a cada equipo cómo está y lo refleja en los elementos que lo siguen.
 *
 * El estado lo dice el equipo, no el botón: pulsar "encender" no pinta el botón de encendido,
 * lo pinta el proyector cuando confirma que lo está. Es la diferencia entre un mando que
 * informa y uno que miente en cuanto alguien apaga el proyector con el mando de la pared.
 */
async function refreshStatus() {
  if (STATE_BINDINGS.length === 0) return;

  const ids = [];
  for (const b of STATE_BINDINGS) if (ids.indexOf(b.device) === -1) ids.push(b.device);

  await Promise.all(ids.map(async function(id) {
    let status = null;
    try {
      const res = await fetch(BASE_URL + "/api/devices/" + encodeURIComponent(id) + "/status");
      if (res.ok) {
        const data = await res.json();
        status = data && data.status ? data.status : null;
      } else {
        console.error("[AV] no se pudo leer el estado de", id, res.status);
      }
    } catch (err) {
      // Sin red no sabemos nada del equipo: eso es "no responde", no "apagado".
      console.error("[AV] fallo de red al leer el estado de", id, err);
    }
    applyStatus(id, status);
  }));
}

function applyStatus(deviceId, status) {
  // Un equipo inalcanzable NO es un error HTTP: responde 200 con { reachable: false }. Y si no
  // hemos podido preguntar, tampoco sabemos nada: en ambos casos el elemento se apaga.
  const reachable = Boolean(status) && status.reachable !== false;

  for (const b of STATE_BINDINGS) {
    if (b.device !== deviceId) continue;
    const el = document.getElementById(b.id);
    if (!el) continue;
    const box = el.closest(".rc-check, .rc-radio, .rc-slider") || el;

    box.classList.toggle("rc-offline", !reachable);
    if (!reachable) {
      // Sin dato no hay valor que pintar, y dejar el "{{value}}" a la vista es peor que no
      // decir nada: la etiqueta enseña el hueco vacío, no su plantilla.
      if (b.type === "label") el.textContent = b.text.replaceAll("{{value}}", "—");
      continue;
    }

    const value = status[b.field];
    // El driver no publica esa clave. No la inventamos ni la damos por falsa: dejamos el
    // elemento como está, que es lo honesto.
    if (value === undefined) continue;

    if (b.type === "label") {
      el.textContent = b.text.includes("{{value}}") ? b.text.replaceAll("{{value}}", String(value)) : String(value);
      continue;
    }

    if (b.type === "slider") {
      // Mientras el usuario arrastra, el equipo no manda: se le movería el dedo debajo.
      if (el.dataset.dragging === "1" || el === document.activeElement) continue;
      const n = Number(value);
      if (!Number.isNaN(n)) el.value = n;
      continue;
    }

    const on = String(value) === String(b.activeWhen);
    if (b.type === "button") box.classList.toggle("rc-active", on);
    else el.checked = on;
  }
}

if (STATE_BINDINGS.length > 0) {
  // Un slider en curso no se corrige a media pulsación.
  document.querySelectorAll('input[type="range"]').forEach(function(r) {
    r.addEventListener("pointerdown", function() { r.dataset.dragging = "1"; });
    ["pointerup", "pointercancel", "blur"].forEach(function(ev) {
      r.addEventListener(ev, function() { delete r.dataset.dragging; });
    });
  });

  refreshStatus();
  setInterval(function() {
    // Una tablet con la pantalla apagada no necesita saber nada; al volver, se refresca de golpe.
    if (!document.hidden) refreshStatus();
  }, STATUS_POLL_MS);
  document.addEventListener("visibilitychange", function() {
    if (!document.hidden) refreshStatus();
  });
}

// ─────────────────────────────────────────────
// Bindings de elementos (generados por elemento)
// ─────────────────────────────────────────────
${bindings}
`;
}
