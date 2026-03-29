import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import type { ShapeType, SvgElement } from "../types/svg";
import { simplifyPath } from "../utils/geometry";

const STORAGE_KEY_PREFIX = "vibe_code_canvas_data_";

// Combined history state so pushToHistory is always atomic (no stale closure)
interface HistoryState {
  histories: Record<string, SvgElement[][]>;
  indexes: Record<string, number>;
}

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

  // Fix #2 & #8: Combined into one state object so updates are always atomic —
  // no stale closure risk, and the index always stays in sync with the history array.
  const [historyState, setHistoryState] = useState<HistoryState>({
    histories: { moodboard: [[]], designer: [[]] },
    indexes: { moodboard: 0, designer: 0 },
  });

  const [projectName, setProjectName] = useState<string>(() => {
    // Fix: read from the actual activeMode key at init time
    return localStorage.getItem(`${STORAGE_KEY_PREFIX}${activeMode}_name`) || "Untitled Project";
  });

  const elements = useMemo(() => allElements[activeMode] || [], [allElements, activeMode]);

  // Ref that always holds the latest elements — lets updateAndSave compute next elements
  // without relying on the functional setState updater (which causes illegal nested setState).
  const allElementsRef = useRef<Record<string, SvgElement[]>>(allElements);
  useEffect(() => { allElementsRef.current = allElements; }, [allElements]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}${activeMode}`, JSON.stringify(elements));
  }, [elements, activeMode]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}${activeMode}_name`, projectName);
  }, [projectName, activeMode]);

  // Fix #2 & #8: purely inside the updater — no stale closures possible
  const pushToHistory = useCallback(
    (newElements: SvgElement[]) => {
      setHistoryState((prev) => {
        const currentHistory = prev.histories[activeMode] ?? [[]];
        const currentIndex = prev.indexes[activeMode] ?? 0;
        const trimmed = currentHistory.slice(0, currentIndex + 1);
        const newHistory = [...trimmed, newElements].slice(-50);
        const newIndex = newHistory.length - 1;
        return {
          histories: { ...prev.histories, [activeMode]: newHistory },
          indexes: { ...prev.indexes, [activeMode]: newIndex },
        };
      });
    },
    [activeMode],
  );

  const undo = useCallback(() => {
    setHistoryState((prev) => {
      const currentIndex = prev.indexes[activeMode] ?? 0;
      const currentHistory = prev.histories[activeMode] ?? [[]];
      if (currentIndex > 0) {
        const prevIndex = currentIndex - 1;
        setAllElements((els) => ({ ...els, [activeMode]: currentHistory[prevIndex] }));
        setSelectedIds([]);
        return { ...prev, indexes: { ...prev.indexes, [activeMode]: prevIndex } };
      } else if (currentIndex === 0) {
        setAllElements((els) => ({ ...els, [activeMode]: [] }));
        setSelectedIds([]);
        return { ...prev, indexes: { ...prev.indexes, [activeMode]: -1 } };
      }
      return prev;
    });
  }, [activeMode]);

  const redo = useCallback(() => {
    setHistoryState((prev) => {
      const currentIndex = prev.indexes[activeMode] ?? 0;
      const currentHistory = prev.histories[activeMode] ?? [[]];
      if (currentIndex < currentHistory.length - 1) {
        const nextIndex = currentIndex + 1;
        setAllElements((els) => ({ ...els, [activeMode]: currentHistory[nextIndex] }));
        setSelectedIds([]);
        return { ...prev, indexes: { ...prev.indexes, [activeMode]: nextIndex } };
      }
      return prev;
    });
  }, [activeMode]);

  // Fix: no longer calls setState inside a setState updater.
  // Computes the next elements up-front using the ref, then calls both setters
  // as siblings in the same event — React 18 batches them into one commit.
  const updateAndSave = useCallback(
    (update: SvgElement[] | ((prev: SvgElement[]) => SvgElement[])) => {
      const currentModeElements = allElementsRef.current[activeMode] || [];
      const next = typeof update === "function" ? update(currentModeElements) : update;
      setAllElements((prev) => ({ ...prev, [activeMode]: next }));
      pushToHistory(next);
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
        width: (type === "rect" || type === "circle" || type === "image" || type === "svg") ? 150 : (type === "text" ? 120 : undefined),
        height: (type === "rect" || type === "circle" || type === "image" || type === "svg") ? 100 : (type === "text" ? 40 : undefined),
        fill: "transparent",
        fillStyle: isDesigner ? "solid" : "rough",
        stroke: isDesigner ? "#4f8bff" : "#f6f8fa",
        strokeWidth: 2,
        roughness: isDesigner ? 0 : 1.2,
        opacity: 1,
        strokeStyle: "solid",
        seed: Math.floor(Math.random() * 10000),
        visible: true,
        name: type === "image" ? "Image" : (type === "svg" ? "SVG" : `${type.charAt(0).toUpperCase() + type.slice(1)} ${elements.length + 1}`),
        points: type === "pencil" ? [] : undefined,
        x2: (type === "line" || type === "arrow") ? (initialProps?.x ?? 400) + 100 : undefined,
        y2: (type === "line" || type === "arrow") ? (initialProps?.y ?? 300) + 100 : undefined,
        content: type === "text" ? "" : (type === "path" ? "M 0 0 L 100 100" : ""),
        svgContent: initialProps?.svgContent,
        url: initialProps?.url,
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
      updateAndSave((prev) => {
        const toUpdate = [id];
        // Recursive children check
        const findChildren = (pid: string) => {
          prev.forEach(el => { if (el.parentId === pid) { toUpdate.push(el.id); findChildren(el.id); } });
        };
        findChildren(id);
        
        return prev.map((el) => {
          if (!toUpdate.includes(el.id)) return el;
          // Apply exact updates for the target, but only movement/delta for children if they were dragged?
          // Actually, if it's a direct update (like color), apply to children too? 
          // For now, let's just apply to the target. For move, we'll use updateElements.
          return el.id === id ? { ...el, ...updates } : el;
        });
      });
    },
    [updateAndSave],
  );

  const updateElements = useCallback(
    (ids: string[], updates: Partial<SvgElement> | ((el: SvgElement) => Partial<SvgElement>)) => {
      updateAndSave((prev) => {
        const allTargetIds = new Set(ids);
        
        // Find all recursive children of targets
        const findChildren = (pid: string) => {
          prev.forEach(el => {
            if (el.parentId === pid && !allTargetIds.has(el.id)) {
              allTargetIds.add(el.id);
              findChildren(el.id);
            }
          });
        };
        ids.forEach(id => findChildren(id));

        return prev.map((el) => {
          if (!allTargetIds.has(el.id)) return el;
          const up = typeof updates === "function" ? updates(el) : updates;
          return { ...el, ...up };
        });
      });
    },
    [updateAndSave],
  );

  const toggleVisibility = useCallback(
    (id: string) => {
      updateAndSave((prev) => prev.map((el) => (el.id === id ? { ...el, visible: !el.visible } : el)));
    },
    [updateAndSave],
  );

  const toggleLock = useCallback(
    (id: string) => {
      updateAndSave((prev) => prev.map((el) => (el.id === id ? { ...el, locked: !el.locked } : el)));
    },
    [updateAndSave],
  );

  // Fix #4: addPoint still bypasses history for performance during drawing
  // (pushing a history entry per mouse-move would be too expensive).
  // Canvas must call finalizeDrawing() on mouseUp to commit the stroke.
  const addPoint = useCallback(
    (id: string, x: number, y: number) => {
      setAllElements((prev) => {
        const current = prev[activeMode] || [];
        const next = current.map((el) =>
          el.id === id ? { ...el, points: [...(el.points || []), { x, y }] } : el
        );
        return { ...prev, [activeMode]: next };
      });
    },
    [activeMode],
  );

  // Fix #4: Called by Canvas after pencil stroke ends to push a history snapshot
  const finalizeDrawing = useCallback(
    (id: string) => {
      setAllElements((prev) => {
        const current = prev[activeMode] || [];
        const next = current.map((el) => {
          if (el.id === id && el.type === "pencil" && el.points) {
            return { ...el, points: simplifyPath(el.points, 1.5) };
          }
          return el;
        });
        pushToHistory(next);
        return { ...prev, [activeMode]: next };
      });
    },
    [activeMode, pushToHistory],
  );

  const removeElements = useCallback(
    (ids: string[]) => {
      updateAndSave((prev) => {
        const toRemove = new Set(ids);
        // Also remove children of these parents
        const findChildren = (pid: string) => {
             prev.forEach(el => { if (el.parentId === pid) { toRemove.add(el.id); findChildren(el.id); } });
        };
        ids.forEach(id => findChildren(id));
        return prev.filter((el) => !toRemove.has(el.id));
      });
      setSelectedIds([]);
    },
    [updateAndSave],
  );

  const groupElements = useCallback(
    (ids: string[]) => {
      if (ids.length < 2) return;
      // Step 1: Find bounds of children
      const current = allElementsRef.current[activeMode] || [];
      const selected = current.filter(el => ids.includes(el.id));
      const minX = Math.min(...selected.map(el => el.x));
      const minY = Math.min(...selected.map(el => el.y));
      
      const groupId = `group-${Math.random().toString(36).substring(2, 9)}`;
      
      // Step 2: Create a dummy Group element (represented as a transparent rect or just a logical node)
      // Actually, for DODO, let's treat groups as logical units. 
      // But we need a parent node to "hold" them.
      // Let's create a hidden 'section' or similar if we want a naming thing.
      // For now, let's just use parentId referring to the FIRST element in the list? No, that's messy.
      // Let's create a "group" node.
      const groupNode: SvgElement = {
        id: groupId,
        type: "section", // We'll use 'section' for grouping too but styled specifically
        name: `Group ${elements.length / 5 + 1}`,
        x: minX,
        y: minY,
        fill: "transparent",
        stroke: "transparent",
        strokeWidth: 0,
        visible: true,
        seed: Math.random(),
        roughness: 0,
      };

      updateAndSave(prev => {
        const next = prev.map(el => ids.includes(el.id) ? { ...el, parentId: groupId } : el);
        return [...next, groupNode];
      });
      setSelectedIds([groupId]);
    },
    [activeMode, updateAndSave, elements.length]
  );

  const ungroupElements = useCallback(
    (ids: string[]) => {
       updateAndSave(prev => {
         // If a group node is selected, unparent its children and delete the group node
         const parentsToDelete = new Set<string>();
         const next = prev.map(el => {
           if (ids.includes(el.parentId || "")) return { ...el, parentId: undefined };
           if (ids.includes(el.id) && el.type === "section") { parentsToDelete.add(el.id); }
           return el;
         });
         return next.filter(el => !parentsToDelete.has(el.id));
       });
    },
    [updateAndSave]
  );

  const duplicateElements = useCallback(
    (ids: string[]) => {
      updateAndSave((prev) => {
        const toDup = prev.filter((el) => ids.includes(el.id));
        const newEls = toDup.map((el) => ({
          ...el,
          id: Math.random().toString(36).substring(2, 11),
          x: el.x + 20,
          y: el.y + 20,
          name: `${el.name} (Copy)`,
        }));
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

  // Fix #3/#6: removed the `< 2` guard — single-element calls are now no-ops
  // (min===max so all alignments resolve to the element's own position).
  const alignElements = useCallback(
    (ids: string[], alignment: "left" | "center" | "right" | "top" | "v-center" | "bottom") => {
      updateAndSave((prev) => {
        const selected = prev.filter((el) => ids.includes(el.id));
        if (selected.length < 1) return prev;
        const minX = Math.min(...selected.map((el) => el.x));
        const maxX = Math.max(...selected.map((el) => el.x + (el.width || 0)));
        const minY = Math.min(...selected.map((el) => el.y));
        const maxY = Math.max(...selected.map((el) => el.y + (el.height || 0)));
        return prev.map((el) => {
          if (!ids.includes(el.id)) return el;
          switch (alignment) {
            case "left":     return { ...el, x: minX };
            case "center":   return { ...el, x: minX + (maxX - minX) / 2 - (el.width || 0) / 2 };
            case "right":    return { ...el, x: maxX - (el.width || 0) };
            case "top":      return { ...el, y: minY };
            case "v-center": return { ...el, y: minY + (maxY - minY) / 2 - (el.height || 0) / 2 };
            case "bottom":   return { ...el, y: maxY - (el.height || 0) };
            default:         return el;
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

  const selectedElements = useMemo(
    () => elements.filter((el) => selectedIds.includes(el.id)),
    [elements, selectedIds],
  );
  const selectedElement = selectedElements[0] || null;

  const currentIndex = historyState.indexes[activeMode] ?? 0;
  const currentHistory = historyState.histories[activeMode] ?? [[]];

  return {
    elements,
    selectedIds,
    setSelectedIds,
    addElement,
    updateElement,
    updateElements,
    removeElements,
    toggleVisibility,
    toggleLock,
    addPoint,
    finalizeDrawing,
    groupElements,
    ungroupElements,
    duplicateElements,
    bringToFront,
    sendToBack,
    reorderElements,
    alignElements,
    clearCanvas,
    undo,
    redo,
    canUndo: currentIndex > 0,
    canRedo: currentIndex < currentHistory.length - 1,
    selectedElements,
    selectedElement,
    projectName,
    setProjectName,
  };
};
