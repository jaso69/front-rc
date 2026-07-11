import { useState } from "react";
import type { ElementAction, HttpAction, HttpMethod, NavigateAction } from "@schema/action.ts";
import type { Background } from "@schema/style.ts";
import type { ButtonElement, Design, DesignElement, ImageElement, LabelElement, Screen, SliderElement } from "@schema/design.ts";
import type { DesignState, ElementPatch } from "../useDesign.ts";

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
          <input type="text" value={bg.color} onChange={(e) => onChange({ ...bg, color: e.target.value })} />
        </Field>
      )}
      {bg?.type === "gradient" && (
        <>
          <div className="row">
            <Field label="Desde"><input type="text" value={bg.from} onChange={(e) => onChange({ ...bg, from: e.target.value })} /></Field>
            <Field label="Hasta"><input type="text" value={bg.to} onChange={(e) => onChange({ ...bg, to: e.target.value })} /></Field>
          </div>
          <Field label="Ángulo (grados)">
            <input type="number" value={bg.angle} onChange={(e) => onChange({ ...bg, angle: Number(e.target.value) })} />
          </Field>
        </>
      )}
      {bg?.type === "image" && (
        <Field label="URL de la imagen">
          <input type="text" value={bg.src} onChange={(e) => onChange({ ...bg, src: e.target.value })} placeholder="/assets/bg.png" />
        </Field>
      )}
    </>
  );
}

// ── Action editor (http or navigate) ──

function ActionEditor({ action, screens, onChange }: { action: ElementAction; screens: Screen[]; onChange: (a: ElementAction) => void }) {
  const [newKey, setNewKey] = useState("");
  const [newVal, setNewVal] = useState("");

  function setHttp(patch: Partial<HttpAction>) {
    onChange({ ...(action as HttpAction), ...patch });
  }

  function switchType(type: "http" | "navigate") {
    if (type === "http") {
      onChange({ type: "http", endpoint: "/api/", method: "POST" });
    } else {
      onChange({ type: "navigate", screenId: screens[0]?.id ?? "" });
    }
  }

  if (action.type === "navigate") {
    return (
      <>
        <Field label="Tipo de acción">
          <select value="navigate" onChange={(e) => switchType(e.target.value as "http" | "navigate")}>
            <option value="http">Petición HTTP</option>
            <option value="navigate">Navegar a pantalla</option>
          </select>
        </Field>
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

  const http = action as HttpAction;
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
      <Field label="Tipo de acción">
        <select value="http" onChange={(e) => switchType(e.target.value as "http" | "navigate")}>
          <option value="http">Petición HTTP</option>
          <option value="navigate">Navegar a pantalla</option>
        </select>
      </Field>
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
  return (
    <>
      <Field label="Etiqueta">
        <input type="text" value={el.label ?? ""} onChange={(e) => update({ label: e.target.value })} />
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

function ImageProps({ el, update }: { el: ImageElement; update: (p: ElementPatch) => void }) {
  return (
    <Field label="URL de la imagen">
      <input type="text" value={el.src} onChange={(e) => update({ src: e.target.value })} placeholder="/assets/logo.png" />
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
          <input type="text" value={s.backgroundColor ?? ""} onChange={(e) => setStyle({ backgroundColor: e.target.value })} placeholder="#2a6dbd" />
        </Field>
        <Field label="Color texto">
          <input type="text" value={s.color ?? ""} onChange={(e) => setStyle({ color: e.target.value })} placeholder="#fff" />
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
    </>
  );
}

// ── Main panel ──

export function PropertiesPanel({ state }: Props) {
  const { design, screenIndex, selectedElementId, updateElement, updateConfig, deleteElement, updateScreenBackground } = state;

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

  return (
    <div className="properties" onPointerDown={(e) => e.stopPropagation()}>
      <h3>{el.type === "button" ? "Botón" : el.type === "slider" ? "Slider" : el.type === "image" ? "Imagen" : "Etiqueta"}</h3>

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

      {el.type !== "label" && (
        <>
          <h3>Acción</h3>
          {el.type === "image" && !(el as ImageElement).action ? (
            <button className="btn-add" onClick={() => update({ action: { type: "http", endpoint: "/api/", method: "POST" } } as ElementPatch)}>
              + Añadir acción al pulsar
            </button>
          ) : el.type === "slider" ? (
            <ActionEditor
              action={(el as SliderElement).action}
              screens={design.screens}
              onChange={updateAction}
            />
          ) : el.type === "button" ? (
            <ActionEditor
              action={(el as ButtonElement).action}
              screens={design.screens}
              onChange={updateAction}
            />
          ) : el.type === "image" ? (
            imageAction ? (
              <ActionEditor
                action={imageAction}
                screens={design.screens}
                onChange={updateAction}
              />
            ) : (
              <button className="btn-add" onClick={() => update({ action: { type: "http", endpoint: "/api/", method: "POST" } } as ElementPatch)}>
                + Añadir acción al pulsar
              </button>
            )
          ) : null}
        </>
      )}

      <StyleEditor el={el} update={update} />

      <button className="btn-danger" onClick={() => deleteElement(el.id)}>
        Eliminar elemento
      </button>
    </div>
  );
}
