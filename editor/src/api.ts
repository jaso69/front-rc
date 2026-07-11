import type { Design } from "@schema/design.ts";

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
