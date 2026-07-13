import { useCallback, useEffect, useState } from "react";
import { getSession, login as apiLogin, logout as apiLogout } from "./api.ts";

export interface SessionState {
  /** null mientras no se sabe: evita el parpadeo del login en cada recarga. */
  authenticated: boolean | null;
  /** Si no hay contraseña puesta en el .env, el editor va abierto y no se pide login. */
  passwordSet: boolean;
  error: string | null;
  submitting: boolean;
  login: (password: string) => Promise<void>;
  logout: () => Promise<void>;
}

export function useSession(): SessionState {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [passwordSet, setPasswordSet] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getSession()
      .then((s) => {
        setAuthenticated(s.authenticated);
        setPasswordSet(s.passwordSet);
      })
      .catch(() => setAuthenticated(false));
  }, []);

  const login = useCallback(async (password: string) => {
    setSubmitting(true);
    setError(null);
    try {
      await apiLogin(password);
      setAuthenticated(true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }, []);

  const logout = useCallback(async () => {
    await apiLogout();
    // Recarga en vez de vaciar el estado a mano: así no queda ningún diseño a medias en memoria
    // después de cerrar sesión.
    window.location.reload();
  }, []);

  return { authenticated, passwordSet, error, submitting, login, logout };
}
