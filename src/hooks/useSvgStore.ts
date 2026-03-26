import { useState, useCallback, useMemo, useEffect } from "react";

export type ShapeType =
  | "rect"
  | "circle"
  | "pencil"
  | "line"
  | "arrow"
  | "text"
  | "path";

export interface SvgElement {
  id: string;
  type: ShapeType;
  x: number;
  y: number;
  width?: number;
  height?: number;
  radius?: number;
  x2?: number;
  y2?: number;
  fill: string;
  fillStyle?: "rough" | "solid";
  stroke: string;
  strokeWidth: number;
  roughness: number;
  seed: number;
  visible: boolean;
  name: string;
  points?: { x: number; y: number }[];
  content?: string; // For text or path data
  opacity?: number;
  strokeStyle?: "solid" | "dashed" | "dotted";
  fontSize?: number;
  fontFamily?: string;
  rotation?: number;
  cornerRadius?: number;
  bowing?: number;
}

const STORAGE_KEY = "vibe_code_canvas_data";

export const useSvgStore = () => {
  // Load initial state from localStorage
  const [elements, setElements] = useState<SvgElement[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  });
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Undo/Redo History
  const [history, setHistory] = useState<SvgElement[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Save to localStorage whenever elements change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(elements));
  }, [elements]);

  const pushToHistory = useCallback(
    (newElements: SvgElement[]) => {
      setHistory((prev) => {
        const newHistory = prev.slice(0, historyIndex + 1);
        newHistory.push(newElements);
        if (newHistory.length > 50) newHistory.shift();
        return newHistory;
      });
      setHistoryIndex((prev) => {
        const nextIndex = prev + 1;
        return nextIndex > 49 ? 49 : nextIndex;
      });
    },
    [historyIndex],
  );

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const prevIndex = historyIndex - 1;
      setElements(history[prevIndex]);
      setHistoryIndex(prevIndex);
      setSelectedIds([]);
    } else if (historyIndex === 0) {
      setElements([]);
      setHistoryIndex(-1);
      setSelectedIds([]);
    }
  }, [history, historyIndex]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const nextIndex = historyIndex + 1;
      setElements(history[nextIndex]);
      setHistoryIndex(nextIndex);
      setSelectedIds([]);
    }
  }, [history, historyIndex]);

  const updateAndSave = useCallback(
    (newElements: SvgElement[] | ((prev: SvgElement[]) => SvgElement[])) => {
      setElements((prev) => {
        const next =
          typeof newElements === "function" ? newElements(prev) : newElements;
        pushToHistory(next);
        return next;
      });
    },
    [pushToHistory],
  );

  const addElement = useCallback(
    (type: ShapeType, initialProps?: Partial<SvgElement>) => {
      const id = Math.random().toString(36).substring(2, 11);
      const newElement: SvgElement = {
        id,
        type,
        x: initialProps?.x ?? 400,
        y: initialProps?.y ?? 300,
        width:
          type === "rect" || type === "circle"
            ? 150
            : type === "text"
              ? 120
              : undefined,
        height:
          type === "rect" || type === "circle"
            ? 100
            : type === "text"
              ? 40
              : undefined,
        fill: "transparent",
        fillStyle: "solid",
        stroke: "#4f8bff",
        strokeWidth: 2,
        roughness: 0.5,
        opacity: 1,
        strokeStyle: "solid",
        seed: Math.floor(Math.random() * 10000),
        visible: true,
        name: `${type.charAt(0).toUpperCase() + type.slice(1)} ${elements.length + 1}`,
        points: type === "pencil" ? [] : undefined,
        x2:
          type === "line" || type === "arrow"
            ? (initialProps?.x ?? 400) + 100
            : undefined,
        y2:
          type === "line" || type === "arrow"
            ? (initialProps?.y ?? 300) + 100
            : undefined,
        content:
          type === "text" ? "" : type === "path" ? "M 0 0 L 100 100" : "",
        fontSize: type === "text" ? 24 : undefined,
        fontFamily: type === "text" ? "Inter, sans-serif" : undefined,
        rotation: 0,
        cornerRadius: type === "rect" ? 0 : undefined,
        bowing: 1,
        ...initialProps,
      };
      updateAndSave((prev) => [...prev, newElement]);
      setSelectedIds([id]);
      return id;
    },
    [elements.length, updateAndSave],
  );

  const updateElement = useCallback(
    (id: string, updates: Partial<SvgElement>) => {
      updateAndSave((prev) =>
        prev.map((el) => (el.id === id ? { ...el, ...updates } : el)),
      );
    },
    [updateAndSave],
  );

  const updateElements = useCallback(
    (
      ids: string[],
      updates: Partial<SvgElement> | ((el: SvgElement) => Partial<SvgElement>),
    ) => {
      updateAndSave((prev) =>
        prev.map((el) => {
          if (ids.includes(el.id)) {
            const actualUpdates =
              typeof updates === "function" ? updates(el) : updates;
            return { ...el, ...actualUpdates };
          }
          return el;
        }),
      );
    },
    [updateAndSave],
  );

  const toggleVisibility = useCallback(
    (id: string) => {
      updateAndSave((prev) =>
        prev.map((el) => (el.id === id ? { ...el, visible: !el.visible } : el)),
      );
    },
    [updateAndSave],
  );

  const addPoint = useCallback((id: string, x: number, y: number) => {
    setElements((prev) =>
      prev.map((el) =>
        el.id === id && el.points
          ? { ...el, points: [...el.points, { x, y }] }
          : el,
      ),
    );
    // Don't push to history on every point, just finalize on mouseUp (handled in Canvas)
  }, []);

  const removeElements = useCallback(
    (ids: string[]) => {
      updateAndSave((prev) => prev.filter((el) => !ids.includes(el.id)));
      setSelectedIds((prev) => prev.filter((sid) => !ids.includes(sid)));
    },
    [updateAndSave],
  );

  const duplicateElements = useCallback(
    (ids: string[]) => {
      updateAndSave((prev) => {
        const selected = prev.filter((el) => ids.includes(el.id));
        const copies = selected.map((el) => ({
          ...el,
          id: Math.random().toString(36).substring(2, 11),
          x: el.x + 20,
          y: el.y + 20,
          name: `${el.name} (Copy)`,
        }));
        return [...prev, ...copies];
      });
    },
    [updateAndSave],
  );

  const reorderElements = useCallback(
    (startIndex: number, endIndex: number) => {
      updateAndSave((prev) => {
        const result = Array.from(prev);
        const [removed] = result.splice(startIndex, 1);
        result.splice(endIndex, 0, removed);
        return result;
      });
    },
    [updateAndSave],
  );

  const bringToFront = useCallback(
    (ids: string[]) => {
      updateAndSave((prev) => {
        const selected = prev.filter((el) => ids.includes(el.id));
        const others = prev.filter((el) => !ids.includes(el.id));
        return [...others, ...selected];
      });
    },
    [updateAndSave],
  );

  const sendToBack = useCallback(
    (ids: string[]) => {
      updateAndSave((prev) => {
        const selected = prev.filter((el) => ids.includes(el.id));
        const others = prev.filter((el) => !ids.includes(el.id));
        return [...selected, ...others];
      });
    },
    [updateAndSave],
  );

  const alignElements = useCallback(
    (
      ids: string[],
      type: "left" | "right" | "center" | "top" | "bottom" | "middle",
    ) => {
      updateAndSave((prev) => {
        const selected = prev.filter((el) => ids.includes(el.id));
        if (selected.length < 2) return prev;

        let targetValue = 0;
        switch (type) {
          case "left":
            targetValue = Math.min(...selected.map((el) => el.x));
            break;
          case "right":
            targetValue = Math.max(
              ...selected.map((el) => el.x + (el.width || 0)),
            );
            break;
          case "top":
            targetValue = Math.min(...selected.map((el) => el.y));
            break;
          case "bottom":
            targetValue = Math.max(
              ...selected.map((el) => el.y + (el.height || 0)),
            );
            break;
          case "center": {
            const minX = Math.min(...selected.map((el) => el.x));
            const maxX = Math.max(
              ...selected.map((el) => el.x + (el.width || 0)),
            );
            targetValue = (minX + maxX) / 2;
            break;
          }
          case "middle": {
            const minY = Math.min(...selected.map((el) => el.y));
            const maxY = Math.max(
              ...selected.map((el) => el.y + (el.height || 0)),
            );
            targetValue = (minY + maxY) / 2;
            break;
          }
        }

        return prev.map((el) => {
          if (!ids.includes(el.id)) return el;
          const updates: Partial<SvgElement> = {};
          if (type === "left") updates.x = targetValue;
          if (type === "right") updates.x = targetValue - (el.width || 0);
          if (type === "top") updates.y = targetValue;
          if (type === "bottom") updates.y = targetValue - (el.height || 0);
          if (type === "center") updates.x = targetValue - (el.width || 0) / 2;
          if (type === "middle") updates.y = targetValue - (el.height || 0) / 2;
          return { ...el, ...updates };
        });
      });
    },
    [updateAndSave],
  );

  const clearCanvas = useCallback(() => {
    updateAndSave([]);
    setSelectedIds([]);
  }, [updateAndSave]);

  const selectedElements = useMemo(
    () => elements.filter((el) => selectedIds.includes(el.id)),
    [elements, selectedIds],
  );

  const selectedElement =
    selectedElements.length === 1 ? selectedElements[0] : null;

  return {
    elements,
    selectedIds,
    setSelectedIds,
    addElement,
    updateElement,
    updateElements,
    toggleVisibility,
    addPoint,
    removeElements,
    duplicateElements,
    bringToFront,
    sendToBack,
    reorderElements,
    alignElements,
    clearCanvas,
    undo,
    redo,
    canUndo: historyIndex >= 0,
    canRedo: historyIndex < history.length - 1,
    selectedElements,
    selectedElement,
  };
};
