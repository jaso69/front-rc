import { useRef, useState } from "react";
import * as api from "../api.ts";

interface Props {
  /** Se llama tras restaurar: la lista de diseños del selector ha cambiado. */
  onRestored: () => void;
  onBack: () => void;
}

export function Settings({ onRestored, onBack }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<api.RestoreMode>("merge");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<api.RestoreResult | null>(null);

  async function handleDownload() {
    setError(null);
    setBusy(true);
    try {
      await api.downloadBackup();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function handleRestore(file: File) {
    // Sustituir diseños del servidor no se deshace: se pregunta antes, sobre todo en "replace",
    // que además borra los que no vengan en la copia.
    const warning = mode === "replace"
      ? `¿Restaurar "${file.name}" y BORRAR los diseños que no estén en la copia?`
      : `¿Restaurar "${file.name}"? Los diseños con el mismo nombre se sobrescriben.`;
    if (!confirm(warning)) return;

    setError(null);
    setResult(null);
    setBusy(true);
    try {
      const res = await api.restoreBackup(file, mode);
      setResult(res);
      onRestored();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div className="picker">
      <h1>Configuración</h1>

      <div className="picker-section">
        <h2>Copia de seguridad</h2>
        <p className="hint">
          Un único fichero JSON con todos los diseños y los assets subidos. Los paneles generados
          no van dentro: se reconstruyen solos al restaurar.
        </p>
        <button className="btn" onClick={handleDownload} disabled={busy}>
          Descargar copia
        </button>
      </div>

      <div className="picker-section">
        <h2>Restaurar</h2>
        <div className="field">
          <label>Qué hacer con los diseños actuales</label>
          <select value={mode} onChange={(e) => setMode(e.target.value as api.RestoreMode)}>
            <option value="merge">Combinar (sobrescribe los del mismo nombre)</option>
            <option value="replace">Reemplazar (borra los que no estén en la copia)</option>
          </select>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          disabled={busy}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleRestore(file);
          }}
        />
        {busy && <p className="hint">Trabajando…</p>}
        {error && <p className="msg err">{error}</p>}
        {result && (
          <p className="msg ok">
            Restaurados {result.designs.length} diseño(s) y {result.assets.length} asset(s)
            {result.removed.length > 0 && `, borrados ${result.removed.length}`}.
          </p>
        )}
      </div>

      <div className="picker-section">
        <h2>Puerto</h2>
        <p className="hint">
          El servidor escucha en el puerto de la variable <code>PORT</code> (3000 por defecto) y
          se fija al arrancar: no se puede cambiar desde aquí. En Docker lo que se cambia es el
          puerto publicado (<code>ports: "8080:3000"</code> en el compose, o{" "}
          <code>HOST_PORT=8080</code> en el <code>.env</code>).
        </p>
      </div>

      <button className="btn" onClick={onBack}>← Volver a los diseños</button>
    </div>
  );
}
