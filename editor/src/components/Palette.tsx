import { useDraggable } from "@dnd-kit/core";
import type { ElementType } from "@schema/design.ts";

interface PaletteItemProps {
  type: ElementType;
  label: string;
  icon: string;
}

function PaletteItem({ type, label, icon }: PaletteItemProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette-${type}`,
    data: { from: "palette", elementType: type },
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`palette-item${isDragging ? " dragging" : ""}`}
    >
      <span className="icon">{icon}</span>
      <span>{label}</span>
    </div>
  );
}

export function Palette() {
  return (
    <div className="palette">
      <h3>Componentes</h3>
      <PaletteItem type="button" label="Botón" icon="▱" />
      <PaletteItem type="slider" label="Slider" icon="═" />
      <PaletteItem type="image" label="Imagen" icon="🖼" />
      <PaletteItem type="label" label="Etiqueta" icon="Aa" />
    </div>
  );
}
