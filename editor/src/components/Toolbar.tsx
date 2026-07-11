import { useState } from "react";
import type { DesignState } from "../useDesign.ts";

interface Props {
  state: DesignState;
  generatedUrl: string | null;
  onGenerated: (url: string) => void;
}

export function Toolbar({ state, generatedUrl, onGenerated }: Props) {
  const { design, designName, dirty, saveStatus, errorMsg, save, generate, closeDesign, snapToGrid, setSnapToGrid } = state;
  const [generating, setGenerating] = useState(false);

  async function handleGenerate() {
    setGenerating(true);
    const url = await generate();
    setGenerating(false);
    if (url) {
      onGenerated(url);
      window.open(url, "_blank");
    }
  }

  const statusText = (() => {
    switch (saveStatus) {
      case "saving": return "Guardando…";
      case "saved": return "Guardado ✓";
      case "error": return "Error";
      default: return dirty ? "Sin guardar (auto)" : "";
    }
  })();

  if (!design) return null;

  return (
    <div className="toolbar">
      <button className="btn" onClick={closeDesign}>← Diseños</button>
      <strong style={{ marginLeft: 4 }}>{designName}</strong>
      <span style={{ fontSize: 12, color: dirty ? "#ca6" : "#666" }}>{statusText}</span>
      {errorMsg && <span className="msg err">{errorMsg}</span>}

      <div className="spacer" />

      <label style={{ fontSize: 12, color: snapToGrid ? "#5af" : "#666", cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
        <input type="checkbox" checked={snapToGrid} onChange={(e) => setSnapToGrid(e.target.checked)} style={{ cursor: "pointer" }} />
        Grid
      </label>

      <label style={{ fontSize: 12, color: "#999" }}>Backend AV</label>
      <input
        type="text"
        value={design.config.baseUrl}
        onChange={(e) => state.updateConfig({ baseUrl: e.target.value })}
        style={{
          padding: "4px 8px", background: "#1a1a1a", border: "1px solid #444",
          borderRadius: 4, color: "#e0e0e0", width: 220, fontSize: 13,
        }}
      />

      <button className="btn btn-primary" onClick={save} disabled={saveStatus === "saving"}>
        Guardar
      </button>
      <button className="btn btn-secondary" onClick={handleGenerate} disabled={generating}>
        {generating ? "Generando…" : "Generar y abrir"}
      </button>
      {generatedUrl && (
        <a href={generatedUrl} target="_blank" rel="noreferrer"
           style={{ fontSize: 12, color: "#4af" }}>Vista previa →</a>
      )}
    </div>
  );
}
