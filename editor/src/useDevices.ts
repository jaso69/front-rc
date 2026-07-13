import { useEffect, useState } from "react";
import type { DeviceView } from "@schema/device.ts";
import { listDevices } from "./api.ts";

export interface DevicesState {
  devices: DeviceView[];
  loading: boolean;
  /** Por qué no hay catálogo: backend caído, token inválido, IP fuera de la lista blanca… */
  error: string | null;
  reload: () => void;
}

/**
 * Catálogo de equipos del backend AV del diseño.
 *
 * Se recarga cuando cambia la `baseUrl`: apuntar a otro jaso-rc es apuntar a otros equipos, y
 * dejar los desplegables con los del servidor anterior invita a guardar un diseño que llama a
 * equipos que no existen.
 */
export function useDevices(designName: string | null, baseUrl: string | undefined): DevicesState {
  const [devices, setDevices] = useState<DeviceView[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    if (!designName || !baseUrl) {
      setDevices([]);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    listDevices(designName)
      .then((list) => {
        if (cancelled) return;
        setDevices(list);
      })
      .catch((err: Error) => {
        if (cancelled) return;
        setDevices([]);
        setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [designName, baseUrl, nonce]);

  return { devices, loading, error, reload: () => setNonce((n) => n + 1) };
}
