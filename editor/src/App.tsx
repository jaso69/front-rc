import { useState } from "react";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { useDesign } from "./useDesign.ts";
import { useSession, type SessionState } from "./useSession.ts";
import { useKeyboardShortcuts } from "./useKeyboardShortcuts.ts";
import { Login } from "./components/Login.tsx";
import { DesignPicker } from "./components/DesignPicker.tsx";
import { Settings } from "./components/Settings.tsx";
import { Toolbar } from "./components/Toolbar.tsx";
import { Palette } from "./components/Palette.tsx";
import { Canvas } from "./components/Canvas.tsx";
import { ScreenTabs } from "./components/ScreenTabs.tsx";
import { PropertiesPanel } from "./components/PropertiesPanel.tsx";

export default function App() {
  const session = useSession();

  // Mientras no se sabe si hay sesión no se pinta nada: montar el editor pediría los diseños y
  // se llevaría un 401, y enseñar el login a quien ya estaba dentro es un parpadeo feo.
  if (session.authenticated === null) return null;
  if (!session.authenticated) return <Login session={session} />;

  return <Editor session={session} />;
}

function Editor({ session }: { session: SessionState }) {
  const state = useDesign();
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
  const [view, setView] = useState<"designs" | "settings">("designs");

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  useKeyboardShortcuts({
    enabled: state.design !== null && state.selectedElementId !== null,
    onDelete: () => {
      if (state.selectedElementId) state.deleteElement(state.selectedElementId);
    },
    onMove: (dx, dy) => {
      if (state.selectedElementId) state.updateElementPosition(state.selectedElementId, dx, dy);
    },
  });

  function handleDragEnd(event: DragEndEvent) {
    const data = event.active.data.current as
      | { from: "palette"; elementType: import("@schema/design.ts").ElementType }
      | { from: "canvas"; id: string }
      | undefined;

    if (!data) return;

    if (data.from === "palette") {
      if (event.over?.id !== "canvas") return;
      const overRect = event.over.rect;
      const activeRect = event.active.rect.current.translated;
      if (!activeRect) return;
      const x = Math.round(activeRect.left - overRect.left);
      const y = Math.round(activeRect.top - overRect.top);
      state.addElement(data.elementType, x, y);
    } else if (data.from === "canvas") {
      const { delta } = event;
      if (delta.x === 0 && delta.y === 0) return;
      state.updateElementPosition(data.id, delta.x, delta.y);
    }
  }

  if (!state.design) {
    if (view === "settings") {
      return <Settings onRestored={state.refreshList} onBack={() => setView("designs")} />;
    }
    return (
      <DesignPicker
        designs={state.designs}
        onLoad={state.loadDesign}
        onNew={state.newDesign}
        onSettings={() => setView("settings")}
        onLogout={session.passwordSet ? session.logout : undefined}
      />
    );
  }

  return (
    <div className="app">
      <Toolbar state={state} generatedUrl={generatedUrl} onGenerated={setGeneratedUrl} />
      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div className="main">
          <Palette />
          <div className="canvas-area">
            <Canvas
              design={state.design}
              screenIndex={state.screenIndex}
              selectedElementId={state.selectedElementId}
              showGrid={state.showGrid}
              onSelectElement={state.selectElement}
              onUpdateElement={state.updateElement}
            />
            <ScreenTabs
              design={state.design}
              screenIndex={state.screenIndex}
              onSelect={state.selectScreen}
              onAdd={state.addScreen}
              onDelete={state.deleteScreen}
              onRename={state.updateScreenName}
            />
          </div>
          <PropertiesPanel state={state} />
        </div>
      </DndContext>
    </div>
  );
}
