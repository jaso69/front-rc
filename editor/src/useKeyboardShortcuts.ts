import { useEffect } from "react";

interface Options {
  onDelete: () => void;
  onMove: (dx: number, dy: number) => void;
  enabled: boolean;
}

export function useKeyboardShortcuts({ onDelete, onMove, enabled }: Options) {
  useEffect(() => {
    if (!enabled) return;

    function onKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      // No interferir cuando se está escribiendo en un input
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT") {
        return;
      }

      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        onDelete();
        return;
      }

      const step = e.shiftKey ? 10 : 1;
      switch (e.key) {
        case "ArrowLeft":
          e.preventDefault();
          onMove(-step, 0);
          break;
        case "ArrowRight":
          e.preventDefault();
          onMove(step, 0);
          break;
        case "ArrowUp":
          e.preventDefault();
          onMove(0, -step);
          break;
        case "ArrowDown":
          e.preventDefault();
          onMove(0, step);
          break;
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [enabled, onDelete, onMove]);
}
