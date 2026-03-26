import React, { useRef, useState, useCallback } from "react";
import { Box } from "@mui/material";
import type { ShapeType, SvgElement } from "../hooks/useSvgStore";
import HandDrawnElement_v2 from "./HandDrawnElement_v2";

interface CanvasProps {
  elements: SvgElement[];
  selectedIds: string[];
  onSelect: (ids: string[] | null) => void;
  onAddPoint: (id: string, x: number, y: number) => void;
  onUpdateElement: (id: string, updates: Partial<SvgElement>) => void;
  onUpdateElements: (
    ids: string[],
    updates: Partial<SvgElement> | ((el: SvgElement) => Partial<SvgElement>),
  ) => void;
  onAddElement: (type: ShapeType, props: any) => string;
  onRemoveElements: (ids: string[]) => void;
  onDuplicate: (ids: string[]) => void;
  onBringToFront: (ids: string[]) => void;
  onSendToBack: (ids: string[]) => void;
  onUndo: () => void;
  onRedo: () => void;
  activeTool: string;
  onSetActiveTool: (tool: string) => void;
  zoom: number;
  onUpdateZoom: (delta: number) => void;
  theme: "light" | "dark";
  gridEnabled?: boolean;
}

type DragMode = "move" | "create" | "resize" | "select" | "pencil";

const Canvas: React.FC<CanvasProps> = ({
  elements,
  selectedIds,
  onSelect,
  onAddPoint,
  onUpdateElement,
  onUpdateElements,
  onAddElement,
  onRemoveElements,
  onDuplicate,
  onBringToFront,
  onSendToBack,
  onUndo,
  onRedo,
  activeTool,
  onSetActiveTool,
  zoom,
  onUpdateZoom,
  theme,
  gridEnabled = true,
}) => {
  const [dragInfo, setDragInfo] = useState<{
    mode: DragMode;
    id?: string;
    startX: number;
    startY: number;
    handle?: string;
    elementOffsets?: {
      id: string;
      x: number;
      y: number;
      x2?: number;
      y2?: number;
      points?: { x: number; y: number }[];
    }[];
    originalElement?: Partial<SvgElement>;
  } | null>(null);

  const [selectionBox, setSelectionBox] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);

  const drawingIdRef = useRef<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (editingTextId) return;
      const isCtrl = e.metaKey || e.ctrlKey;

      if (e.key.toLowerCase() === "a" && isCtrl) {
        e.preventDefault();
        onSelect(elements.map((el) => el.id));
        return;
      }
      if (e.key.toLowerCase() === "d" && isCtrl) {
        e.preventDefault();
        onDuplicate(selectedIds);
        return;
      }
      if (e.key.toLowerCase() === "f" && isCtrl) {
        e.preventDefault();
        onBringToFront(selectedIds);
        return;
      }
      if (e.key.toLowerCase() === "b" && isCtrl) {
        e.preventDefault();
        onSendToBack(selectedIds);
        return;
      }
      if (e.key.toLowerCase() === "z" && isCtrl) {
        e.preventDefault();
        if (e.shiftKey) onRedo();
        else onUndo();
        return;
      }
      if (e.key.toLowerCase() === "y" && isCtrl) {
        e.preventDefault();
        onRedo();
        return;
      }

      switch (e.key.toLowerCase()) {
        case "v":
          onSetActiveTool("selection");
          break;
        case "r":
          onSetActiveTool("rect");
          break;
        case "o":
          onSetActiveTool("circle");
          break;
        case "l":
          onSetActiveTool("line");
          break;
        case "a":
          onSetActiveTool("arrow");
          break;
        case "t":
          onSetActiveTool("text");
          break;
        case "p":
          onSetActiveTool("pencil");
          break;
        case "backspace":
        case "delete":
          if (selectedIds.length > 0) onRemoveElements(selectedIds);
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    editingTextId,
    selectedIds,
    elements,
    onSetActiveTool,
    onRemoveElements,
    onSelect,
    onDuplicate,
    onBringToFront,
    onSendToBack,
  ]);

  const getMousePos = useCallback(
    (e: React.MouseEvent | MouseEvent) => {
      if (!svgRef.current) return { x: 0, y: 0 };
      const rect = svgRef.current.getBoundingClientRect();

      // Position relative to SVG element
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      return {
        x: x / (zoom / 100) - offset.x,
        y: y / (zoom / 100) - offset.y,
      };
    },
    [zoom, offset],
  );

  const snapToGrid = useCallback(
    (val: number) => {
      if (!gridEnabled) return val;
      return Math.round(val / 30) * 30;
    },
    [gridEnabled],
  );

  const handleMouseDown = (e: React.MouseEvent) => {
    const pos = getMousePos(e);

    if (activeTool === "pencil") {
      const id = onAddElement("pencil", { x: pos.x, y: pos.y, points: [pos] });
      drawingIdRef.current = id;
      setDragInfo({ mode: "pencil", startX: pos.x, startY: pos.y });
      return;
    }

    if (
      activeTool === "rect" ||
      activeTool === "circle" ||
      activeTool === "line" ||
      activeTool === "arrow"
    ) {
      const snappedPos = { x: snapToGrid(pos.x), y: snapToGrid(pos.y) };
      const id = onAddElement(activeTool as ShapeType, {
        x: snappedPos.x,
        y: snappedPos.y,
        width: 0,
        height: 0,
        radius: 0,
        x2: snappedPos.x,
        y2: snappedPos.y,
      });
      setDragInfo({
        mode: "create",
        id,
        startX: snappedPos.x,
        startY: snappedPos.y,
      });
      onSelect([id]);
      return;
    }

    if (activeTool === "text") {
      const id = onAddElement("text", { x: pos.x, y: pos.y, content: "" }); // Start empty
      onSelect([id]);
      setEditingTextId(id);
      return;
    }

    if (activeTool === "selection" && (e.button === 1 || e.altKey)) {
      setIsPanning(true);
      setDragInfo({ mode: "move", startX: e.clientX, startY: e.clientY }); // Overloaded for pan
      return;
    }

    if (activeTool === "selection") {
      // Don't clear selection yet, check if we clicked a handle (handled separately)
      // or an element (handled separately). If background, start selection box.
      onSelect([]);
      setSelectionBox({ x: pos.x, y: pos.y, width: 0, height: 0 });
      setDragInfo({ mode: "select", startX: pos.x, startY: pos.y });
    }
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    const pos = getMousePos(e);
    const id = onAddElement("text", { x: pos.x, y: pos.y, content: "" });
    onSelect([id]);
    setEditingTextId(id);
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey) {
      // Zoom
      const delta = e.deltaY > 0 ? -5 : 5;
      onUpdateZoom(delta);
      return;
    }
    // Pan
    setOffset((prev) => ({
      x: prev.x - e.deltaX / (zoom / 100),
      y: prev.y - e.deltaY / (zoom / 100),
    }));
  };

  const isElementInBox = (
    el: SvgElement,
    box: { x: number; y: number; width: number; height: number },
  ) => {
    const minX = Math.min(box.x, box.x + box.width);
    const minY = Math.min(box.y, box.y + box.height);
    const maxX = Math.max(box.x, box.x + box.width);
    const maxY = Math.max(box.y, box.y + box.height);

    let elMinX = el.x;
    let elMinY = el.y;
    let elMaxX = el.x + (el.width || 0);
    let elMaxY = el.y + (el.height || 0);

    if (el.type === "circle") {
      elMaxX = el.x + (el.width || 0);
      elMaxY = el.y + (el.height || 0);
    } else if (el.type === "line" || el.type === "arrow") {
      elMinX = Math.min(el.x, el.x2 || el.x);
      elMinY = Math.min(el.y, el.y2 || el.y);
      elMaxX = Math.max(el.x, el.x2 || el.x);
      elMaxY = Math.max(el.y, el.y2 || el.y);
    } else if (el.type === "pencil" && el.points) {
      elMinX = Math.min(...el.points.map((p) => p.x));
      elMinY = Math.min(...el.points.map((p) => p.y));
      elMaxX = Math.max(...el.points.map((p) => p.x));
      elMaxY = Math.max(...el.points.map((p) => p.y));
    }

    return elMinX < maxX && elMaxX > minX && elMinY < maxY && elMaxY > minY;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const pos = getMousePos(e);
    if (isPanning && dragInfo) {
      const dx = (e.clientX - dragInfo.startX) / (zoom / 100);
      const dy = (e.clientY - dragInfo.startY) / (zoom / 100);
      setOffset((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
      setDragInfo({ ...dragInfo, startX: e.clientX, startY: e.clientY });
      return;
    }

    // For snapping, only snap if grid is enabled AND user is holding Shift
    const shouldSnap = gridEnabled && e.shiftKey;
    const maybeSnap = (val: number) => (shouldSnap ? snapToGrid(val) : val);
    const snappedPos = { x: maybeSnap(pos.x), y: maybeSnap(pos.y) };

    if (!dragInfo) return;

    if (dragInfo.mode === "pencil" && drawingIdRef.current) {
      const target = elements.find((el) => el.id === drawingIdRef.current);
      const lastPoint = target?.points?.[target.points.length - 1];
      // NO snapping for pencil points to avoid stair-step lines
      if (
        !lastPoint ||
        Math.hypot(pos.x - lastPoint.x, pos.y - lastPoint.y) > 3
      ) {
        onAddPoint(drawingIdRef.current, pos.x, pos.y);
      }
    } else if (dragInfo.mode === "create" && dragInfo.id) {
      const dx = snappedPos.x - dragInfo.startX;
      const dy = snappedPos.y - dragInfo.startY;
      const target = elements.find((el) => el.id === dragInfo.id);
      if (!target) return;

      if (target.type === "circle") {
        const width = Math.abs(dx);
        const height = Math.abs(dy);
        onUpdateElement(dragInfo.id, {
          x: Math.min(snappedPos.x, dragInfo.startX),
          y: Math.min(snappedPos.y, dragInfo.startY),
          width,
          height,
        });
      } else if (target.type === "line" || target.type === "arrow") {
        onUpdateElement(dragInfo.id, { x2: snappedPos.x, y2: snappedPos.y });
      } else {
        onUpdateElement(dragInfo.id, {
          x: Math.min(snappedPos.x, dragInfo.startX),
          y: Math.min(snappedPos.y, dragInfo.startY),
          width: Math.abs(dx),
          height: Math.abs(dy),
        });
      }
    } else if (dragInfo.mode === "move") {
      // Use floating-point, only snap if user holds Shift
      const dx = pos.x - dragInfo.startX;
      const dy = pos.y - dragInfo.startY;
      if (dx === 0 && dy === 0) return;
      onUpdateElements(selectedIds, (el) => {
        const offset = dragInfo.elementOffsets?.find((o) => o.id === el.id);
        if (!offset) return {};
        const updates: Partial<SvgElement> = {
          x: maybeSnap(offset.x + dx),
          y: maybeSnap(offset.y + dy),
        };
        if (el.type === "line" || el.type === "arrow") {
          updates.x2 = maybeSnap((offset.x2 || 0) + dx);
          updates.y2 = maybeSnap((offset.y2 || 0) + dy);
        } else if (el.type === "pencil" && offset.points) {
          updates.points = offset.points.map((p: any) => ({
            x: p.x + dx,
            y: p.y + dy,
          }));
        }
        return updates;
      });
    } else if (dragInfo.mode === "select") {
      const newBox = {
        x: dragInfo.startX,
        y: dragInfo.startY,
        width: snappedPos.x - dragInfo.startX,
        height: snappedPos.y - dragInfo.startY,
      };
      setSelectionBox(newBox);
      const idsInside = elements
        .filter((el) => isElementInBox(el, newBox))
        .map((el) => el.id);
      // Optimized state update to prevent infinite loops
      if (JSON.stringify(idsInside) !== JSON.stringify(selectedIds)) {
        onSelect(idsInside);
      }
    } else if (
      dragInfo.mode === "resize" &&
      dragInfo.id &&
      dragInfo.originalElement
    ) {
      const el = dragInfo.originalElement as SvgElement;
      const dx = snappedPos.x - dragInfo.startX;
      const dy = snappedPos.y - dragInfo.startY;
      const updates: Partial<SvgElement> = {};

      if (dragInfo.handle === "rotate") {
        const centerX = el.x + (el.width || 0) / 2;
        const centerY = el.y + (el.height || 0) / 2;
        const angle = Math.atan2(
          snappedPos.y - centerY,
          snappedPos.x - centerX,
        );
        updates.rotation = (angle * 180) / Math.PI + 90;
      } else if (el.type === "circle") {
        switch (dragInfo.handle) {
          case "br":
            updates.width = Math.max(5, (el.width || 0) + dx);
            updates.height = Math.max(5, (el.height || 0) + dy);
            break;
          case "tr":
            updates.y = el.y + dy;
            updates.width = Math.max(5, (el.width || 0) + dx);
            updates.height = Math.max(5, (el.height || 0) - dy);
            break;
          case "bl":
            updates.x = el.x + dx;
            updates.width = Math.max(5, (el.width || 0) - dx);
            updates.height = Math.max(5, (el.height || 0) + dy);
            break;
          case "tl":
            updates.x = el.x + dx;
            updates.y = el.y + dy;
            updates.width = Math.max(5, (el.width || 0) - dx);
            updates.height = Math.max(5, (el.height || 0) - dy);
            break;
        }
      } else if (el.type === "line" || el.type === "arrow") {
        if (dragInfo.handle === "p1") {
          updates.x = (el.x || 0) + dx;
          updates.y = (el.y || 0) + dy;
        } else if (dragInfo.handle === "p2") {
          updates.x2 = (el.x2 || 0) + dx;
          updates.y2 = (el.y2 || 0) + dy;
        }
      } else if (el.type === "text") {
        const baseFontSize = el.fontSize || 24;
        updates.fontSize = Math.max(
          8,
          baseFontSize + (dragInfo.handle?.includes("r") ? dx / 5 : -dx / 5),
        );
      } else {
        switch (dragInfo.handle) {
          case "br":
            updates.width = Math.max(5, (el.width || 0) + dx);
            updates.height = Math.max(5, (el.height || 0) + dy);
            break;
          case "tr":
            updates.y = el.y + dy;
            updates.width = Math.max(5, (el.width || 0) + dx);
            updates.height = Math.max(5, (el.height || 0) - dy);
            break;
          case "bl":
            updates.x = el.x + dx;
            updates.width = Math.max(5, (el.width || 0) - dx);
            updates.height = Math.max(5, (el.height || 0) + dy);
            break;
          case "tl":
            updates.x = el.x + dx;
            updates.y = el.y + dy;
            updates.width = Math.max(5, (el.width || 0) - dx);
            updates.height = Math.max(5, (el.height || 0) - dy);
            break;
        }
      }
      onUpdateElement(dragInfo.id, updates);
    }
  };

  const handleMouseUp = () => {
    if (dragInfo?.mode === "create" || dragInfo?.mode === "pencil") {
      onSetActiveTool("selection");
    }
    setIsPanning(false);
    drawingIdRef.current = null;
    setDragInfo(null);
    setSelectionBox(null);
  };

  const handleElementMouseDown = (e: React.MouseEvent, el: SvgElement) => {
    if (activeTool !== "selection") return;
    e.stopPropagation();

    let newSelection = [...selectedIds];
    if (e.shiftKey) {
      newSelection = selectedIds.includes(el.id)
        ? selectedIds.filter((id) => id !== el.id)
        : [...selectedIds, el.id];
    } else if (!selectedIds.includes(el.id)) {
      newSelection = [el.id];
    } else if (el.type === "text") {
      // Clicked an already selected text element -> edit
      setEditingTextId(el.id);
    }
    onSelect(newSelection);

    const pos = getMousePos(e);
    const snappedPos = { x: snapToGrid(pos.x), y: snapToGrid(pos.y) };
    setDragInfo({
      mode: "move",
      startX: snappedPos.x,
      startY: snappedPos.y,
      elementOffsets: elements
        .filter((item) => newSelection.includes(item.id))
        .map((item) => ({
          id: item.id,
          x: item.x,
          y: item.y,
          x2: item.x2,
          y2: item.y2,
          points: item.points ? [...item.points] : undefined,
        })),
    });
  };

  const handleHandleMouseDown = (
    e: React.MouseEvent,
    el: SvgElement,
    handle: string,
  ) => {
    e.stopPropagation();
    const pos = getMousePos(e);
    const snappedPos = { x: snapToGrid(pos.x), y: snapToGrid(pos.y) };
    setDragInfo({
      mode: "resize",
      id: el.id,
      handle,
      startX: snappedPos.x,
      startY: snappedPos.y,
      originalElement: { ...el },
    });
  };

  const renderHandles = (el: SvgElement) => {
    if (el.type === "pencil") return null;

    let minX = el.x;
    let minY = el.y;
    let maxX = el.x + (el.width || 0);
    let maxY = el.y + (el.height || 0);

    if (el.type === "circle") {
      maxX = el.x + (el.width || 0);
      maxY = el.y + (el.height || 0);
    } else if (el.type === "line" || el.type === "arrow") {
      minX = Math.min(el.x, el.x2 || el.x);
      minY = Math.min(el.y, el.y2 || el.y);
      maxX = Math.max(el.x, el.x2 || el.x);
      maxY = Math.max(el.y, el.y2 || el.y);
    } else if (el.type === "text") {
      const fontSize = el.fontSize || 24;
      const estimatedWidth = (el.content?.length || 10) * (fontSize * 0.6);
      minX = el.x - 5;
      minY = el.y - fontSize * 0.8;
      maxX = el.x + estimatedWidth;
      maxY = el.y + fontSize * 0.6;
    }

    if (el.type === "line" || el.type === "arrow") {
      const handles = [
        { id: "p1", x: el.x, y: el.y },
        { id: "p2", x: el.x2 || el.x, y: el.y2 || el.y },
      ];
      return handles.map((hnd) => (
        <circle
          key={hnd.id}
          cx={hnd.x}
          cy={hnd.y}
          r={6}
          fill="white"
          stroke="#4f8bff"
          strokeWidth="1.5"
          style={{ cursor: "crosshair", pointerEvents: "all" }}
          onMouseDown={(e) => handleHandleMouseDown(e, el, hnd.id)}
        />
      ));
    }

    const handleSize = 10;
    const handles = [
      { id: "tl", x: minX, y: minY },
      { id: "tr", x: maxX, y: minY },
      { id: "bl", x: minX, y: maxY },
      { id: "br", x: maxX, y: maxY },
    ];

    const baseHandles = handles.map((hnd) => (
      <rect
        key={hnd.id}
        x={hnd.x - handleSize / 2}
        y={hnd.y - handleSize / 2}
        width={handleSize}
        height={handleSize}
        fill="white"
        stroke="#4f8bff"
        strokeWidth="1.5"
        style={{
          cursor: `${hnd.id === "tl" || hnd.id === "br" ? "nwse" : "nesw"}-resize`,
          pointerEvents: "all",
        }}
        onMouseDown={(e) => handleHandleMouseDown(e, el, hnd.id)}
      />
    ));

    const centerX = minX + (maxX - minX) / 2;
    const rotationHandle = (
      <g key="rotate-group">
        <line
          x1={centerX}
          y1={minY}
          x2={centerX}
          y2={minY - 30}
          stroke="#4f8bff"
          strokeWidth="1"
          strokeDasharray="2 2"
        />
        <circle
          cx={centerX}
          cy={minY - 30}
          r={6}
          fill="white"
          stroke="#4f8bff"
          strokeWidth="1.5"
          style={{ cursor: "grab", pointerEvents: "all" }}
          onMouseDown={(e) => handleHandleMouseDown(e, el, "rotate")}
        />
      </g>
    );

    return [...baseHandles, rotationHandle];
  };

  const singleSelectedElement = elements.find(
    (el) =>
      el.id === editingTextId ||
      (el.id === selectedIds[0] && selectedIds.length === 1),
  );

  React.useEffect(() => {
    if (editingTextId && textareaRef.current) {
      textareaRef.current.focus();
      // Trigger height adjustment
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [editingTextId, singleSelectedElement]);

  return (
    <Box
      sx={{
        width: "100%",
        height: "100%",
        bgcolor: theme === "dark" ? "#0b0e14" : "#ffffff",
        position: "relative",
        overflow: "hidden",
        backgroundImage: gridEnabled
          ? `radial-gradient(circle, ${theme === "dark" ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.08)"} 1px, transparent 1px)`
          : "none",
        backgroundSize: `${30 * (zoom / 100)}px ${30 * (zoom / 100)}px`,
        backgroundPosition: `${offset.x * (zoom / 100)}px ${offset.y * (zoom / 100)}px`,
        transition: "background-color 0.3s ease",
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onDoubleClick={handleDoubleClick}
      onWheel={handleWheel}
    >
      <svg
        ref={svgRef}
        width="100%"
        height="100%"
        xmlns="http://www.w3.org/2000/svg"
        style={{ pointerEvents: "all", display: "block" }}
      >
        <g
          transform={`translate(${offset.x * (zoom / 100)}, ${offset.y * (zoom / 100)}) scale(${zoom / 100})`}
        >
          {elements.map((el) => (
            <g
              key={el.id}
              onMouseDown={(e) => handleElementMouseDown(e, el)}
              onDoubleClick={() =>
                el.type === "text" && setEditingTextId(el.id)
              }
            >
              <HandDrawnElement_v2
                element={el}
                isSelected={selectedIds.includes(el.id)}
                onSelect={(id) => onSelect(id ? [id] : [])}
              />
              {selectedIds.includes(el.id) && selectedIds.length === 1 && (
                <g
                  transform={`rotate(${el.rotation || 0}, ${el.x + (el.width || 0) / 2}, ${el.y + (el.height || 0) / 2})`}
                >
                  {renderHandles(el)}
                </g>
              )}
            </g>
          ))}
          {selectionBox && (
            <rect
              x={Math.min(selectionBox.x, selectionBox.x + selectionBox.width)}
              y={Math.min(selectionBox.y, selectionBox.y + selectionBox.height)}
              width={Math.abs(selectionBox.width)}
              height={Math.abs(selectionBox.height)}
              fill="rgba(79, 139, 255, 0.1)"
              stroke="#4f8bff"
              strokeWidth="1"
              strokeDasharray="4 4"
              style={{ pointerEvents: "none" }}
            />
          )}
        </g>
      </svg>
      {editingTextId && singleSelectedElement && (
        <Box
          sx={{
            position: "absolute",
            left: `${(singleSelectedElement.x + offset.x) * (zoom / 100)}px`,
            top: `${(singleSelectedElement.y + offset.y - (singleSelectedElement.fontSize || 24) * 0.8) * (zoom / 100)}px`,
            zIndex: 2000,
            pointerEvents: "all",
            transform: `rotate(${singleSelectedElement.rotation || 0}deg)`,
            transformOrigin: "0% 80%", // Roughly matching the text baseline
          }}
        >
          <textarea
            ref={textareaRef}
            autoFocus
            defaultValue={singleSelectedElement.content || ""}
            placeholder="Type something..."
            onBlur={(e) => {
              const value = e.target.value.trim();
              if (!value) {
                onRemoveElements([editingTextId!]);
              } else {
                onUpdateElement(editingTextId, { content: value });
              }
              setEditingTextId(null);
              onSetActiveTool("selection");
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                const target = e.target as HTMLTextAreaElement;
                const value = target.value.trim();
                if (!value) {
                  onRemoveElements([editingTextId!]);
                } else {
                  onUpdateElement(editingTextId, { content: value });
                }
                setEditingTextId(null);
                onSetActiveTool("selection");
              }
            }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = "auto";
              target.style.height = `${target.scrollHeight}px`;
            }}
            style={{
              background: "transparent",
              color: theme === "dark" ? "white" : "#1f2328",
              border: "1px solid #4f8bff",
              borderRadius: "4px",
              padding: "4px",
              fontFamily:
                singleSelectedElement.fontFamily || "Inter, sans-serif",
              fontSize: `${(singleSelectedElement.fontSize || 24) * (zoom / 100)}px`,
              lineHeight: 1.2,
              fontWeight: 700,
              outline: "none",
              resize: "both",
              minWidth: `${120 * (zoom / 100)}px`,
              minHeight: "24px",
              overflow: "hidden",
              caretColor: "#4f8bff",
            }}
          />
        </Box>
      )}
    </Box>
  );
};

export default Canvas;
