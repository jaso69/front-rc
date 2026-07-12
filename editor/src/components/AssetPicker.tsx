import { useEffect, useRef, useState } from "react";
import { deleteAsset, listAssets, uploadAsset } from "../api.ts";

interface Props {
  open: boolean;
  onPick: (path: string) => void;
  onClose: () => void;
}

export function AssetPicker({ open, onPick, onClose }: Props) {
  const [assets, setAssets] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    void refresh();
  }, [open]);

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      setAssets(await listAssets());
    } catch {
      setError("No se pudo cargar la lista de assets");
    } finally {
      setLoading(false);
    }
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    try {
      await uploadAsset(file.name, file);
      await refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      e.target.value = "";
    }
  }

  async function handleDelete(filename: string) {
    await deleteAsset(filename);
    await refresh();
  }

  if (!open) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Seleccionar imagen</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-toolbar">
          <button className="btn btn-primary" onClick={() => fileInput.current?.click()}>
            + Subir imagen
          </button>
          <input
            ref={fileInput}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={handleUpload}
          />
        </div>

        {error && <p className="modal-error">{error}</p>}

        {loading ? (
          <p className="modal-empty">Cargando…</p>
        ) : assets.length === 0 ? (
          <p className="modal-empty">No hay imágenes. Sube una con el botón de arriba.</p>
        ) : (
          <div className="asset-grid">
            {assets.map((name) => (
              <div key={name} className="asset-item" onClick={() => onPick(`/assets/${name}`)}>
                <img src={`/assets/${name}`} alt={name} draggable={false} />
                <span className="asset-name" title={name}>{name}</span>
                <button
                  className="asset-del"
                  onClick={(e) => { e.stopPropagation(); void handleDelete(name); }}
                  title="Borrar"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
