import { useState, useRef, useCallback } from "react";
import type { ShapeType, SvgElement } from "../../types/svg";
import { isElementInBox, getElementBounds } from "../../utils/geometry";

export type DragMode = "move" | "create" | "resize" | "select" | "pencil" | "group-resize" | "group-rotate" | "eraser";

export interface DragInfo {
  mode: DragMode; id?: string; startX: number; startY: number; handle?: string;
  elementOffsets?: { id: string; x: number; y: number; x2?: number; y2?: number; points?: { x: number; y: number }[]; width?: number; height?: number; fontSize?: number; rotation?: number; }[];
  originalElement?: Partial<SvgElement>;
  groupBounds?: { gx: number; gy: number; gw: number; gh: number; handle: string };
  groupCenter?: { cx: number; cy: number; startAngle: number };
}

interface UseCanvasDragProps {
  elements: SvgElement[];
  selectedIds: string[];
  onSelect: (ids: string[] | null) => void;
  onAddPoint: (id: string, x: number, y: number) => void;
  onFinalizeDrawing: (id: string) => void;
  onUpdateElement: (id: string, updates: Partial<SvgElement>) => void;
  onUpdateElements: (
    ids: string[],
    updates: Partial<SvgElement> | ((el: SvgElement) => Partial<SvgElement>),
  ) => void;
  onAddElement: (type: ShapeType, props: any) => string;
  activeTool: string;
  onSetActiveTool: (tool: string) => void;
  zoom: number;
  offset: { x: number; y: number };
  setOffset: React.Dispatch<React.SetStateAction<{ x: number; y: number }>>;
  gridEnabled?: boolean;
  svgRef: React.RefObject<SVGSVGElement | null>;
  setEditingTextId: (id: string | null) => void;
  setEditingTextPos: (pos: { x: number; y: number } | null) => void;
  isNewTextRef: React.MutableRefObject<boolean>;
  handleEraserDrag: (pos: { x: number; y: number }) => void;
  resetEraser: () => void;
  setEraserPos: (pos: { x: number; y: number } | null) => void;
}

export function useCanvasDrag({
  elements,
  selectedIds,
  onSelect,
  onAddPoint,
  onFinalizeDrawing,
  onUpdateElement,
  onUpdateElements,
  onAddElement,
  activeTool,
  onSetActiveTool,
  zoom,
  offset,
  setOffset,
  gridEnabled = true,
  svgRef,
  setEditingTextId,
  setEditingTextPos,
  isNewTextRef,
  handleEraserDrag,
  resetEraser,
  setEraserPos,
}: UseCanvasDragProps) {
  const [dragInfo, setDragInfo] = useState<DragInfo | null>(null);
  const [selectionBox, setSelectionBox] = useState<{ x: number; y: number; width: number; height: number; } | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [snappingLines, setSnappingLines] = useState<{ x?: number; y?: number } | null>(null);
  const drawingIdRef = useRef<string | null>(null);

  const getMousePos = useCallback((e: React.MouseEvent | MouseEvent) => {
    if (!svgRef.current) return { x: 0, y: 0 };
    const rect = svgRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left, y = e.clientY - rect.top;
    return { x: x / (zoom / 100) - offset.x, y: y / (zoom / 100) - offset.y };
  }, [zoom, offset, svgRef]);

  const snapToGrid = useCallback((val: number) => (gridEnabled ? Math.round(val / 30) * 30 : val), [gridEnabled]);

  const handleMouseDown = (e: React.MouseEvent) => {
    const pos = getMousePos(e);
    if (activeTool === "pencil") {
      const id = onAddElement("pencil", { x: pos.x, y: pos.y, points: [pos] });
      drawingIdRef.current = id;
      setDragInfo({ mode: "pencil", startX: pos.x, startY: pos.y });
      return;
    }
    if (activeTool === "eraser") {
      setDragInfo({ mode: "eraser", startX: pos.x, startY: pos.y });
      return;
    }
    if (["rect", "circle", "line", "arrow"].includes(activeTool)) {
      const snPos = { x: snapToGrid(pos.x), y: snapToGrid(pos.y) };
      const id = onAddElement(activeTool as ShapeType, { x: snPos.x, y: snPos.y, width: 0, height: 0, x2: snPos.x, y2: snPos.y });
      setDragInfo({ mode: "create", id, startX: snPos.x, startY: snPos.y });
      onSelect([id]);
      return;
    }
    if (activeTool === "import") {
      document.getElementById("import-input")?.click();
      return;
    }
    if (activeTool === "text") {
      e.preventDefault();

      const clickedText = [...elements].reverse().find(el => {
        if (el.type !== "text") return false;
        const b = getElementBounds(el);
        return pos.x >= b.x && pos.x <= b.x + b.width && pos.y >= b.y && pos.y <= b.y + b.height;
      });

      if (clickedText) {
        onSelect([clickedText.id]);
        setEditingTextId(clickedText.id);
        setEditingTextPos({ x: clickedText.x, y: clickedText.y });
        isNewTextRef.current = false;
      } else {
        const id = onAddElement("text", { x: pos.x, y: pos.y, content: "" });
        onSelect([id]);
        setEditingTextId(id);
        setEditingTextPos({ x: pos.x, y: pos.y });
        isNewTextRef.current = true;
      }
      return;
    }
    if (activeTool === "selection" && (e.button === 1 || e.altKey)) {
      setIsPanning(true);
      setDragInfo({ mode: "move", startX: e.clientX, startY: e.clientY });
      return;
    }
    if (activeTool === "rect" || activeTool === "circle" || activeTool === "line" || activeTool === "arrow" || activeTool === "section") {
      const id = onAddElement(activeTool as ShapeType, { x: pos.x, y: pos.y, width: 0, height: 0 });
      setDragInfo({ mode: "create", id, startX: pos.x, startY: pos.y });
      return;
    }
    if (activeTool === "selection" && e.target === svgRef.current) {
      onSelect([]);
      setSelectionBox({ x: pos.x, y: pos.y, width: 0, height: 0 });
      setDragInfo({ mode: "select", startX: pos.x, startY: pos.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const pos = getMousePos(e);
    if (activeTool === "eraser") {
      setEraserPos(pos);
    }
    if (isPanning && dragInfo) {
      const dx = (e.clientX - dragInfo.startX) / (zoom / 100);
      const dy = (e.clientY - dragInfo.startY) / (zoom / 100);
      setOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
      setDragInfo({ ...dragInfo, startX: e.clientX, startY: e.clientY });
      return;
    }
    if (!dragInfo) return;
    const maybeSnap = (v: number) => (gridEnabled && e.shiftKey ? snapToGrid(v) : v);
    const snPos = { x: maybeSnap(pos.x), y: maybeSnap(pos.y) };

    if (gridEnabled && e.shiftKey) {
      setSnappingLines({
        x: Math.abs(pos.x - snPos.x) < 5 ? snPos.x : undefined,
        y: Math.abs(pos.y - snPos.y) < 5 ? snPos.y : undefined,
      });
    } else {
      setSnappingLines(null);
    }

    if (dragInfo.mode === "pencil" && drawingIdRef.current) {
      onAddPoint(drawingIdRef.current, pos.x, pos.y);
    } else if (dragInfo.mode === "create" && dragInfo.id) {
      const target = elements.find(el => el.id === dragInfo.id);
      if (!target) return;
      if (target.type === "line" || target.type === "arrow") {
        onUpdateElement(dragInfo.id, { x2: snPos.x, y2: snPos.y });
      } else {
        let newWidth = Math.abs(snPos.x - dragInfo.startX);
        let newHeight = Math.abs(snPos.y - dragInfo.startY);

        if (e.shiftKey) {
          const size = Math.max(newWidth, newHeight);
          newWidth = size;
          newHeight = size;
        }

        let newX, newY;
        if (e.altKey) {
          newX = dragInfo.startX - newWidth;
          newY = dragInfo.startY - newHeight;
          newWidth *= 2;
          newHeight *= 2;
        } else {
          newX = Math.min(snPos.x, dragInfo.startX);
          newY = Math.min(snPos.y, dragInfo.startY);
          if (e.shiftKey) {
            newX = snPos.x < dragInfo.startX ? dragInfo.startX - newWidth : dragInfo.startX;
            newY = snPos.y < dragInfo.startY ? dragInfo.startY - newHeight : dragInfo.startY;
          }
        }
        onUpdateElement(dragInfo.id, { x: newX, y: newY, width: newWidth, height: newHeight });
      }
    } else if (dragInfo && dragInfo.mode === "eraser") {
      handleEraserDrag(pos);
    } else if (dragInfo.mode === "move") {
      let finalDx = pos.x - dragInfo.startX;
      let finalDy = pos.y - dragInfo.startY;
      let snapX: number | undefined;
      let snapY: number | undefined;

      // Smart Guides (Snap-to-edge / Snap-to-center)
      if (!e.shiftKey && dragInfo.elementOffsets && dragInfo.elementOffsets.length > 0) {
        let movedMinX = Infinity, movedMinY = Infinity, movedMaxX = -Infinity, movedMaxY = -Infinity;
        dragInfo.elementOffsets.forEach(off => {
          const w = off.width ?? 0, h = off.height ?? 0;
          movedMinX = Math.min(movedMinX, off.x);
          movedMinY = Math.min(movedMinY, off.y);
          movedMaxX = Math.max(movedMaxX, off.x + w);
          movedMaxY = Math.max(movedMaxY, off.y + h);
        });

        const curMinX = movedMinX + finalDx, curMaxX = movedMaxX + finalDx, curCenterX = (curMinX + curMaxX) / 2;
        const curMinY = movedMinY + finalDy, curMaxY = movedMaxY + finalDy, curCenterY = (curMinY + curMaxY) / 2;

        const SNAP_THRESHOLD = 6 / (zoom / 100); // 6px visual threshold
        let bestSnapDistX = SNAP_THRESHOLD;
        let bestSnapDistY = SNAP_THRESHOLD;

        elements.forEach(el => {
          if (selectedIds.includes(el.id) || !el.visible || el.type === "pencil") return;
          const b = getElementBounds(el);
          const targetMinX = b.x, targetMaxX = b.x + b.width, targetCenterX = b.x + b.width / 2;
          const targetMinY = b.y, targetMaxY = b.y + b.height, targetCenterY = b.y + b.height / 2;

          // Horizontal Snaps (Aligning vertically)
          const xOptions = [
            { t: targetMinX, m: curMinX, dx: targetMinX - movedMinX },
            { t: targetMinX, m: curMaxX, dx: targetMinX - movedMaxX },
            { t: targetCenterX, m: curCenterX, dx: targetCenterX - (movedMinX + movedMaxX) / 2 },
            { t: targetMaxX, m: curMinX, dx: targetMaxX - movedMinX },
            { t: targetMaxX, m: curMaxX, dx: targetMaxX - movedMaxX }
          ];
          for (const opt of xOptions) {
            const dist = Math.abs(opt.t - opt.m);
            if (dist < bestSnapDistX) { bestSnapDistX = dist; finalDx = opt.dx; snapX = opt.t; }
          }

          // Vertical Snaps (Aligning horizontally)
          const yOptions = [
            { t: targetMinY, m: curMinY, dy: targetMinY - movedMinY },
            { t: targetMinY, m: curMaxY, dy: targetMinY - movedMaxY },
            { t: targetCenterY, m: curCenterY, dy: targetCenterY - (movedMinY + movedMaxY) / 2 },
            { t: targetMaxY, m: curMinY, dy: targetMaxY - movedMinY },
            { t: targetMaxY, m: curMaxY, dy: targetMaxY - movedMaxY }
          ];
          for (const opt of yOptions) {
            const dist = Math.abs(opt.t - opt.m);
            if (dist < bestSnapDistY) { bestSnapDistY = dist; finalDy = opt.dy; snapY = opt.t; }
          }
        });
      }

      if (!e.shiftKey) { setSnappingLines({ x: snapX, y: snapY }); }
      
      const dx = finalDx, dy = finalDy;
      onUpdateElements(selectedIds, el => {
        const off = dragInfo.elementOffsets?.find(o => o.id === el.id);
        if (!off) return {};
        const updates: Partial<SvgElement> = { x: maybeSnap(off.x + dx), y: maybeSnap(off.y + dy) };
        if (el.type === "line" || el.type === "arrow") {
          updates.x2 = maybeSnap((off.x2 || 0) + dx);
          updates.y2 = maybeSnap((off.y2 || 0) + dy);
        } else if (el.type === "pencil" && off.points) {
          updates.points = off.points.map(p => ({ x: p.x + dx, y: p.y + dy }));
        }
        return updates;
      });

      selectedIds.forEach(id => {
        const el = elements.find(e => e.id === id);
        if (el && el.type !== "section") {
          const sections = elements.filter(e => e.type === "section" && !selectedIds.includes(e.id));
          const parentSection = sections.find(s => {
            const b = getElementBounds(el);
            const sb = getElementBounds(s);
            const cx = b.x + b.width / 2;
            const cy = b.y + b.height / 2;
            return cx >= sb.x && cx <= sb.x + sb.width && cy >= sb.y && cy <= sb.y + sb.height;
          });
          if (parentSection && el.parentId !== parentSection.id) onUpdateElement(el.id, { parentId: parentSection.id });
          else if (!parentSection && el.parentId) onUpdateElement(el.id, { parentId: undefined });
        }
      });
    } else if (dragInfo.mode === "select") {
      const box = { x: dragInfo.startX, y: dragInfo.startY, width: snPos.x - dragInfo.startX, height: snPos.y - dragInfo.startY };
      setSelectionBox(box);
      const ids = elements.filter(el => el.visible && isElementInBox(el, box)).map(el => el.id);
      if (JSON.stringify(ids) !== JSON.stringify(selectedIds)) onSelect(ids);
    } else {
      if (activeTool === "selection" && !dragInfo) {
        const hovered = [...elements].reverse().find(el => {
          if (!el.visible || el.locked) return false;
          const b = getElementBounds(el);
          return pos.x >= b.x && pos.x <= b.x + b.width && pos.y >= b.y && pos.y <= b.y + b.height;
        });
        setHoveredId(hovered?.id || null);
      }
    }

    if (dragInfo.mode === "group-resize" && dragInfo.groupBounds) {
      const { gx, gy, gw, gh, handle } = dragInfo.groupBounds;
      let anchorX: number, anchorY: number, newGw: number, newGh: number;
      switch (handle) {
        case "br": anchorX = gx; anchorY = gy; newGw = Math.max(20, snPos.x - gx); newGh = Math.max(20, snPos.y - gy); break;
        case "bl": anchorX = gx + gw; anchorY = gy; newGw = Math.max(20, (gx + gw) - snPos.x); newGh = Math.max(20, snPos.y - gy); break;
        case "tr": anchorX = gx; anchorY = gy + gh; newGw = Math.max(20, snPos.x - gx); newGh = Math.max(20, (gy + gh) - snPos.y); break;
        case "tl": anchorX = gx + gw; anchorY = gy + gh; newGw = Math.max(20, (gx + gw) - snPos.x); newGh = Math.max(20, (gy + gh) - snPos.y); break;
        default: anchorX = gx; anchorY = gy; newGw = gw; newGh = gh;
      }
      const scaleX = newGw / gw, scaleY = newGh / gh;
      onUpdateElements(selectedIds, el => {
        const off = dragInfo.elementOffsets?.find(o => o.id === el.id);
        if (!off) return {};
        const updates: Partial<SvgElement> = { x: anchorX + (off.x - anchorX) * scaleX, y: anchorY + (off.y - anchorY) * scaleY };
        if (off.width !== undefined) updates.width = Math.max(5, off.width * scaleX);
        if (off.height !== undefined) updates.height = Math.max(5, off.height * scaleY);
        if (off.fontSize !== undefined) updates.fontSize = Math.max(8, off.fontSize * Math.min(scaleX, scaleY));
        if (el.type === "line" || el.type === "arrow") {
          if (off.x2 !== undefined) updates.x2 = anchorX + (off.x2 - anchorX) * scaleX;
          if (off.y2 !== undefined) updates.y2 = anchorY + (off.y2 - anchorY) * scaleY;
        }
        if (el.type === "pencil" && off.points) {
          updates.points = off.points.map(p => ({ x: anchorX + (p.x - anchorX) * scaleX, y: anchorY + (p.y - anchorY) * scaleY }));
        }
        return updates;
      });
    } else if (dragInfo.mode === "group-rotate" && dragInfo.groupCenter) {
      const { cx, cy, startAngle } = dragInfo.groupCenter;
      const currentAngle = Math.atan2(snPos.y - cy, snPos.x - cx);
      const deltaDeg = (currentAngle - startAngle) * (180 / Math.PI);
      const rad = deltaDeg * (Math.PI / 180);
      const cosA = Math.cos(rad), sinA = Math.sin(rad);
      const rotPt = (px: number, py: number) => ({
        x: cx + (px - cx) * cosA - (py - cy) * sinA,
        y: cy + (px - cx) * sinA + (py - cy) * cosA,
      });
      onUpdateElements(selectedIds, el => {
        const off = dragInfo.elementOffsets?.find(o => o.id === el.id);
        if (!off) return {};
        const updates: Partial<SvgElement> = {};
        if (el.type === "line" || el.type === "arrow") {
          const s = rotPt(off.x, off.y);
          const e2 = rotPt(off.x2 ?? off.x, off.y2 ?? off.y);
          updates.x = s.x; updates.y = s.y;
          updates.x2 = e2.x; updates.y2 = e2.y;
        } else if (el.type === "pencil" && off.points) {
          const newPts = off.points.map(p => rotPt(p.x, p.y));
          updates.points = newPts;
          updates.x = newPts[0]?.x ?? off.x;
          updates.y = newPts[0]?.y ?? off.y;
        } else if (el.type === "circle") {
          const nc = rotPt(off.x, off.y);
          updates.x = nc.x; updates.y = nc.y;
          updates.rotation = ((off.rotation ?? 0) + deltaDeg + 360) % 360;
        } else {
          const hw = (off.width ?? 0) / 2;
          const hh = (off.height ?? 0) / 2;
          const nc = rotPt(off.x + hw, off.y + hh);
          updates.x = nc.x - hw;
          updates.y = nc.y - hh;
          updates.rotation = ((off.rotation ?? 0) + deltaDeg + 360) % 360;
        }
        return updates;
      });
    } else if (dragInfo.mode === "resize" && dragInfo.id && dragInfo.originalElement) {
      const el = dragInfo.originalElement as SvgElement, dx = snPos.x - dragInfo.startX, dy = snPos.y - dragInfo.startY;
      const updates: Partial<SvgElement> = {};
      if (dragInfo.handle === "rotate") {
        let cX = el.x + (el.width || 0) / 2, cY = el.y + (el.height || 0) / 2;
        updates.rotation = (Math.atan2(snPos.y - cY, snPos.x - cX) * 180 / Math.PI) + 90;
      } else {
        const h = dragInfo.handle;
        if (!h) return;
        if (["tl", "tr", "bl", "br"].includes(h)) {
          let newW = el.width || 0, newH = el.height || 0, newX = el.x, newY = el.y;
          if (h.includes("r")) newW = Math.max(5, (el.width || 0) + dx);
          else { newW = Math.max(5, (el.width || 0) - dx); newX = el.x + dx; }
          if (h.includes("b")) newH = Math.max(5, (el.height || 0) + dy);
          else { newH = Math.max(5, (el.height || 0) - dy); newY = el.y + dy; }

          if (el.type === "image" || el.type === "svg" || el.type === "text") {
            const aspect = (el.width || 1) / (el.height || 1);
            if (newW / newH > aspect) newW = newH * aspect;
            else newH = newW / aspect;
            if (h.includes("l")) newX = (el.x + (el.width || 0)) - newW;
            if (h.includes("t")) newY = (el.y + (el.height || 0)) - newH;
            if (el.type === "text") {
              const scale = newW / (el.width || 20);
              updates.fontSize = Math.max(8, Math.round((el.fontSize || 24) * scale));
            }
          }
          updates.width = newW; updates.height = newH; updates.x = newX; updates.y = newY;
        } else if (h === "p1") { updates.x = (el.x || 0) + dx; updates.y = (el.y || 0) + dy; }
        else if (h === "p2") { updates.x2 = (el.x2 || 0) + dx; updates.y2 = (el.y2 || 0) + dy; }
      }
      onUpdateElement(dragInfo.id, updates);
    }
  };

  const handleMouseUp = () => {
    if (dragInfo?.mode === "pencil" && drawingIdRef.current) {
      onFinalizeDrawing(drawingIdRef.current);
    }
    if (dragInfo && (dragInfo.mode === "create" || dragInfo.mode === "pencil") && dragInfo.id) {
      const el = elements.find(e => e.id === dragInfo.id);
      if (el) {
        const sections = elements.filter(e => e.type === "section" && e.id !== el.id);
        const parentSection = sections.find(s => {
          const b = getElementBounds(el);
          const sb = getElementBounds(s);
          const cx = b.x + b.width / 2;
          const cy = b.y + b.height / 2;
          return cx >= sb.x && cx <= sb.x + sb.width && cy >= sb.y && cy <= sb.y + sb.height;
        });
        if (parentSection) onUpdateElement(el.id, { parentId: parentSection.id });
      }
    }
    if (dragInfo && (dragInfo.mode === "create" || dragInfo.mode === "pencil")) {
      onSetActiveTool("selection");
    }
    setSnappingLines(null);
    setIsPanning(false);
    drawingIdRef.current = null;
    setDragInfo(null);
    setSelectionBox(null);
    setEraserPos(null);
    resetEraser();
  };

  return {
    dragInfo,
    setDragInfo,
    selectionBox,
    isPanning,
    hoveredId,
    snappingLines,
    getMousePos,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
  };
}
