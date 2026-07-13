import type { Design } from "@schema/design.ts";
import type { DeviceView } from "@schema/device.ts";

export async function listDesigns(): Promise<string[]> {
  const res = await fetch("/api/designs");
  const data = await res.json();
  return data.designs as string[];
}

export async function getDesign(name: string): Promise<Design> {
  const res = await fetch(`/api/designs/${name}`);
  if (!res.ok) throw new Error("Diseño no encontrado");
  return res.json();
}

export async function saveDesign(name: string, design: Design): Promise<void> {
  const res = await fetch(`/api/designs/${name}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(design),
  });
  if (!res.ok) throw new Error("Error al guardar");
}

export async function deleteDesign(name: string): Promise<void> {
  await fetch(`/api/designs/${name}`, { method: "DELETE" });
}

export async function generateDesign(name: string): Promise<{ files: string[]; url: string }> {
  const res = await fetch(`/api/designs/${name}/generate`, { method: "POST" });
  if (!res.ok) throw new Error("Error al generar");
  return res.json();
}

// ── Sesión del editor ──

export interface Session {
  authenticated: boolean;
  passwordSet: boolean;
}

export async function getSession(): Promise<Session> {
  const res = await fetch("/api/session");
  return res.json();
}

export async function login(password: string): Promise<void> {
  const res = await fetch("/api/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error ?? "No se pudo iniciar sesión");
  }
}

export async function logout(): Promise<void> {
  await fetch("/api/logout", { method: "POST" });
}

// ── Backend AV (jaso-rc) ──
// El editor nunca habla con jaso-rc directamente: pregunta a su servidor, que es quien tiene
// el token. Por eso estas rutas cuelgan del diseño (de él sale la URL del backend).

/** Equipos y comandos que publica el jaso-rc del diseño. Es lo que llena los desplegables. */
export async function listDevices(design: string): Promise<DeviceView[]> {
  const res = await fetch(`/api/designs/${design}/devices`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "No se pudo leer el catálogo de equipos");
  return data.devices as DeviceView[];
}

export interface ConnectionCheck {
  ok: boolean;
  devices?: number;
  baseUrl?: string;
  error?: string;
}

/** Comprueba que la URL responde y que el token vale, y distingue un fallo del otro. */
export async function testConnection(design: string): Promise<ConnectionCheck> {
  const res = await fetch(`/api/designs/${design}/health`);
  return res.json();
}

// ── Assets ──

export async function listAssets(): Promise<string[]> {
  const res = await fetch("/api/assets");
  const data = await res.json();
  return data.assets as string[];
}

export async function uploadAsset(filename: string, file: File): Promise<string> {
  const dataB64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.slice(result.indexOf(",") + 1));
    };
    reader.onerror = () => reject(new Error("No se pudo leer el archivo"));
    reader.readAsDataURL(file);
  });
  const res = await fetch("/api/assets", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ filename, data: dataB64 }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? "Error al subir el asset");
  }
  const data = await res.json();
  return data.filename as string;
}

export async function deleteAsset(filename: string): Promise<void> {
  await fetch(`/api/assets/${encodeURIComponent(filename)}`, { method: "DELETE" });
}
