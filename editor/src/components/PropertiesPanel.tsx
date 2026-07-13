import { useState } from "react";
import type { BackendAction, DeviceCommandAction, ElementAction, HttpAction, HttpMethod, NavigateAction } from "@schema/action.ts";
import type { Background } from "@schema/style.ts";
import type { ButtonElement, CheckboxElement, Design, DesignElement, ImageElement, LabelElement, LineElement, RadioElement, Screen, SliderElement, StateBinding } from "@schema/design.ts";
import { isMacro } from "@schema/device.ts";
import { readDeviceStatus } from "../api.ts";
import type { DesignState, ElementPatch } from "../useDesign.ts";
import type { DevicesState } from "../useDevices.ts";
import { useDevices } from "../useDevices.ts";
import { AssetPicker } from "./AssetPicker.tsx";

// Normaliza un valor hex para el input type="color" (requiere #rrggbb).
function normalizeHex(v: string): string {
  return /^#[0-9a-fA-F]{6}$/.test(v) ? v : "#000000";
}

// Campo de color: selector visual + input de texto para el valor hex.
function ColorField({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div className="src-row">
      <input
        type="color"
        value={normalizeHex(value)}
        onChange={(e) => onChange(e.target.value)}
        title="Seleccionar color"
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}

interface Props {
  state: DesignState;
}

// ── Sub-components ──

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="field">
      <label>{label}</label>
      {children}
    </div>
  );
}

// Campo de origen de imagen: input de texto + botón para abrir el selector de assets.
function ImageSourceField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [pickerOpen, setPickerOpen] = useState(false);
  return (
    <>
      <div className="src-row">
        <input type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder="/assets/logo.png" />
        <button className="btn-browse" onClick={() => setPickerOpen(true)} title="Examinar assets">Examinar</button>
      </div>
      <AssetPicker
        open={pickerOpen}
        onPick={(p) => { onChange(p); setPickerOpen(false); }}
        onClose={() => setPickerOpen(false)}
      />
    </>
  );
}

// ── Background editor ──

function BackgroundEditor({ bg, onChange }: { bg: Background | undefined; onChange: (bg: Background | undefined) => void }) {
  const currentType = bg?.type ?? "none";

  return (
    <>
      <Field label="Tipo de fondo">
        <select value={currentType} onChange={(e) => {
          const t = e.target.value;
          if (t === "none") { onChange(undefined); return; }
          if (t === "color") { onChange({ type: "color", color: "#222" }); return; }
          if (t === "gradient") { onChange({ type: "gradient", from: "#1a2a3a", to: "#0a0a0a", angle: 135 }); return; }
          if (t === "image") { onChange({ type: "image", src: "" }); return; }
        }}>
          <option value="none">Sin fondo</option>
          <option value="color">Color sólido</option>
          <option value="gradient">Gradiente</option>
          <option value="image">Imagen</option>
        </select>
      </Field>
      {bg?.type === "color" && (
        <Field label="Color">
          <ColorField value={bg.color} onChange={(v) => onChange({ ...bg, color: v })} />
        </Field>
      )}
      {bg?.type === "gradient" && (
        <>
          <div className="row">
            <Field label="Desde"><ColorField value={bg.from} onChange={(v) => onChange({ ...bg, from: v })} /></Field>
            <Field label="Hasta"><ColorField value={bg.to} onChange={(v) => onChange({ ...bg, to: v })} /></Field>
          </div>
          <Field label="Ángulo (grados)">
            <input type="number" value={bg.angle} onChange={(e) => onChange({ ...bg, angle: Number(e.target.value) })} />
          </Field>
        </>
      )}
      {bg?.type === "image" && (
        <Field label="Imagen">
          <ImageSourceField value={bg.src} onChange={(src) => onChange({ ...bg, src })} />
        </Field>
      )}
    </>
  );
}

// ── Action editor (comando de equipo, HTTP crudo o navegación) ──

type ActionKind = "command" | "http" | "navigate";

function TypeSelector({ value, allowNavigate, onChange }: { value: ActionKind; allowNavigate: boolean; onChange: (k: ActionKind) => void }) {
  return (
    <Field label="Tipo de acción">
      <select value={value} onChange={(e) => onChange(e.target.value as ActionKind)}>
        <option value="command">Comando de equipo</option>
        {/* Una casilla o un radio no navegan: cambiar de pantalla al marcar dejaría el estado
            marcado detrás, sin nada que lo haya activado. */}
        {allowNavigate && <option value="navigate">Navegar a pantalla</option>}
        <option value="http">Petición HTTP (avanzado)</option>
      </select>
    </Field>
  );
}

/**
 * Editor de comandos contra jaso-rc. Equipo y comando salen del catálogo del backend
 * (`GET /api/devices`), que es la única fuente que dice qué se puede ejecutar: escribirlos a
 * mano solo sirve para descubrir el 404 en la sala, con la reunión empezando.
 */
function CommandEditor({
  action,
  devices,
  isSlider,
  onChange,
}: {
  action: DeviceCommandAction;
  devices: DevicesState;
  isSlider: boolean;
  onChange: (a: ElementAction) => void;
}) {
  const device = devices.devices.find((d) => d.id === action.deviceId);
  // Un comando guardado que ya no está en el equipo: el integrador lo renombró o lo quitó.
  const unknownCommand = Boolean(action.command) && Boolean(device) && !device!.commands.includes(action.command);
  const macro = action.kind === "macro";
  const equipos = devices.devices.filter((d) => !isMacro(d));
  const macros = devices.devices.filter(isMacro);

  function setCommand(patch: Partial<DeviceCommandAction>) {
    onChange({ ...action, ...patch });
  }

  return (
    <>
      <Field label="Equipo o macro">
        <select
          value={action.deviceId}
          onChange={(e) => {
            // Cambiar de equipo invalida el comando: cada equipo tiene los suyos. Y una macro no
            // lleva valor: arrastrarlo del equipo anterior mandaría un parámetro que nadie lee.
            const next = devices.devices.find((d) => d.id === e.target.value);
            const kind = next?.kind ?? "device";
            setCommand({
              deviceId: e.target.value,
              command: next?.commands[0] ?? "",
              kind,
              ...(kind === "macro" ? { value: undefined } : {}),
            });
          }}
        >
          <option value="">— elige un equipo o una macro —</option>
          {equipos.map((d) => (
            <option key={d.id} value={d.id}>
              {d.id} ({d.driver})
            </option>
          ))}
          {macros.length > 0 && (
            <optgroup label="Macros">
              {macros.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.driver === "macro" ? m.id : `${m.driver} (${m.id})`}
                </option>
              ))}
            </optgroup>
          )}
          {action.deviceId && !device && <option value={action.deviceId}>{action.deviceId} (no está en el backend)</option>}
        </select>
      </Field>

      {macro ? (
        // Una macro es una secuencia ya escrita en el backend: no hay comando que elegir ni
        // parámetro que mandar. jaso-rc responde 202 y sigue por su cuenta.
        <p className="hint">Ejecuta la macro <code>{action.deviceId}</code> en el servidor.</p>
      ) : (
        <Field label="Comando">
          <select value={action.command} onChange={(e) => setCommand({ command: e.target.value })} disabled={!device}>
            <option value="">— elige un comando —</option>
            {device?.commands.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
            {unknownCommand && <option value={action.command}>{action.command} (ya no existe)</option>}
          </select>
        </Field>
      )}

      {macro ? null : isSlider ? (
        // El slider siempre manda su valor; jaso-rc lo espera en `value` y como número.
        <p className="hint">Envía <code>{"{ value: <posición del slider> }"}</code> al comando.</p>
      ) : (
        <Field label="Valor (solo comandos parametrizados: faders, nivel DALI)">
          <input
            type="text"
            placeholder="vacío = sin parámetro"
            value={action.value ?? ""}
            onChange={(e) => setCommand({ value: e.target.value === "" ? undefined : e.target.value })}
          />
        </Field>
      )}

      {devices.loading && <p className="hint">Consultando el backend AV…</p>}
      {devices.error && (
        <p className="msg err">
          {devices.error} <button className="btn-add" onClick={devices.reload}>Reintentar</button>
        </p>
      )}
      {!devices.loading && !devices.error && devices.devices.length === 0 && (
        <p className="hint">El backend AV no tiene equipos dados de alta.</p>
      )}
    </>
  );
}

/**
 * Editor del feedback de estado.
 *
 * Las claves de `status` (power, input, level…) las decide el driver y la API no las publica en
 * ningún catálogo, así que aquí no hay lista cerrada posible: **se le pregunta al equipo**. El
 * botón "Leer estado" trae lo que el equipo devuelve ahora mismo y ofrece esas claves y ese
 * valor, que es lo más parecido a un desplegable honesto que se puede hacer.
 */
function StateEditor({
  el,
  designName,
  devices,
  onChange,
}: {
  el: DesignElement;
  designName: string;
  devices: DevicesState;
  onChange: (s: StateBinding | undefined) => void;
}) {
  const state = "state" in el ? el.state : undefined;
  const [status, setStatus] = useState<Record<string, unknown> | null>(null);
  const [reading, setReading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Las macros no tienen estado que consultar: son una secuencia, no un equipo.
  const equipos = devices.devices.filter((d) => !isMacro(d));
  // El valor lo compara el panel como texto; el slider y la etiqueta pintan el valor, no lo comparan.
  const comparaValor = el.type === "button" || el.type === "checkbox" || el.type === "radio";

  async function readStatus(deviceId: string) {
    setReading(true);
    setError(null);
    try {
      const data = await readDeviceStatus(designName, deviceId);
      setStatus(data.status);
      if (data.status.reachable === false) {
        setError(`El equipo no responde${data.status.error ? `: ${data.status.error}` : ""}. Sin él no se pueden ver sus claves de estado.`);
      }
    } catch (err) {
      setStatus(null);
      setError((err as Error).message);
    } finally {
      setReading(false);
    }
  }

  if (!state) {
    return (
      <>
        <h3>Feedback de estado</h3>
        <p className="hint">
          Sin esto el elemento no refleja nada: manda la orden y se queda igual aunque alguien apague el
          equipo por otro lado.
        </p>
        <button className="btn-add" onClick={() => onChange({ deviceId: "", field: "" })}>
          + Seguir el estado de un equipo
        </button>
      </>
    );
  }

  // Claves que el equipo publica de verdad. `reachable` y `error` son del transporte, no del
  // equipo: no se ofrecen como estado a reflejar.
  const keys = Object.keys(status ?? {}).filter((k) => k !== "reachable" && k !== "error");
  const current = status?.[state.field];

  return (
    <>
      <h3>Feedback de estado</h3>

      <Field label="Equipo a seguir">
        <select
          value={state.deviceId}
          onChange={(e) => {
            setStatus(null);
            setError(null);
            onChange({ ...state, deviceId: e.target.value, field: "" });
            if (e.target.value) void readStatus(e.target.value);
          }}
        >
          <option value="">— elige un equipo —</option>
          {equipos.map((d) => (
            <option key={d.id} value={d.id}>{d.id} ({d.driver})</option>
          ))}
        </select>
      </Field>

      {state.deviceId && (
        <>
          <Field label="Estado a reflejar">
            <select value={state.field} onChange={(e) => onChange({ ...state, field: e.target.value })} disabled={keys.length === 0}>
              <option value="">— elige un estado —</option>
              {keys.map((k) => (
                <option key={k} value={k}>{k} (ahora: {String(status?.[k])})</option>
              ))}
              {/* Un estado guardado que el equipo ya no publica: se conserva, pero se avisa. */}
              {state.field && !keys.includes(state.field) && (
                <option value={state.field}>{state.field} (sin confirmar)</option>
              )}
            </select>
          </Field>

          {comparaValor && state.field && (
            <Field label="Se enciende cuando el estado vale">
              <input
                type="text"
                placeholder={current !== undefined ? String(current) : "p. ej. true, on, hdmi1"}
                value={state.activeWhen ?? ""}
                onChange={(e) => onChange({ ...state, activeWhen: e.target.value })}
              />
            </Field>
          )}

          {el.type === "label" && (
            <p className="hint">
              La etiqueta pinta el valor. Pon <code>{"{{value}}"}</code> en su texto para enmarcarlo
              (<code>Volumen: {"{{value}}"}</code>); sin él, se sustituye el texto entero.
            </p>
          )}

          <button className="btn-add" onClick={() => void readStatus(state.deviceId)} disabled={reading}>
            {reading ? "Leyendo…" : status ? "Volver a leer el estado" : "Leer estado del equipo"}
          </button>
          {!status && !error && !reading && (
            <p className="hint">Lee el estado del equipo para ver qué publica: cada driver publica lo suyo.</p>
          )}
          {error && <p className="msg err">{error}</p>}
        </>
      )}

      <button className="btn-danger" onClick={() => onChange(undefined)}>
        Quitar feedback de estado
      </button>
    </>
  );
}

function ActionEditor({
  action,
  screens,
  devices,
  isSlider = false,
  allowNavigate = true,
  onChange,
}: {
  action: ElementAction;
  screens: Screen[];
  devices: DevicesState;
  isSlider?: boolean;
  allowNavigate?: boolean;
  onChange: (a: ElementAction) => void;
}) {
  const [newKey, setNewKey] = useState("");
  const [newVal, setNewVal] = useState("");

  function setHttp(patch: Partial<HttpAction>) {
    onChange({ ...(action as HttpAction), ...patch });
  }

  function switchType(type: ActionKind) {
    if (type === "command") {
      onChange({ type: "command", deviceId: "", command: "", ...(isSlider ? { value: "{{value}}" } : {}) });
    } else if (type === "http") {
      onChange({ type: "http", endpoint: "/api/", method: "POST" });
    } else {
      onChange({ type: "navigate", screenId: screens[0]?.id ?? "" });
    }
  }

  if (action.type === "command") {
    return (
      <>
        <TypeSelector value="command" allowNavigate={allowNavigate} onChange={switchType} />
        <CommandEditor action={action} devices={devices} isSlider={isSlider} onChange={onChange} />
      </>
    );
  }

  if (action.type === "navigate") {
    return (
      <>
        <TypeSelector value="navigate" allowNavigate onChange={switchType} />
        <Field label="Pantalla destino">
          <select value={action.screenId} onChange={(e) => onChange({ type: "navigate", screenId: e.target.value })}>
            {screens.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </Field>
      </>
    );
  }

  const http = action;
  const entries: [string, string][] = http.payload ? Object.entries(http.payload) : [];

  function updatePayload(key: string, value: string) {
    const payload = { ...(http.payload ?? {}) };
    payload[key] = value;
    setHttp({ payload });
  }

  function addPayloadKey() {
    if (!newKey.trim()) return;
    const payload = { ...(http.payload ?? {}) };
    payload[newKey.trim()] = newVal;
    setHttp({ payload });
    setNewKey("");
    setNewVal("");
  }

  function delPayloadKey(key: string) {
    const payload = { ...(http.payload ?? {}) };
    delete payload[key];
    setHttp({ payload });
  }

  return (
    <>
      <TypeSelector value="http" allowNavigate={allowNavigate} onChange={switchType} />
      <p className="hint">
        Ruta cruda contra el backend AV. jaso-rc solo expone <code>/api/devices/…</code>: úsalo
        únicamente para algo que el catálogo no cubra.
      </p>
      <Field label="Endpoint">
        <input type="text" value={http.endpoint} onChange={(e) => setHttp({ endpoint: e.target.value })} />
      </Field>
      <Field label="Método">
        <select value={http.method} onChange={(e) => setHttp({ method: e.target.value as HttpMethod })}>
          {(["GET", "POST", "PUT", "PATCH", "DELETE"] as HttpMethod[]).map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
      </Field>
      <Field label="Payload (usa {{value}} para el valor del slider)">
        {entries.map(([k, v]) => (
          <div key={k} className="payload-row">
            <input type="text" value={k} onChange={(e) => {
              const payload = { ...(http.payload ?? {}) };
              delete payload[k];
              payload[e.target.value] = v;
              setHttp({ payload });
            }} />
            <input type="text" value={v} onChange={(e) => updatePayload(k, e.target.value)} />
            <button className="del-payload" onClick={() => delPayloadKey(k)}>×</button>
          </div>
        ))}
        <div className="payload-row">
          <input type="text" placeholder="clave" value={newKey} onChange={(e) => setNewKey(e.target.value)} />
          <input type="text" placeholder="valor" value={newVal} onChange={(e) => setNewVal(e.target.value)} />
          <button className="btn-add" onClick={addPayloadKey}>+</button>
        </div>
      </Field>
    </>
  );
}

// ── Element-specific sections ──

function ButtonProps({ el, update }: { el: ButtonElement; update: (p: ElementPatch) => void }) {
  return (
    <Field label="Texto">
      <input type="text" value={el.label} onChange={(e) => update({ label: e.target.value })} />
    </Field>
  );
}

function SliderProps({ el, update }: { el: SliderElement; update: (p: ElementPatch) => void }) {
  const orientation = el.orientation ?? "horizontal";

  function setOrientation(next: "horizontal" | "vertical") {
    if (next === orientation) return;
    // Girar el slider gira también su caja: un fader vertical dentro de un rectángulo de
    // 280×60 saldría aplastado, y nadie quiere reajustar el tamaño a mano cada vez.
    update({
      orientation: next,
      position: { ...el.position, width: el.position.height, height: el.position.width },
    } as ElementPatch);
  }

  return (
    <>
      <Field label="Etiqueta">
        <input type="text" value={el.label ?? ""} onChange={(e) => update({ label: e.target.value })} />
      </Field>
      <Field label="Orientación">
        <select value={orientation} onChange={(e) => setOrientation(e.target.value as "horizontal" | "vertical")}>
          <option value="horizontal">Horizontal</option>
          <option value="vertical">Vertical (mínimo abajo)</option>
        </select>
      </Field>
      <div className="row">
        <Field label="Mín"><input type="number" value={el.min} onChange={(e) => update({ min: Number(e.target.value) })} /></Field>
        <Field label="Máx"><input type="number" value={el.max} onChange={(e) => update({ max: Number(e.target.value) })} /></Field>
        <Field label="Paso"><input type="number" value={el.step} onChange={(e) => update({ step: Number(e.target.value) })} /></Field>
      </div>
      <Field label="Valor inicial">
        <input type="number" value={el.value} onChange={(e) => update({ value: Number(e.target.value) })} />
      </Field>
      <Field label="Enviar al">
        <select value={el.sendOn ?? "release"} onChange={(e) => update({ sendOn: e.target.value as "change" | "release" })}>
          <option value="release">Soltar (change)</option>
          <option value="change">Arrastrar (input)</option>
        </select>
      </Field>
    </>
  );
}

function CheckboxProps({ el, update }: { el: CheckboxElement; update: (p: ElementPatch) => void }) {
  return (
    <>
      <Field label="Texto">
        <input type="text" value={el.label} onChange={(e) => update({ label: e.target.value })} />
      </Field>
      <Field label="Estado inicial">
        <select value={el.checked ? "on" : "off"} onChange={(e) => update({ checked: e.target.value === "on" })}>
          <option value="off">Desmarcada</option>
          <option value="on">Marcada</option>
        </select>
      </Field>
    </>
  );
}

/** El grupo es lo que hace excluyentes a los radios: mismo grupo = misma fila de la matriz. */
function RadioProps({ el, groups, update }: { el: RadioElement; groups: string[]; update: (p: ElementPatch) => void }) {
  return (
    <>
      <Field label="Texto">
        <input type="text" value={el.label} onChange={(e) => update({ label: e.target.value })} />
      </Field>
      <Field label="Grupo (las opciones del mismo grupo se excluyen)">
        <input
          type="text"
          list="radio-groups"
          value={el.group}
          onChange={(e) => update({ group: e.target.value })}
          placeholder="salida-1"
        />
        <datalist id="radio-groups">
          {groups.map((g) => <option key={g} value={g} />)}
        </datalist>
      </Field>
      <Field label="Estado inicial">
        <select value={el.selected ? "on" : "off"} onChange={(e) => update({ selected: e.target.value === "on" })}>
          <option value="off">Sin seleccionar</option>
          <option value="on">Seleccionada</option>
        </select>
      </Field>
    </>
  );
}

function ImageProps({ el, update }: { el: ImageElement; update: (p: ElementPatch) => void }) {
  return (
    <Field label="Imagen">
      <ImageSourceField value={el.src} onChange={(src) => update({ src })} />
    </Field>
  );
}

function LabelProps({ el, update }: { el: LabelElement; update: (p: ElementPatch) => void }) {
  return (
    <>
      <Field label="Texto">
        <input type="text" value={el.text} onChange={(e) => update({ text: e.target.value })} />
      </Field>
      <Field label="Alineación">
        <select value={el.align ?? "left"} onChange={(e) => update({ align: e.target.value as "left" | "center" | "right" })}>
          <option value="left">Izquierda</option>
          <option value="center">Centro</option>
          <option value="right">Derecha</option>
        </select>
      </Field>
    </>
  );
}

function LineProps({ el, update }: { el: LineElement; update: (p: ElementPatch) => void }) {
  return (
    <Field label="Orientación">
      <select
        value={el.orientation}
        onChange={(e) => {
          const orientation = e.target.value as "horizontal" | "vertical";
          update({ orientation, position: { ...el.position, width: el.position.height, height: el.position.width } });
        }}
      >
        <option value="horizontal">Horizontal</option>
        <option value="vertical">Vertical</option>
      </select>
    </Field>
  );
}

function StyleEditor({ el, update }: { el: DesignElement; update: (p: ElementPatch) => void }) {
  const s = el.style ?? {};

  function setStyle(patch: Partial<typeof s>) {
    update({ style: { ...s, ...patch } });
  }

  return (
    <>
      <h3>Estilo</h3>
      <div className="row">
        <Field label="Fondo">
          <ColorField value={s.backgroundColor ?? ""} onChange={(v) => setStyle({ backgroundColor: v })} placeholder="#2a6dbd" />
        </Field>
        <Field label="Color texto">
          <ColorField value={s.color ?? ""} onChange={(v) => setStyle({ color: v })} placeholder="#fff" />
        </Field>
      </div>
      <div className="row">
        <Field label="Color borde">
          <ColorField value={s.borderColor ?? ""} onChange={(v) => setStyle({ borderColor: v })} placeholder="#666" />
        </Field>
        <Field label="Grosor borde">
          <input type="number" value={s.borderWidth ?? 0} onChange={(e) => setStyle({ borderWidth: Number(e.target.value) })} />
        </Field>
      </div>
      <div className="row">
        <Field label="Esquinas">
          <input type="number" value={s.borderRadius ?? 0} onChange={(e) => setStyle({ borderRadius: Number(e.target.value) })} />
        </Field>
        <Field label="Tamaño fuente">
          <input type="number" value={s.fontSize ?? 0} onChange={(e) => setStyle({ fontSize: Number(e.target.value) })} />
        </Field>
      </div>
      <Field label="Opacidad">
        <input type="number" min={0} max={1} step={0.1} value={s.opacity ?? 1} onChange={(e) => setStyle({ opacity: Number(e.target.value) })} />
      </Field>
    </>
  );
}

// ── Main panel ──

const TITLES: Record<DesignElement["type"], string> = {
  button: "Botón",
  slider: "Slider",
  image: "Imagen",
  label: "Etiqueta",
  line: "Línea",
  rectangle: "Rectángulo",
  checkbox: "Casilla",
  radio: "Opción",
};

export function PropertiesPanel({ state }: Props) {
  const { design, designName, screenIndex, selectedElementId, updateElement, updateConfig, deleteElement, updateScreenBackground } = state;

  // Antes de cualquier return: el catálogo se pide una vez por diseño, no por elemento.
  const devices = useDevices(designName, design?.config.baseUrl);

  if (!design) return null;
  const screen = design.screens[screenIndex];
  if (!screen) return null;

  // No element selected → show design config + screen background
  if (!selectedElementId) {
    return (
      <div className="properties">
        <h3>Configuración del diseño</h3>
        <Field label="Nombre">
          <input type="text" value={design.config.name} onChange={(e) => updateConfig({ name: e.target.value })} />
        </Field>
        <Field label="URL base del backend AV">
          <input type="text" value={design.config.baseUrl} onChange={(e) => updateConfig({ baseUrl: e.target.value })} />
        </Field>
        <div className="row">
          <Field label="Ancho lienzo">
            <input type="number" value={design.config.canvas.width} onChange={(e) => updateConfig({ canvas: { ...design.config.canvas, width: Number(e.target.value) } })} />
          </Field>
          <Field label="Alto lienzo">
            <input type="number" value={design.config.canvas.height} onChange={(e) => updateConfig({ canvas: { ...design.config.canvas, height: Number(e.target.value) } })} />
          </Field>
        </div>

        <h3>Fondo de pantalla: {screen.name}</h3>
        <BackgroundEditor bg={screen.background} onChange={(bg) => updateScreenBackground(screenIndex, bg)} />

        <p className="empty">Selecciona un elemento para editar sus propiedades</p>
      </div>
    );
  }

  const el = screen.elements.find((e) => e.id === selectedElementId);
  if (!el) return null;

  function update(patch: ElementPatch) {
    updateElement(el!.id, patch);
  }

  function updateAction(action: ElementAction) {
    update({ action } as ElementPatch);
  }

  const imageAction = el.type === "image" ? (el as ImageElement).action : undefined;
  // Grupos ya usados en la pantalla: al añadir la cuarta entrada de una salida no hay que
  // recordar cómo se escribió el grupo en las tres anteriores.
  const radioGroups = [...new Set(screen.elements.filter((e): e is RadioElement => e.type === "radio").map((e) => e.group).filter(Boolean))];

  return (
    <div className="properties" onPointerDown={(e) => e.stopPropagation()}>
      <h3>{TITLES[el.type]}</h3>

      <div className="row">
        <Field label="X"><input type="number" value={el.position.x} onChange={(e) => update({ position: { ...el.position, x: Number(e.target.value) } })} /></Field>
        <Field label="Y"><input type="number" value={el.position.y} onChange={(e) => update({ position: { ...el.position, y: Number(e.target.value) } })} /></Field>
      </div>
      <div className="row">
        <Field label="Ancho"><input type="number" value={el.position.width} onChange={(e) => update({ position: { ...el.position, width: Number(e.target.value) } })} /></Field>
        <Field label="Alto"><input type="number" value={el.position.height} onChange={(e) => update({ position: { ...el.position, height: Number(e.target.value) } })} /></Field>
      </div>

      {el.type === "button" && <ButtonProps el={el} update={update} />}
      {el.type === "slider" && <SliderProps el={el} update={update} />}
      {el.type === "image" && <ImageProps el={el} update={update} />}
      {el.type === "label" && <LabelProps el={el} update={update} />}
      {el.type === "line" && <LineProps el={el} update={update} />}
      {el.type === "checkbox" && <CheckboxProps el={el} update={update} />}
      {el.type === "radio" && <RadioProps el={el} groups={radioGroups} update={update} />}

      {el.type === "radio" && (
        <>
          <h3>Acción al seleccionar</h3>
          <ActionEditor
            action={el.action}
            screens={design.screens}
            devices={devices}
            allowNavigate={false}
            onChange={updateAction}
          />
        </>
      )}

      {el.type === "checkbox" && (
        <>
          <h3>Acción al marcar</h3>
          <ActionEditor
            action={el.action}
            screens={design.screens}
            devices={devices}
            allowNavigate={false}
            onChange={updateAction}
          />

          <h3>Acción al desmarcar</h3>
          {el.actionOff ? (
            <>
              <ActionEditor
                action={el.actionOff}
                screens={design.screens}
                devices={devices}
                allowNavigate={false}
                onChange={(a) => update({ actionOff: a as BackendAction } as ElementPatch)}
              />
              <button className="btn-danger" onClick={() => update({ actionOff: undefined } as ElementPatch)}>
                Quitar acción al desmarcar
              </button>
            </>
          ) : (
            <>
              <p className="hint">Sin ella, desmarcar no manda nada al equipo.</p>
              <button className="btn-add" onClick={() => update({ actionOff: { type: "command", deviceId: "", command: "" } } as ElementPatch)}>
                + Añadir acción al desmarcar
              </button>
            </>
          )}
        </>
      )}

      {(el.type === "button" || el.type === "slider" || el.type === "image") && (
        <>
          <h3>Acción</h3>
          {el.type === "slider" ? (
            <ActionEditor
              action={(el as SliderElement).action}
              screens={design.screens}
              devices={devices}
              isSlider
              onChange={updateAction}
            />
          ) : el.type === "button" ? (
            <ActionEditor
              action={(el as ButtonElement).action}
              screens={design.screens}
              devices={devices}
              onChange={updateAction}
            />
          ) : el.type === "image" ? (
            imageAction ? (
              <ActionEditor
                action={imageAction}
                screens={design.screens}
                devices={devices}
                onChange={updateAction}
              />
            ) : (
              <button className="btn-add" onClick={() => update({ action: { type: "command", deviceId: "", command: "" } } as ElementPatch)}>
                + Añadir acción al pulsar
              </button>
            )
          ) : null}
        </>
      )}

      {(el.type === "button" || el.type === "slider" || el.type === "checkbox" || el.type === "radio" || el.type === "label") && designName && (
        <StateEditor
          el={el}
          designName={designName}
          devices={devices}
          onChange={(st) => update({ state: st } as ElementPatch)}
        />
      )}

      <StyleEditor el={el} update={update} />

      <button className="btn-danger" onClick={() => deleteElement(el.id)}>
        Eliminar elemento
      </button>
    </div>
  );
}
