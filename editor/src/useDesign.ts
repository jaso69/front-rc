import { useCallback, useEffect, useState } from "react";
import type {
  ButtonElement,
  Design,
  DesignConfig,
  DesignElement,
  ElementType,
  ImageElement,
  LabelElement,
  LineElement,
  RectangleElement,
  SliderElement,
} from "@schema/design.ts";
import type { Background } from "@schema/style.ts";
import * as api from "./api.ts";
import { createElement, createEmptyDesign, genScreenId } from "./factory.ts";

export type SaveStatus = "idle" | "saving" | "saved" | "error";

export type ElementPatch = Partial<ButtonElement> | Partial<SliderElement> | Partial<ImageElement> | Partial<LabelElement> | Partial<LineElement> | Partial<RectangleElement>;

export interface DesignState {
  design: Design | null;
  designName: string | null;
  designs: string[];
  screenIndex: number;
  selectedElementId: string | null;
  dirty: boolean;
  saveStatus: SaveStatus;
  errorMsg: string | null;
  showGrid: boolean;
  setShowGrid: (v: boolean) => void;
  snapToGrid: boolean;
  setSnapToGrid: (v: boolean) => void;
  loadDesign: (name: string) => Promise<void>;
  newDesign: (name: string, width: number, height: number) => Promise<void>;
  refreshList: () => Promise<void>;
  save: () => Promise<void>;
  generate: () => Promise<string | null>;
  closeDesign: () => void;
  addElement: (type: ElementType, x: number, y: number) => void;
  updateElement: (id: string, updates: ElementPatch) => void;
  updateElementPosition: (id: string, deltaX: number, deltaY: number) => void;
  deleteElement: (id: string) => void;
  selectElement: (id: string | null) => void;
  updateConfig: (updates: Partial<DesignConfig>) => void;
  addScreen: () => void;
  deleteScreen: (index: number) => void;
  selectScreen: (index: number) => void;
  updateScreenName: (index: number, name: string) => void;
  updateScreenBackground: (index: number, background: Background | undefined) => void;
}

export function useDesign(): DesignState {
  const [design, setDesign] = useState<Design | null>(null);
  const [designName, setDesignName] = useState<string | null>(null);
  const [designs, setDesigns] = useState<string[]>([]);
  const [screenIndex, setScreenIndex] = useState(0);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showGrid, setShowGrid] = useState(false);
  const [snapToGrid, setSnapToGrid] = useState(false);

  const GRID_SIZE = 10;

  useEffect(() => {
    api.listDesigns().then(setDesigns).catch(() => {});
  }, []);

  const refreshList = useCallback(async () => {
    const list = await api.listDesigns();
    setDesigns(list);
  }, []);

  const loadDesign = useCallback(async (name: string) => {
    try {
      const d = await api.getDesign(name);
      setDesign(d);
      setDesignName(name);
      setScreenIndex(0);
      setSelectedElementId(null);
      setDirty(false);
      setSaveStatus("idle");
      setErrorMsg(null);
    } catch (err) {
      setErrorMsg((err as Error).message);
    }
  }, []);

  const newDesign = useCallback(async (name: string, width: number, height: number) => {
    const d = createEmptyDesign(name, width, height);
    setDesign(d);
    setDesignName(name);
    setScreenIndex(0);
    setSelectedElementId(null);
    setDirty(true);
    setSaveStatus("idle");
    setErrorMsg(null);
  }, []);

  const closeDesign = useCallback(() => {
    setDesign(null);
    setDesignName(null);
    setSelectedElementId(null);
    setDirty(false);
    refreshList();
  }, [refreshList]);

  const save = useCallback(async () => {
    if (!design || !designName) return;
    setSaveStatus("saving");
    try {
      await api.saveDesign(designName, design);
      setDirty(false);
      setSaveStatus("saved");
      refreshList();
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch (err) {
      setSaveStatus("error");
      setErrorMsg((err as Error).message);
    }
  }, [design, designName, refreshList]);

  // Auto-guardado con debounce (3s sin cambios)
  useEffect(() => {
    if (!dirty || !design || !designName) return;
    const timer = setTimeout(async () => {
      try {
        await api.saveDesign(designName, design);
        setDirty(false);
        setSaveStatus("saved");
        setTimeout(() => setSaveStatus("idle"), 2000);
      } catch {
        setSaveStatus("error");
      }
    }, 3000);
    return () => clearTimeout(timer);
  }, [dirty, design, designName]);

  const generate = useCallback(async () => {
    if (!design || !designName) return null;
    try {
      await api.saveDesign(designName, design);
      setDirty(false);
      const result = await api.generateDesign(designName);
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
      return result.url;
    } catch (err) {
      setSaveStatus("error");
      setErrorMsg((err as Error).message);
      return null;
    }
  }, [design, designName]);

  // ── Element operations ──

  const currentScreen = design?.screens[screenIndex] ?? null;

  const addElement = useCallback(
    (type: ElementType, x: number, y: number) => {
      if (!design) return;
      const snapX = snapToGrid ? Math.round(x / GRID_SIZE) * GRID_SIZE : Math.round(x);
      const snapY = snapToGrid ? Math.round(y / GRID_SIZE) * GRID_SIZE : Math.round(y);
      const el = createElement(type, snapX, snapY);
      setDesign((prev) => {
        if (!prev) return prev;
        const cur = prev.screens[screenIndex];
        if (!cur) return prev;
        const screens = [...prev.screens];
        screens[screenIndex] = { ...cur, elements: [...cur.elements, el] };
        return { ...prev, screens };
      });
      setSelectedElementId(el.id);
      setDirty(true);
    },
    [design, screenIndex, snapToGrid],
  );

  const updateElement = useCallback(
    (id: string, updates: ElementPatch) => {
      setDesign((prev) => {
        if (!prev) return prev;
        const cur = prev.screens[screenIndex];
        if (!cur) return prev;
        const screens = [...prev.screens];
        screens[screenIndex] = {
          ...cur,
          elements: cur.elements.map((el) =>
            el.id === id ? ({ ...el, ...updates } as DesignElement) : el,
          ),
        };
        return { ...prev, screens };
      });
      setDirty(true);
    },
    [screenIndex],
  );

  const updateElementPosition = useCallback(
    (id: string, deltaX: number, deltaY: number) => {
      setDesign((prev) => {
        if (!prev) return prev;
        const cur = prev.screens[screenIndex];
        if (!cur) return prev;
        const screens = [...prev.screens];
        screens[screenIndex] = {
          ...cur,
          elements: cur.elements.map((el) => {
            if (el.id !== id) return el;
            let newX = el.position.x + deltaX;
            let newY = el.position.y + deltaY;
            if (snapToGrid) {
              newX = Math.round(newX / GRID_SIZE) * GRID_SIZE;
              newY = Math.round(newY / GRID_SIZE) * GRID_SIZE;
            }
            return {
              ...el,
              position: {
                ...el.position,
                x: Math.round(newX),
                y: Math.round(newY),
              },
            };
          }),
        };
        return { ...prev, screens };
      });
      setDirty(true);
    },
    [screenIndex, snapToGrid],
  );

  const deleteElement = useCallback(
    (id: string) => {
      setDesign((prev) => {
        if (!prev) return prev;
        const cur = prev.screens[screenIndex];
        if (!cur) return prev;
        const screens = [...prev.screens];
        screens[screenIndex] = { ...cur, elements: cur.elements.filter((el) => el.id !== id) };
        return { ...prev, screens };
      });
      setSelectedElementId(null);
      setDirty(true);
    },
    [screenIndex],
  );

  const selectElement = useCallback((id: string | null) => {
    setSelectedElementId(id);
  }, []);

  // ── Config & screen operations ──

  const updateConfig = useCallback((updates: Partial<DesignConfig>) => {
    setDesign((prev) => (prev ? { ...prev, config: { ...prev.config, ...updates } } : prev));
    setDirty(true);
  }, []);

  const addScreen = useCallback(() => {
    setDesign((prev) => {
      if (!prev) return prev;
      const id = genScreenId();
      const screen = { id, name: `Pantalla ${prev.screens.length + 1}`, elements: [] };
      return { ...prev, screens: [...prev.screens, screen] };
    });
    setDirty(true);
  }, []);

  const deleteScreen = useCallback(
    (index: number) => {
      setDesign((prev) => {
        if (!prev || prev.screens.length <= 1) return prev;
        const screens = prev.screens.filter((_, i) => i !== index);
        return { ...prev, screens };
      });
      if (screenIndex >= index && screenIndex > 0) {
        setScreenIndex(screenIndex - 1);
      }
      setSelectedElementId(null);
      setDirty(true);
    },
    [screenIndex],
  );

  const selectScreen = useCallback((index: number) => {
    setScreenIndex(index);
    setSelectedElementId(null);
  }, []);

  const updateScreenName = useCallback(
    (index: number, name: string) => {
      setDesign((prev) => {
        if (!prev) return prev;
        const screens = [...prev.screens];
        screens[index] = { ...screens[index]!, name };
        return { ...prev, screens };
      });
      setDirty(true);
    },
    [],
  );

  const updateScreenBackground = useCallback(
    (index: number, background: Background | undefined) => {
      setDesign((prev) => {
        if (!prev) return prev;
        const screens = [...prev.screens];
        const cur = screens[index];
        if (!cur) return prev;
        screens[index] = { ...cur, background };
        return { ...prev, screens };
      });
      setDirty(true);
    },
    [],
  );

  void currentScreen;

  return {
    design,
    designName,
    designs,
    screenIndex,
    selectedElementId,
    dirty,
    saveStatus,
    errorMsg,
    showGrid,
    setShowGrid,
    snapToGrid,
    setSnapToGrid,
    loadDesign,
    newDesign,
    refreshList,
    save,
    generate,
    closeDesign,
    addElement,
    updateElement,
    updateElementPosition,
    deleteElement,
    selectElement,
    updateConfig,
    addScreen,
    deleteScreen,
    selectScreen,
    updateScreenName,
    updateScreenBackground,
  };
}
