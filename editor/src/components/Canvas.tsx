import { useEffect, useRef, useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import type { Design } from "@schema/design.ts";
import type { Background } from "@schema/style.ts";
import { ElementView, type ResizeHandle } from "./ElementView.tsx";
import type { ElementPatch } from "../useDesign.ts";

function backgroundStyle(bg: Background): React.CSSProperties {
  switch (bg.type) {
    case "color": return { background: bg.color };
    case "gradient": return { background: `linear-gradient(${bg.angle}deg, ${bg.from}, ${bg.to})` };
    case "image": return { background: `url('${bg.src}') center/cover no-repeat` };
  }
}

interface Props {
  design: Design;
  screenIndex: number;
  selectedElementId: string | null;
  showGrid: boolean;
  onSelectElement: (id: string | null) => void;
  onUpdateElement: (id: string, updates: ElementPatch) => void;
}

interface ResizeState {
  elementId: string;
  handle: ResizeHandle;
  startClientX: number;
  startClientY: number;
  origX: number;
  origY: number;
  origW: number;
  origH: number;
}

const MIN_SIZE = 20;

export function Canvas({ design, screenIndex, selectedElementId, showGrid, onSelectElement, onUpdateElement }: Props) {
  const { setNodeRef } = useDroppable({ id: "canvas" });
  const [resize, setResize] = useState<ResizeState | null>(null);
  const updateRef = useRef(onUpdateElement);
  updateRef.current = onUpdateElement;

  const screen = design.screens[screenIndex];
  const { width, height } = design.config.canvas;

  function startResize(e: React.PointerEvent, elementId: string, handle: ResizeHandle) {
    e.stopPropagation();
    const el = screen?.elements.find((el) => el.id === elementId);
    if (!el) return;
    setResize({
      elementId,
      handle,
      startClientX: e.clientX,
      startClientY: e.clientY,
      origX: el.position.x,
      origY: el.position.y,
      origW: el.position.width,
      origH: el.position.height,
    });
  }

  useEffect(() => {
    if (!resize) return;

    function onMove(e: PointerEvent) {
      const rs = resize;
      if (!rs) return;
      const dx = e.clientX - rs.startClientX;
      const dy = e.clientY - rs.startClientY;

      let newX = rs.origX;
      let newY = rs.origY;
      let newW = rs.origW;
      let newH = rs.origH;

      if (rs.handle.includes("e")) newW = Math.max(MIN_SIZE, rs.origW + dx);
      if (rs.handle.includes("s")) newH = Math.max(MIN_SIZE, rs.origH + dy);
      if (rs.handle.includes("w")) {
        newW = Math.max(MIN_SIZE, rs.origW - dx);
        newX = rs.origX + (rs.origW - newW);
      }
      if (rs.handle.includes("n")) {
        newH = Math.max(MIN_SIZE, rs.origH - dy);
        newY = rs.origY + (rs.origH - newH);
      }

      updateRef.current(rs.elementId, {
        position: { x: Math.round(newX), y: Math.round(newY), width: Math.round(newW), height: Math.round(newH) },
      });
    }

    function onUp() {
      setResize(null);
    }

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [resize]);

  if (!screen) return null;

  return (
    <div className="canvas-area">
      <div className="canvas-wrapper">
        <div
          ref={setNodeRef}
          className="canvas"
          style={{ width, height, ...(screen.background ? backgroundStyle(screen.background) : {}) }}
          onPointerDown={() => onSelectElement(null)}
        >
          {showGrid && <div className="canvas-grid" />}
          {screen.elements.map((el) => (
            <ElementView
              key={el.id}
              element={el}
              selected={el.id === selectedElementId}
              onSelect={() => onSelectElement(el.id)}
              onResizeStart={(e, handle) => startResize(e, el.id, handle)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
