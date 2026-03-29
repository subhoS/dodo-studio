import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import type { ShapeType, SvgElement, Project, CanvasSize } from "../types/svg";
import { simplifyPath } from "../utils/geometry";

const PROJECTS_STORAGE_KEY = "vibe_code_projects_v2";
const ACTIVE_PROJECT_KEY = "vibe_code_active_id";

interface HistoryState {
  histories: Record<string, SvgElement[][]>;
  indexes: Record<string, number>;
}

export const useSvgStore = () => {
  const [projects, setProjects] = useState<Project[]>(() => {
    const saved = localStorage.getItem(PROJECTS_STORAGE_KEY);
    if (saved) return JSON.parse(saved);
    
    // MIGRATION / INITIAL DATA
    const legacyMood = localStorage.getItem("vibe_code_canvas_data_moodboard");
    const legacyDesign = localStorage.getItem("vibe_code_canvas_data_designer");
    
    const initial: Project[] = [];
    if (legacyMood) initial.push({ id: "legacy-mood", name: "Moodboard (Migrated)", elements: JSON.parse(legacyMood), mode: "moodboard", artboardSize: { width: 2000, height: 1500 }, lastModified: Date.now() });
    if (legacyDesign) initial.push({ id: "legacy-design", name: "Designer (Migrated)", elements: JSON.parse(legacyDesign), mode: "designer", artboardSize: { width: 1080, height: 1080 }, lastModified: Date.now() });
    
    return initial;
  });

  const [activeProjectId, setActiveProjectId] = useState<string | null>(() => {
    return localStorage.getItem(ACTIVE_PROJECT_KEY) || null;
  });

  const [historyState, setHistoryState] = useState<HistoryState>({
    histories: {},
    indexes: {},
  });

  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const activeProject = useMemo(() => 
    projects.find(p => p.id === activeProjectId) || null, 
    [projects, activeProjectId]
  );

  const activeMode = activeProject?.mode || "moodboard";
  const elements = useMemo(() => activeProject?.elements || [], [activeProject]);

  const projectsRef = useRef<Project[]>(projects);
  useEffect(() => { projectsRef.current = projects; }, [projects]);

  useEffect(() => {
    localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(projects));
  }, [projects]);

  useEffect(() => {
    if (activeProjectId) localStorage.setItem(ACTIVE_PROJECT_KEY, activeProjectId);
    else localStorage.removeItem(ACTIVE_PROJECT_KEY);
  }, [activeProjectId]);

  const pushToHistory = useCallback(
    (newElements: SvgElement[]) => {
      setHistoryState((prev) => {
        if (!activeProjectId) return prev;
        const currentHistory = prev.histories[activeProjectId] ?? [[]];
        const currentIndex = prev.indexes[activeProjectId] ?? 0;
        const trimmed = currentHistory.slice(0, currentIndex + 1);
        const newHistory = [...trimmed, newElements].slice(-50);
        const newIndex = newHistory.length - 1;
        return {
          histories: { ...prev.histories, [activeProjectId]: newHistory },
          indexes: { ...prev.indexes, [activeProjectId]: newIndex },
        };
      });
    },
    [activeProjectId],
  );

  const undo = useCallback(() => {
    setHistoryState((prev) => {
      if (!activeProjectId) return prev;
      const currentIndex = prev.indexes[activeProjectId] ?? 0;
      const currentHistory = prev.histories[activeProjectId] ?? [[]];
      if (currentIndex > 0) {
        const prevIndex = currentIndex - 1;
        const targetElements = currentHistory[prevIndex];
        setProjects(pjs => pjs.map(p => p.id === activeProjectId ? { ...p, elements: targetElements } : p));
        setSelectedIds([]);
        return { ...prev, indexes: { ...prev.indexes, [activeProjectId]: prevIndex } };
      } else if (currentIndex === 0) {
        setProjects(pjs => pjs.map(p => p.id === activeProjectId ? { ...p, elements: [] } : p));
        setSelectedIds([]);
        return { ...prev, indexes: { ...prev.indexes, [activeProjectId]: -1 } };
      }
      return prev;
    });
  }, [activeProjectId]);

  const redo = useCallback(() => {
    setHistoryState((prev) => {
      if (!activeProjectId) return prev;
      const currentIndex = prev.indexes[activeProjectId] ?? 0;
      const currentHistory = prev.histories[activeProjectId] ?? [[]];
      if (currentIndex < currentHistory.length - 1) {
        const nextIndex = currentIndex + 1;
        const targetElements = currentHistory[nextIndex];
        setProjects(pjs => pjs.map(p => p.id === activeProjectId ? { ...p, elements: targetElements } : p));
        setSelectedIds([]);
        return { ...prev, indexes: { ...prev.indexes, [activeProjectId]: nextIndex } };
      }
      return prev;
    });
  }, [activeProjectId]);

  const updateAndSave = useCallback(
    (update: SvgElement[] | ((prev: SvgElement[]) => SvgElement[])) => {
      if (!activeProjectId) return;
      const currentPrj = projectsRef.current.find(p => p.id === activeProjectId);
      if (!currentPrj) return;
      const next = typeof update === "function" ? update(currentPrj.elements) : update;
      setProjects(prev => prev.map(p => p.id === activeProjectId ? { ...p, elements: next, lastModified: Date.now() } : p));
      pushToHistory(next);
    },
    [activeProjectId, pushToHistory],
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
        width: (type === "rect" || type === "circle" || type === "image" || type === "svg" || type === "section") ? 150 : (type === "text" ? 120 : undefined),
        height: (type === "rect" || type === "circle" || type === "image" || type === "svg" || type === "section") ? 100 : (type === "text" ? 40 : undefined),
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
        const findChildren = (pid: string) => {
          prev.forEach(el => { if (el.parentId === pid) { toUpdate.push(el.id); findChildren(el.id); } });
        };
        findChildren(id);
        return prev.map((el) => {
          if (!toUpdate.includes(el.id)) return el;
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

  const addPoint = useCallback(
    (id: string, x: number, y: number) => {
      if (!activeProjectId) return;
      setProjects((prev) => prev.map(p => p.id === activeProjectId ? { 
        ...p, 
        elements: p.elements.map(el => el.id === id ? { ...el, points: [...(el.points || []), { x, y }] } : el) 
      } : p));
    },
    [activeProjectId],
  );

  const finalizeDrawing = useCallback(
    (id: string) => {
      if (!activeProjectId) return;
      setProjects((prev) => {
        const target = prev.find(p => p.id === activeProjectId);
        if (!target) return prev;
        const nextElements = target.elements.map((el) => {
          if (el.id === id && el.type === "pencil" && el.points) {
            return { ...el, points: simplifyPath(el.points, 1.5) };
          }
          return el;
        });
        pushToHistory(nextElements);
        return prev.map(p => p.id === activeProjectId ? { ...p, elements: nextElements } : p);
      });
    },
    [activeProjectId, pushToHistory],
  );

  const removeElements = useCallback(
    (ids: string[]) => {
      updateAndSave((prev) => {
        const toRemove = new Set(ids);
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
      if (ids.length < 2 || !activeProjectId) return;
      const currentPrj = projectsRef.current.find(p => p.id === activeProjectId);
      if (!currentPrj) return;
      const selected = currentPrj.elements.filter(el => ids.includes(el.id));
      const minX = Math.min(...selected.map(el => el.x));
      const minY = Math.min(...selected.map(el => el.y));
      const groupId = `group-${Math.random().toString(36).substring(2, 9)}`;
      const groupNode: SvgElement = {
        id: groupId,
        type: "section",
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
    [activeProjectId, updateAndSave, elements.length]
  );

  const ungroupElements = useCallback(
    (ids: string[]) => {
       updateAndSave(prev => {
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

  const currentIndex = activeProjectId ? (historyState.indexes[activeProjectId] ?? 0) : 0;
  const currentHistory = activeProjectId ? (historyState.histories[activeProjectId] ?? [[]]) : [[]];

  const createProject = useCallback((name: string, mode: "moodboard" | "designer", size: CanvasSize) => {
    const id = `prj-${Math.random().toString(36).substring(2, 11)}`;
    const newProject: Project = { id, name, mode, artboardSize: size, elements: [], lastModified: Date.now() };
    setProjects(prev => [newProject, ...prev]);
    setActiveProjectId(id);
    return id;
  }, []);

  const deleteProject = useCallback((id: string) => {
    setProjects(prev => prev.filter(p => p.id !== id));
    if (activeProjectId === id) setActiveProjectId(null);
  }, [activeProjectId]);

  const loadProject = useCallback((id: string) => {
    setActiveProjectId(id);
    setSelectedIds([]);
  }, []);

  return {
    projects,
    activeProject,
    loadProject,
    createProject,
    deleteProject,
    elements,
    selectedIds,
    setSelectedIds,
    activeMode,
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
    updateProjectName: (name: string) => {
      if (!activeProjectId) return;
      setProjects(prev => prev.map(p => p.id === activeProjectId ? { ...p, name } : p));
    }
  };
};
