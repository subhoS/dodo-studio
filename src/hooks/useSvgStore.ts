import { useState, useCallback, useMemo, useEffect } from "react";
import type { ShapeType, SvgElement } from "../types/svg";

const STORAGE_KEY_PREFIX = "vibe_code_canvas_data_";

export const useSvgStore = (activeMode: "moodboard" | "designer" = "moodboard") => {
  const [allElements, setAllElements] = useState<Record<string, SvgElement[]>>(() => {
    const savedMoodboard = localStorage.getItem(`${STORAGE_KEY_PREFIX}moodboard`);
    const savedDesigner = localStorage.getItem(`${STORAGE_KEY_PREFIX}designer`);
    return {
      moodboard: savedMoodboard ? JSON.parse(savedMoodboard) : [],
      designer: savedDesigner ? JSON.parse(savedDesigner) : [],
    };
  });

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  const [histories, setHistories] = useState<Record<string, SvgElement[][]>>({
    moodboard: [[]],
    designer: [[]],
  });
  const [historyIndexes, setHistoryIndexes] = useState<Record<string, number>>({
    moodboard: 0,
    designer: 0,
  });

  const [projectName, setProjectName] = useState<string>(() => {
    return localStorage.getItem(`${STORAGE_KEY_PREFIX}${activeMode}_name`) || "Untitled Project";
  });

  const elements = useMemo(() => allElements[activeMode] || [], [allElements, activeMode]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}${activeMode}`, JSON.stringify(elements));
  }, [elements, activeMode]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}${activeMode}_name`, projectName);
  }, [projectName, activeMode]);

  const pushToHistory = useCallback((newElements: SvgElement[]) => {
    setHistories(prev => {
      const currentHistory = prev[activeMode];
      const currentIndex = historyIndexes[activeMode];
      const newHistory = [...currentHistory.slice(0, currentIndex + 1), newElements].slice(-50);
      return { ...prev, [activeMode]: newHistory };
    });
    setHistoryIndexes(prev => ({ ...prev, [activeMode]: Math.min(prev[activeMode] + 1, 49) }));
  }, [activeMode, historyIndexes]);

  const undo = useCallback(() => {
    const currentIndex = historyIndexes[activeMode];
    const currentHistory = histories[activeMode];
    if (currentIndex > 0) {
      const prevIndex = currentIndex - 1;
      const prevElements = currentHistory[prevIndex];
      setAllElements(prev => ({ ...prev, [activeMode]: prevElements }));
      setHistoryIndexes(prev => ({ ...prev, [activeMode]: prevIndex }));
      setSelectedIds([]);
    } else if (currentIndex === 0) {
      setAllElements(prev => ({ ...prev, [activeMode]: [] }));
      setHistoryIndexes(prev => ({ ...prev, [activeMode]: -1 }));
      setSelectedIds([]);
    }
  }, [activeMode, historyIndexes, histories]);

  const redo = useCallback(() => {
    const currentIndex = historyIndexes[activeMode];
    const currentHistory = histories[activeMode];
    if (currentIndex < currentHistory.length - 1) {
      const nextIndex = currentIndex + 1;
      const nextElements = currentHistory[nextIndex];
      setAllElements(prev => ({ ...prev, [activeMode]: nextElements }));
      setHistoryIndexes(prev => ({ ...prev, [activeMode]: nextIndex }));
      setSelectedIds([]);
    }
  }, [activeMode, historyIndexes, histories]);

  const updateAndSave = useCallback(
    (newElements: SvgElement[] | ((prev: SvgElement[]) => SvgElement[])) => {
      setAllElements((prev) => {
        const currentModeElements = prev[activeMode] || [];
        const next = typeof newElements === "function" ? newElements(currentModeElements) : newElements;
        pushToHistory(next);
        return { ...prev, [activeMode]: next };
      });
    },
    [activeMode, pushToHistory],
  );

  const addElement = useCallback(
    (type: ShapeType, initialProps?: Partial<SvgElement>) => {
      const isDesigner = activeMode === "designer";
      const id = Math.random().toString(36).substring(2, 11);
      const newElement: SvgElement = {
        id,
        type,
        x: initialProps?.x ?? 400,
        y: initialProps?.y ?? 300,
        width: (type === "rect" || type === "circle") ? 150 : (type === "text" ? 120 : undefined),
        height: (type === "rect" || type === "circle") ? 100 : (type === "text" ? 40 : undefined),
        fill: "transparent",
        fillStyle: isDesigner ? "solid" : "rough",
        stroke: isDesigner ? "#4f8bff" : "#f6f8fa",
        strokeWidth: 2,
        roughness: isDesigner ? 0 : 1.2,
        opacity: 1,
        strokeStyle: "solid",
        seed: Math.floor(Math.random() * 10000),
        visible: true,
        name: `${type.charAt(0).toUpperCase() + type.slice(1)} ${elements.length + 1}`,
        points: type === "pencil" ? [] : undefined,
        x2: (type === "line" || type === "arrow") ? (initialProps?.x ?? 400) + 100 : undefined,
        y2: (type === "line" || type === "arrow") ? (initialProps?.y ?? 300) + 100 : undefined,
        content: type === "text" ? "" : (type === "path" ? "M 0 0 L 100 100" : ""),
        fontSize: type === "text" ? 24 : undefined,
        fontFamily: type === "text" ? (isDesigner ? "Inter, sans-serif" : "Verdana, sans-serif") : undefined,
        rotation: 0,
        cornerRadius: type === "rect" ? 0 : undefined,
        bowing: isDesigner ? 0 : 1.5,
        ...initialProps,
      };
      updateAndSave((prev) => [...prev, newElement]);
      setSelectedIds([id]);
      return id;
    },
    [elements.length, updateAndSave, activeMode],
  );

  const updateElement = useCallback(
    (id: string, updates: Partial<SvgElement>) => {
      updateAndSave((prev) => prev.map((el) => (el.id === id ? { ...el, ...updates } : el)));
    },
    [updateAndSave],
  );

  const updateElements = useCallback(
    (ids: string[], updates: Partial<SvgElement> | ((el: SvgElement) => Partial<SvgElement>)) => {
      updateAndSave((prev) =>
        prev.map((el) => {
          if (!ids.includes(el.id)) return el;
          const up = typeof updates === "function" ? updates(el) : updates;
          return { ...el, ...up };
        })
      );
    },
    [updateAndSave],
  );

  const toggleVisibility = useCallback(
    (id: string) => {
      updateAndSave((prev) => prev.map((el) => (el.id === id ? { ...el, visible: !el.visible } : el)));
    },
    [updateAndSave],
  );

  const addPoint = useCallback(
    (id: string, x: number, y: number) => {
      setAllElements((prev) => {
        const current = prev[activeMode] || [];
        const next = current.map((el) => (el.id === id ? { ...el, points: [...(el.points || []), { x, y }] } : el));
        return { ...prev, [activeMode]: next };
      });
    },
    [activeMode],
  );

  const removeElements = useCallback(
    (ids: string[]) => {
      updateAndSave((prev) => prev.filter((el) => !ids.includes(el.id)));
      setSelectedIds([]);
    },
    [updateAndSave],
  );

  const duplicateElements = useCallback(
    (ids: string[]) => {
      updateAndSave((prev) => {
        const toDup = prev.filter((el) => ids.includes(el.id));
        const newEls = toDup.map((el) => ({ ...el, id: Math.random().toString(36).substring(2, 11), x: el.x + 20, y: el.y + 20, name: `${el.name} (Copy)` }));
        return [...prev, ...newEls];
      });
    },
    [updateAndSave],
  );

  const reorderElements = useCallback(
    (fromIdx: number, toIdx: number) => {
      updateAndSave((prev) => {
        const result = Array.from(prev);
        const [removed] = result.splice(fromIdx, 1);
        result.splice(toIdx, 0, removed);
        return result;
      });
    },
    [updateAndSave],
  );

  const bringToFront = useCallback(
    (ids: string[]) => {
      updateAndSave((prev) => {
        const selected = prev.filter((el) => ids.includes(el.id));
        const remaining = prev.filter((el) => !ids.includes(el.id));
        return [...remaining, ...selected];
      });
    },
    [updateAndSave],
  );

  const sendToBack = useCallback(
    (ids: string[]) => {
      updateAndSave((prev) => {
        const selected = prev.filter((el) => ids.includes(el.id));
        const remaining = prev.filter((el) => !ids.includes(el.id));
        return [...selected, ...remaining];
      });
    },
    [updateAndSave],
  );

  const alignElements = useCallback(
    (ids: string[], alignment: "left" | "center" | "right" | "top" | "v-center" | "bottom") => {
      updateAndSave((prev) => {
        const selected = prev.filter((el) => ids.includes(el.id));
        if (selected.length < 2) return prev;
        let minX = Math.min(...selected.map(el => el.x));
        let maxX = Math.max(...selected.map(el => el.x + (el.width || 0)));
        let minY = Math.min(...selected.map(el => el.y));
        let maxY = Math.max(...selected.map(el => el.y + (el.height || 0)));
        return prev.map(el => {
          if (!ids.includes(el.id)) return el;
          switch (alignment) {
            case "left": return { ...el, x: minX };
            case "center": return { ...el, x: minX + (maxX - minX) / 2 - (el.width || 0) / 2 };
            case "right": return { ...el, x: maxX - (el.width || 0) };
            case "top": return { ...el, y: minY };
            case "v-center": return { ...el, y: minY + (maxY - minY) / 2 - (el.height || 0) / 2 };
            case "bottom": return { ...el, y: maxY - (el.height || 0) };
            default: return el;
          }
        });
      });
    },
    [updateAndSave],
  );

  const clearCanvas = useCallback(() => {
    updateAndSave([]);
    setSelectedIds([]);
  }, [updateAndSave]);

  const selectedElements = useMemo(() => elements.filter((el) => selectedIds.includes(el.id)), [elements, selectedIds]);
  const selectedElement = selectedElements[0] || null;

  return {
    elements,
    selectedIds,
    setSelectedIds,
    addElement,
    updateElement,
    updateElements,
    removeElements,
    toggleVisibility,
    addPoint,
    duplicateElements,
    bringToFront,
    sendToBack,
    reorderElements,
    alignElements,
    clearCanvas,
    undo,
    redo,
    canUndo: historyIndexes[activeMode] > 0,
    canRedo: historyIndexes[activeMode] < histories[activeMode].length - 1,
    selectedElements,
    selectedElement,
    projectName,
    setProjectName,
  };
};
