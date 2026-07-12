import { useState } from "react";

interface Props {
  designs: string[];
  onLoad: (name: string) => void;
  onNew: (name: string, width: number, height: number) => void;
}

const PRESETS = [
  // Móvil
  { label: "Móvil pequeño (320×480)", width: 320, height: 480 },
  { label: "Móvil estándar (375×667)", width: 375, height: 667 },
  { label: "Móvil grande (414×896)", width: 414, height: 896 },
  { label: "iPhone 14 Pro (393×852)", width: 393, height: 852 },
  { label: "iPhone 14 Pro Max (430×932)", width: 430, height: 932 },
  // Tablet
  { label: "Tablet vertical (800×1280)", width: 800, height: 1280 },
  { label: "Tablet horizontal (1280×800)", width: 1280, height: 800 },
  { label: "iPad 11\" (1194×834)", width: 1194, height: 834 },
  { label: "iPad 12.9\" (1366×1024)", width: 1366, height: 1024 },
  { label: "iPad Mini (768×1024)", width: 768, height: 1024 },
  // Escritorio
  { label: "Portátil HD (1366×768)", width: 1366, height: 768 },
  { label: "Escritorio Full HD (1920×1080)", width: 1920, height: 1080 },
  { label: "Escritorio 2K (2560×1440)", width: 2560, height: 1440 },
  { label: "Escritorio 4K (3840×2160)", width: 3840, height: 2160 },
  // Personalizado
  { label: "Cuadrado (1080×1080)", width: 1080, height: 1080 },
  { label: "Banner horizontal (1920×600)", width: 1920, height: 600 },
];

export function DesignPicker({ designs, onLoad, onNew }: Props) {
  const [name, setName] = useState("");
  const [preset, setPreset] = useState(0);
  const [error, setError] = useState<string | null>(null);

  function handleNew() {
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Pon un nombre");
      return;
    }
    if (!/^[a-zA-Z0-9-_]+$/.test(trimmed)) {
      setError("Solo letras, números, guiones y guiones bajos");
      return;
    }
    if (designs.includes(trimmed)) {
      setError("Ya existe un diseño con ese nombre");
      return;
    }
    const p = PRESETS[preset]!;
    onNew(trimmed, p.width, p.height);
  }

  return (
    <div className="picker">
      <h1>Editor RC</h1>

      {designs.length > 0 && (
        <>
          <h3 style={{ marginBottom: "8px", color: "#888" }}>Diseños existentes</h3>
          <div className="design-list">
            {designs.map((d) => (
              <div key={d} className="design-card" onClick={() => onLoad(d)}>
                {d}
              </div>
            ))}
          </div>
        </>
      )}

      <h3 style={{ marginBottom: "8px", color: "#888" }}>Crear nuevo</h3>
      <div className="new-form">
        <div className="field">
          <label style={{ fontSize: 12, color: "#999", display: "block", marginBottom: 4 }}>Nombre</label>
          <input
            type="text"
            value={name}
            placeholder="ej: salon"
            onChange={(e) => { setName(e.target.value); setError(null); }}
            onKeyDown={(e) => e.key === "Enter" && handleNew()}
            style={{ width: "100%" }}
          />
        </div>
        <div className="field">
          <label style={{ fontSize: 12, color: "#999", display: "block", marginBottom: 4 }}>Tamaño</label>
          <select
            value={preset}
            onChange={(e) => setPreset(Number(e.target.value))}
            style={{ width: "100%" }}
          >
            {PRESETS.map((p, i) => (
              <option key={i} value={i}>{p.label}</option>
            ))}
          </select>
        </div>
        <button className="btn btn-primary" onClick={handleNew}>Crear</button>
      </div>
      {error && <p style={{ color: "#d66", marginTop: 8, fontSize: 13 }}>{error}</p>}
    </div>
  );
}
