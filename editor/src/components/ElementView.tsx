import { useDraggable } from "@dnd-kit/core";
import type { ButtonElement, DesignElement, ImageElement, LabelElement, SliderElement } from "@schema/design.ts";

export type ResizeHandle = "nw" | "ne" | "sw" | "se";

interface Props {
  element: DesignElement;
  selected: boolean;
  onSelect: () => void;
  onResizeStart: (e: React.PointerEvent, handle: ResizeHandle) => void;
}

function Preview({ element }: { element: DesignElement }) {
  switch (element.type) {
    case "button": {
      const btn = element as ButtonElement;
      const s = btn.style;
      return (
        <div className="btn-preview" style={{
          backgroundColor: s?.backgroundColor ?? "#2a6dbd",
          color: s?.color ?? "#fff",
          borderRadius: s?.borderRadius ?? 6,
          fontSize: s?.fontSize ?? 16,
        }}>
          {btn.label}
        </div>
      );
    }
    case "slider": {
      const sl = element as SliderElement;
      return (
        <div className="slider-preview">
          {sl.label && <label>{sl.label}</label>}
          <input type="range" min={sl.min} max={sl.max} step={sl.step} defaultValue={sl.value} readOnly />
        </div>
      );
    }
    case "image": {
      const img = element as ImageElement;
      if (img.src) {
        return <img className="img-preview" src={img.src} alt="" draggable={false} />;
      }
      return <div className="img-placeholder">Imagen</div>;
    }
    case "label": {
      const lbl = element as LabelElement;
      const s = lbl.style;
      return (
        <div style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          padding: "4px 8px",
          overflow: "hidden",
          justifyContent: lbl.align === "center" ? "center" : lbl.align === "right" ? "flex-end" : "flex-start",
          color: s?.color ?? "#fff",
          fontSize: s?.fontSize ?? 16,
        }}>
          {lbl.text}
        </div>
      );
    }
  }
}

export function ElementView({ element, selected, onSelect, onResizeStart }: Props) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: element.id,
    data: { from: "canvas", id: element.id },
  });

  const style: React.CSSProperties = {
    left: element.position.x,
    top: element.position.y,
    width: element.position.width,
    height: element.position.height,
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`element${selected ? " selected" : ""}${isDragging ? " dragging" : ""}`}
      {...listeners}
      {...attributes}
      onPointerDown={(e) => {
        e.stopPropagation();
        onSelect();
      }}
    >
      <div className="element-preview">
        <Preview element={element} />
      </div>
      {selected && (
        <>
          <div className="resize-handle rh-nw" onPointerDown={(e) => onResizeStart(e, "nw")} />
          <div className="resize-handle rh-ne" onPointerDown={(e) => onResizeStart(e, "ne")} />
          <div className="resize-handle rh-sw" onPointerDown={(e) => onResizeStart(e, "sw")} />
          <div className="resize-handle rh-se" onPointerDown={(e) => onResizeStart(e, "se")} />
        </>
      )}
    </div>
  );
}
