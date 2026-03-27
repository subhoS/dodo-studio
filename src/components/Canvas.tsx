import React, { useRef, useState, useCallback, useEffect } from "react";
import { Box } from "@mui/material";
import type { ShapeType, SvgElement } from "../types/svg";
import { HandDrawnElement_v2 } from "./HandDrawnElement_v2";
import { isElementInBox, getElementBounds } from "../utils/geometry";

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
  boardMode?: "moodboard" | "designer";
  artboardSize?: { width: number; height: number };
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
  boardMode = "moodboard",
  artboardSize = { width: 1080, height: 1080 },
}) => {
  const [dragInfo, setDragInfo] = useState<{
    mode: DragMode; id?: string; startX: number; startY: number; handle?: string;
    elementOffsets?: { id: string; x: number; y: number; x2?: number; y2?: number; points?: { x: number; y: number }[]; }[];
    originalElement?: Partial<SvgElement>;
  } | null>(null);

  const [selectionBox, setSelectionBox] = useState<{ x: number; y: number; width: number; height: number; } | null>(null);
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [editingTextPos, setEditingTextPos] = useState<{ x: number; y: number } | null>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);

  const drawingIdRef = useRef<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (editingTextId) return;
      const isCtrl = (e.metaKey || e.ctrlKey) && !e.altKey;
      if (e.key.toLowerCase() === "a" && isCtrl) { e.preventDefault(); onSelect(elements.map(el => el.id)); return; }
      if (e.key.toLowerCase() === "d" && isCtrl) { e.preventDefault(); onDuplicate(selectedIds); return; }
      if (e.key.toLowerCase() === "f" && isCtrl) { e.preventDefault(); onBringToFront(selectedIds); return; }
      if (e.key.toLowerCase() === "b" && isCtrl) { e.preventDefault(); onSendToBack(selectedIds); return; }
      if (e.key.toLowerCase() === "z" && isCtrl) { e.preventDefault(); if (e.shiftKey) onRedo(); else onUndo(); return; }
      if (e.key.toLowerCase() === "y" && isCtrl) { e.preventDefault(); onRedo(); return; }
      
      if (!isCtrl) {
        switch (e.key.toLowerCase()) {
          case "v": onSetActiveTool("selection"); break;
          case "r": onSetActiveTool("rect"); break;
          case "o": onSetActiveTool("circle"); break;
          case "l": onSetActiveTool("line"); break;
          case "a": onSetActiveTool("arrow"); break;
          case "t": onSetActiveTool("text"); break;
          case "p": onSetActiveTool("pencil"); break;
          case "backspace":
          case "delete": if (selectedIds.length > 0) onRemoveElements(selectedIds); break;
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [editingTextId, selectedIds, elements, onSetActiveTool, onRemoveElements, onSelect, onDuplicate, onBringToFront, onSendToBack, onUndo, onRedo]);

  useEffect(() => {
    if (editingTextId && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [editingTextId]);

  const getMousePos = useCallback((e: React.MouseEvent | MouseEvent) => {
    if (!svgRef.current) return { x: 0, y: 0 };
    const rect = svgRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left, y = e.clientY - rect.top;
    return { x: x / (zoom / 100) - offset.x, y: y / (zoom / 100) - offset.y };
  }, [zoom, offset]);

  const snapToGrid = useCallback((val: number) => gridEnabled ? Math.round(val / 30) * 30 : val, [gridEnabled]);

  const handleMouseDown = (e: React.MouseEvent) => {
    const pos = getMousePos(e);
    if (activeTool === "pencil") {
      const id = onAddElement("pencil", { x: pos.x, y: pos.y, points: [pos] });
      drawingIdRef.current = id; setDragInfo({ mode: "pencil", startX: pos.x, startY: pos.y });
      return;
    }
    if (["rect", "circle", "line", "arrow"].includes(activeTool)) {
      const snPos = { x: snapToGrid(pos.x), y: snapToGrid(pos.y) };
      const id = onAddElement(activeTool as ShapeType, { x: snPos.x, y: snPos.y, width: 0, height: 0, x2: snPos.x, y2: snPos.y });
      setDragInfo({ mode: "create", id, startX: snPos.x, startY: snPos.y }); onSelect([id]);
      return;
    }
    if (activeTool === "text") {
      // Check if clicked on an existing text element
      const clickedText = [...elements].reverse().find(el => {
        if (el.type !== "text") return false;
        const b = getElementBounds(el);
        return pos.x >= b.x && pos.x <= b.x + b.width && pos.y >= b.y && pos.y <= b.y + b.height;
      });

      if (clickedText) {
        onSelect([clickedText.id]);
        setEditingTextId(clickedText.id);
        setEditingTextPos({ x: clickedText.x, y: clickedText.y });
        setTimeout(() => textareaRef.current?.focus(), 50);
      } else {
        const id = onAddElement("text", { x: pos.x, y: pos.y, content: "" });
        onSelect([id]); 
        setEditingTextId(id); 
        setEditingTextPos({ x: pos.x, y: pos.y });
      }
      return;
    }
    if (activeTool === "selection" && (e.button === 1 || e.altKey)) {
      setIsPanning(true); setDragInfo({ mode: "move", startX: e.clientX, startY: e.clientY });
      return;
    }
    if (activeTool === "selection" && e.target === svgRef.current) {
      onSelect([]); setSelectionBox({ x: pos.x, y: pos.y, width: 0, height: 0 });
      setDragInfo({ mode: "select", startX: pos.x, startY: pos.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const pos = getMousePos(e);
    if (isPanning && dragInfo) {
      const dx = (e.clientX - dragInfo.startX) / (zoom / 100), dy = (e.clientY - dragInfo.startY) / (zoom / 100);
      setOffset(prev => ({ x: prev.x + dx, y: prev.y + dy })); setDragInfo({ ...dragInfo, startX: e.clientX, startY: e.clientY });
      return;
    }
    if (!dragInfo) return;
    const maybeSnap = (v: number) => (gridEnabled && e.shiftKey) ? snapToGrid(v) : v;
    const snPos = { x: maybeSnap(pos.x), y: maybeSnap(pos.y) };

    if (dragInfo.mode === "pencil" && drawingIdRef.current) {
      onAddPoint(drawingIdRef.current, pos.x, pos.y);
    } else if (dragInfo.mode === "create" && dragInfo.id) {
      const target = elements.find(el => el.id === dragInfo.id); if (!target) return;
      if (target.type === "line" || target.type === "arrow") onUpdateElement(dragInfo.id, { x2: snPos.x, y2: snPos.y });
      else onUpdateElement(dragInfo.id, { x: Math.min(snPos.x, dragInfo.startX), y: Math.min(snPos.y, dragInfo.startY), width: Math.abs(snPos.x - dragInfo.startX), height: Math.abs(snPos.y - dragInfo.startY) });
    } else if (dragInfo.mode === "move") {
      const dx = pos.x - dragInfo.startX, dy = pos.y - dragInfo.startY;
      onUpdateElements(selectedIds, el => {
        const off = dragInfo.elementOffsets?.find(o => o.id === el.id); if (!off) return {};
        const updates: Partial<SvgElement> = { x: maybeSnap(off.x + dx), y: maybeSnap(off.y + dy) };
        if (el.type === "line" || el.type === "arrow") { updates.x2 = maybeSnap((off.x2 || 0) + dx); updates.y2 = maybeSnap((off.y2 || 0) + dy); }
        else if (el.type === "pencil" && off.points) updates.points = off.points.map(p => ({ x: p.x + dx, y: p.y + dy }));
        return updates;
      });
    } else if (dragInfo.mode === "select") {
      const box = { x: dragInfo.startX, y: dragInfo.startY, width: snPos.x - dragInfo.startX, height: snPos.y - dragInfo.startY };
      setSelectionBox(box);
      const ids = elements.filter(el => isElementInBox(el, box)).map(el => el.id);
      if (JSON.stringify(ids) !== JSON.stringify(selectedIds)) onSelect(ids);
    } else if (dragInfo.mode === "resize" && dragInfo.id && dragInfo.originalElement) {
      const el = dragInfo.originalElement as SvgElement, dx = snPos.x - dragInfo.startX, dy = snPos.y - dragInfo.startY;
      const updates: Partial<SvgElement> = {};
      if (dragInfo.handle === "rotate") {
        let cX = el.x + (el.width||0)/2, cY = el.y + (el.height||0)/2;
        updates.rotation = (Math.atan2(snPos.y - cY, snPos.x - cX) * 180 / Math.PI) + 90;
      } else {
        const h = dragInfo.handle;
        if (h === "br") { updates.width = Math.max(5, (el.width || 0) + dx); updates.height = Math.max(5, (el.height || 0) + dy); }
        else if (h === "tr") { updates.y = el.y + dy; updates.width = Math.max(5, (el.width || 0) + dx); updates.height = Math.max(5, (el.height || 0) - dy); }
        else if (h === "bl") { updates.x = el.x + dx; updates.width = Math.max(5, (el.width || 0) - dx); updates.height = Math.max(5, (el.height || 0) + dy); }
        else if (h === "tl") { updates.x = el.x + dx; updates.y = el.y + dy; updates.width = Math.max(5, (el.width || 0) - dx); updates.height = Math.max(5, (el.height || 0) - dy); }
        else if (h === "p1") { updates.x = (el.x || 0) + dx; updates.y = (el.y || 0) + dy; }
        else if (h === "p2") { updates.x2 = (el.x2 || 0) + dx; updates.y2 = (el.y2 || 0) + dy; }
      }
      onUpdateElement(dragInfo.id, updates);
    }
  };

  const handleMouseUp = () => {
    if (dragInfo && (dragInfo.mode === "create" || dragInfo.mode === "pencil")) {
      onSetActiveTool("selection");
    }
    setIsPanning(false); drawingIdRef.current = null; setDragInfo(null); setSelectionBox(null);
  }

  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey) { onUpdateZoom(e.deltaY > 0 ? -5 : 5); return; }
    setOffset(prev => ({ x: prev.x - e.deltaX / (zoom / 100), y: prev.y - e.deltaY / (zoom / 100) }));
  };

  const renderHandles = (el: SvgElement) => {
    if (el.type === "pencil") return null;
    const b = getElementBounds(el);
    let minX = b.x, minY = b.y, maxX = b.x + b.width, maxY = b.y + b.height;
    const handles = (el.type === "line" || el.type === "arrow") ? [{id:"p1", x:el.x, y:el.y}, {id:"p2", x:el.x2||el.x, y:el.y2||el.y}]
      : [
          {id:"tl", x:minX, y:minY}, {id:"tr", x:maxX, y:minY}, 
          {id:"bl", x:minX, y:maxY}, {id:"br", x:maxX, y:maxY},
          {id:"rotate", x:(minX+maxX)/2, y:minY - 30}
        ];
    
    const centerX = minX + (maxX - minX) / 2;
    const centerY = minY + (maxY - minY) / 2;

    return (
      <g transform={`rotate(${el.rotation || 0}, ${centerX}, ${centerY})`}>
        <rect x={minX} y={minY} width={maxX - minX} height={maxY - minY} fill="none" stroke="#4f8bff" strokeWidth="1.5" />
        {handles.map(h => {
          if (h.id === "rotate") {
            return (
              <g key={h.id}>
                <line x1={h.x} y1={h.y + 6} x2={h.x} y2={minY} stroke="#4f8bff" strokeWidth="1" strokeDasharray="2 2" />
                <circle cx={h.x} cy={h.y} r={6} fill="white" stroke="#4f8bff" strokeWidth="1.5" style={{ cursor: "grab", pointerEvents: "all" }} onMouseDown={(e) => { e.stopPropagation(); setDragInfo({ mode:"resize", id:el.id, handle:h.id, startX:getMousePos(e).x, startY:getMousePos(e).y, originalElement:{...el} }); }} />
              </g>
            );
          }
          return el.type === "line" || el.type === "arrow" 
            ? <circle key={h.id} cx={h.x} cy={h.y} r={6} fill="white" stroke="#4f8bff" strokeWidth="1.5" style={{ cursor: "crosshair", pointerEvents: "all" }} onMouseDown={(e) => { e.stopPropagation(); setDragInfo({ mode:"resize", id:el.id, handle:h.id, startX:getMousePos(e).x, startY:getMousePos(e).y, originalElement:{...el} }); }} />
            : <rect key={h.id} x={h.x - 6} y={h.y - 6} width={12} height={12} rx={2} fill="white" stroke="#4f8bff" strokeWidth="2" style={{ cursor: `${h.id==="tl"||h.id==="br"?"nwse":"nesw"}-resize`, pointerEvents: "all" }} onMouseDown={(e) => { e.stopPropagation(); setDragInfo({ mode:"resize", id:el.id, handle:h.id, startX:getMousePos(e).x, startY:getMousePos(e).y, originalElement:{...el} }); }} />;
        })}
      </g>
    );
  };

  const editingEl = elements.find(el => el.id === editingTextId);

  return (
    <Box sx={{ width:"100%", height:"100%", bgcolor: theme==="dark"?"#0b0e14":"#ffffff", position:"relative", overflow:"hidden", backgroundImage: gridEnabled?`radial-gradient(circle, ${theme==="dark"?"rgba(255,255,255,0.08)":"rgba(0,0,0,0.1)"} 1px, transparent 1px)`:"none", backgroundSize: `${30*(zoom/100)}px ${30*(zoom/100)}px`, backgroundPosition: `${(offset.x*(zoom/100))%(30*(zoom/100))}px ${(offset.y*(zoom/100))%(30*(zoom/100))}px` }} onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onWheel={handleWheel}>
      <svg ref={svgRef} width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" style={{ display: "block" }}>
        <g transform={`translate(${offset.x*(zoom/100)}, ${offset.y*(zoom / 100)}) scale(${zoom / 100})`}>
          {boardMode === "designer" && (
             <g><rect x={-artboardSize.width / 2} y={-artboardSize.height / 2} width={artboardSize.width} height={artboardSize.height} fill={theme === "dark" ? "#161b22" : "#ffffff"} style={{ filter: "drop-shadow(0 10px 30px rgba(0,0,0,0.25))" }} />
             <path d={`M -10000,-10000 H 10000 V 10000 H -10000 Z M ${-artboardSize.width/2},${-artboardSize.height/2} V ${artboardSize.height/2} H ${artboardSize.width/2} V ${-artboardSize.height/2} Z`} fill={theme==="dark"?"rgba(0,0,0,0.5)":"rgba(0,0,0,0.08)"} fillRule="evenodd" /></g>
          )}
          {elements.map(el => {
            const isSelected = selectedIds.includes(el.id);
            const isEditing = el.id === editingTextId;
            return (
              <g key={el.id} onMouseDown={e => { if(activeTool==="selection") { e.stopPropagation(); let nS = e.shiftKey ? (selectedIds.includes(el.id)?selectedIds.filter(id=>id!==el.id):[...selectedIds, el.id]):[el.id]; onSelect(nS); setDragInfo({ mode:"move", startX:getMousePos(e).x, startY:getMousePos(e).y, elementOffsets:elements.filter(i=>nS.includes(i.id)).map(i=>({ id:i.id, x:i.x, y:i.y, x2:i.x2, y2:i.y2, points:i.points?[...i.points]:undefined })) }); } }} onDoubleClick={()=>{if(el.type==="text"){setEditingTextId(el.id); setEditingTextPos({x:el.x, y:el.y}); setTimeout(()=>textareaRef.current?.focus(), 50);}}} style={{ cursor: activeTool==="selection"?"pointer":"default" }}>
                <HandDrawnElement_v2 element={el} isSelected={isSelected} isEditing={isEditing} />
                {isSelected && selectedIds.length === 1 && renderHandles(el)}
              </g>
            );
          })}
          {selectionBox && <rect x={Math.min(selectionBox.x, selectionBox.x+selectionBox.width)} y={Math.min(selectionBox.y, selectionBox.y+selectionBox.height)} width={Math.abs(selectionBox.width)} height={Math.abs(selectionBox.height)} fill="rgba(79, 139, 255, 0.05)" stroke="#4f8bff" strokeWidth="1" />}
        </g>
      </svg>
      {editingTextId && editingTextPos && (
        <Box sx={{ 
          position: "absolute", 
          left: `${(editingTextPos.x + offset.x) * (zoom / 100)}px`, 
          top: `${(editingTextPos.y + offset.y) * (zoom / 100)}px`, 
          zIndex: 2000,
          transformOrigin: "top left"
        }}>
          <textarea
            ref={textareaRef}
            autoFocus
            value={editingEl?.content || ""}
            onBlur={() => {
              if (editingEl && !editingEl.content?.trim()) {
                onRemoveElements([editingTextId]);
              }
              setEditingTextId(null);
              setEditingTextPos(null);
              onSetActiveTool("selection");
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                textareaRef.current?.blur();
              }
              if (e.key === "Escape") {
                setEditingTextId(null);
                setEditingTextPos(null);
              }
            }}
            onChange={(e) => {
              onUpdateElement(editingTextId, { content: e.target.value });
              if (textareaRef.current) {
                textareaRef.current.style.height = "auto";
                textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
                textareaRef.current.style.width = "auto";
                textareaRef.current.style.width = `${Math.max(150, textareaRef.current.scrollWidth)}px`;
              }
            }}
            style={{
              minWidth: "150px",
              background: "transparent",
              color: editingEl?.stroke || (theme === "dark" ? "#ffffff" : "#000000"),
              border: "none",
              padding: 0,
              margin: 0,
              fontFamily: editingEl?.fontFamily || "Inter, sans-serif",
              fontSize: `${(editingEl?.fontSize || 24) * (zoom / 100)}px`,
              lineHeight: 1.2,
              fontWeight: 800,
              outline: "none",
              resize: "none",
              whiteSpace: "pre-wrap",
              display: "block",
              overflow: "hidden",
            }}
          />
        </Box>
      )}
    </Box>
  );
};
export default Canvas;
