import React, { useRef, useState, useCallback, useEffect } from "react";
import { Box } from "@mui/material";
import type { ShapeType, SvgElement } from "../types/svg";
import { HandDrawnElement_v2 } from "./HandDrawnElement_v2";
import { getElementBounds } from "../utils/geometry";
import { useCanvasKeyboard } from "../hooks/canvas/useCanvasKeyboard";
import { useCanvasEraser } from "../hooks/canvas/useCanvasEraser";
import { useCanvasDrag } from "../hooks/canvas/useCanvasDrag";

interface CanvasProps {
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
  onRemoveElements: (ids: string[]) => void;
  onDuplicate: (ids: string[]) => void;
  onBringToFront: (ids: string[]) => void;
  onSendToBack: (ids: string[]) => void;
  onGroup: (ids: string[]) => void;
  onUngroup: (ids: string[]) => void;
  onImportFile: (file: File, x?: number, y?: number) => void;
  onUndo: () => void;
  onRedo: () => void;
  activeTool: string;
  onSetActiveTool: (tool: string) => void;
  zoom: number;
  theme: "light" | "dark";
  gridEnabled?: boolean;
  activeMode?: "moodboard" | "designer";
  artboardSize?: { width: number; height: number };
  onUpdateZoom: (val: number, isAbsolute?: boolean) => void;
  eraserSize: number;
  eraserMode: "object" | "freeform";
  eraseFromPencil: (id: string, centers: { x: number; y: number }[], radius: number) => void;
}


const Canvas: React.FC<CanvasProps> = ({
  elements,
  selectedIds,
  onSelect,
  onAddPoint,
  onFinalizeDrawing,
  onUpdateElement,
  onUpdateElements,
  onAddElement,
  onRemoveElements,
  onDuplicate,
  onBringToFront,
  onSendToBack,
  onGroup,
  onUngroup,
  onImportFile,
  onUndo,
  onRedo,
  activeTool,
  onSetActiveTool,
  zoom,
  onUpdateZoom,
  theme,
  gridEnabled = true,
  activeMode = "moodboard",
  artboardSize = { width: 1080, height: 1080 },
  eraserSize,
  eraserMode,
  eraseFromPencil,
}) => {
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [editingTextPos, setEditingTextPos] = useState<{ x: number; y: number } | null>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [eraserPos, setEraserPos] = useState<{ x: number; y: number } | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  // Fix #1: track whether the text element being edited was just created (vs double-clicked existing)
  const isNewTextRef = useRef(false);

  const { handleEraserDrag, resetEraser } = useCanvasEraser({
    elements,
    eraserSize,
    eraserMode,
    eraseFromPencil,
    onRemoveElements,
  });

  const {
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
  } = useCanvasDrag({
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
    gridEnabled,
    svgRef,
    setEditingTextId,
    setEditingTextPos,
    isNewTextRef,
    handleEraserDrag,
    resetEraser,
    setEraserPos,
  });

  const fitToScreen = useCallback(() => {
    if (!svgRef.current?.parentElement) return;
    const padding = 60;
    const container = svgRef.current.parentElement.getBoundingClientRect();
    const availableW = container.width - padding * 2;
    const availableH = container.height - padding * 2;
    
    const scaleW = availableW / artboardSize.width;
    const scaleH = availableH / artboardSize.height;
    const idealZoom = Math.floor(Math.min(scaleW, scaleH) * 100);
    
    // Center the (0,0) point (which is artboard center) in the center of container
    const centerX = container.width / 2;
    const centerY = container.height / 2;
    
    // In our coordinate system: ScreenX = (SVG_X + offset.x) * (zoom/100)
    // We want SVG_0 to map to centerX: centerX = (0 + offset.x) * (idealZoom/100)
    const newOffsetX = centerX / (idealZoom / 100);
    const newOffsetY = centerY / (idealZoom / 100);
    
    setOffset({ x: newOffsetX, y: newOffsetY });
    onUpdateZoom(idealZoom, true);
  }, [artboardSize.width, artboardSize.height, onUpdateZoom]);

  useEffect(() => {
    const handleFit = () => fitToScreen();
    window.addEventListener("fit-to-screen", handleFit);
    window.addEventListener("resize", handleFit);
    return () => {
      window.removeEventListener("fit-to-screen", handleFit);
      window.removeEventListener("resize", handleFit);
    };
  }, [fitToScreen]);

  useEffect(() => {
    if (activeMode === "designer") {
      fitToScreen();
    } else {
      setOffset({ x: 0, y: 0 });
    }
  }, [activeMode]);



  useCanvasKeyboard({
    editingTextId,
    selectedIds,
    elements,
    onSelect,
    onRemoveElements,
    onDuplicate,
    onBringToFront,
    onSendToBack,
    onUndo,
    onRedo,
    onGroup,
    onUngroup,
    onSetActiveTool,
  });

  useEffect(() => {
    // Use requestAnimationFrame so focus happens AFTER all pending browser events
    // (mouseup, click) from the canvas click are processed. This prevents the canvas
    // from stealing focus back from the textarea.
    if (editingTextId && textareaRef.current) {
      const raf = requestAnimationFrame(() => {
        textareaRef.current?.focus();
      });
      return () => cancelAnimationFrame(raf);
    }
  }, [editingTextId]);



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
    const isRotating = dragInfo?.mode === "resize" && dragInfo?.handle === "rotate";

    return (
      <g transform={`rotate(${el.rotation || 0}, ${centerX}, ${centerY})`}>
        <rect x={minX} y={minY} width={maxX - minX} height={maxY - minY} fill="none" stroke="#4f8bff" strokeWidth="1.5" />
        {handles.map(h => {
          if (h.id === "rotate") {
            return (
              <g key={h.id}>
                <line x1={h.x} y1={h.y + 6} x2={h.x} y2={minY} stroke="#4f8bff" strokeWidth="1" strokeDasharray="2 2" />
                <circle 
                  cx={h.x} cy={h.y} r={8} 
                  fill="white" stroke="#4f8bff" strokeWidth={1.5} 
                  style={{ cursor: "grab", pointerEvents: "all", filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.15))" }} 
                  onMouseDown={(e) => { e.stopPropagation(); setDragInfo({ mode:"resize", id:el.id, handle:h.id, startX:getMousePos(e).x, startY:getMousePos(e).y, originalElement:{...el} }); }} 
                />
                <path d={`M ${h.x-3} ${h.y-3} A 4 4 0 1 1 ${h.x+3} ${h.y-3}`} fill="none" stroke="#4f8bff" strokeWidth="1.2" strokeLinecap="round" style={{ pointerEvents: "none" }} />
                
                {/* ROTATION TOOLTIP */}
                {isRotating && (
                  <g transform={`translate(${h.x + 20}, ${h.y - 10}) rotate(${-(el.rotation || 0)})`}>
                    <rect x={0} y={0} width={40} height={20} rx={4} fill="#4f8bff" />
                    <text x={20} y={11} textAnchor="middle" dominantBaseline="middle" fill="white" style={{ fontSize: "10px", fontWeight: 900 }}>
                      {Math.round(el.rotation || 0)}°
                    </text>
                  </g>
                )}
              </g>
            );
          }
          return el.type === "line" || el.type === "arrow"
            ? <circle key={h.id} cx={h.x} cy={h.y} r={7} fill="white" stroke="#4f8bff" strokeWidth={1.5} style={{ cursor: "crosshair", pointerEvents: "all", filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.15))" }} onMouseDown={(e) => { e.stopPropagation(); setDragInfo({ mode:"resize", id:el.id, handle:h.id, startX:getMousePos(e).x, startY:getMousePos(e).y, originalElement:{...el} }); }} />
            : <rect key={h.id} x={h.x - 6} y={h.y - 6} width={12} height={12} rx={3} fill="white" stroke="#4f8bff" strokeWidth={2} style={{ cursor: `${h.id==="tl"||h.id==="br"?"nwse":"nesw"}-resize`, pointerEvents: "all", filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.15))" }} onMouseDown={(e) => { e.stopPropagation(); setDragInfo({ mode:"resize", id:el.id, handle:h.id, startX:getMousePos(e).x, startY:getMousePos(e).y, originalElement:{...el} }); }} />;
        })}
      </g>
    );
  };
  const editingEl = elements.find(el => el.id === editingTextId);

  return (
    <Box 
      onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "copy"; }}
      onDrop={(e) => {
        e.preventDefault();
        const file = e.dataTransfer.files?.[0];
        if (file && onImportFile) {
          const rect = svgRef.current?.getBoundingClientRect();
          if (rect) {
             const x = (e.clientX - rect.left) / (zoom / 100) - offset.x;
             const y = (e.clientY - rect.top) / (zoom / 100) - offset.y;
             onImportFile(file, x, y);
          }
        }
      }}
      sx={{ 
        width:"100%", height:"100%", 
        bgcolor: theme === "dark" ? "#121417" : "#edeff2", 
        position:"relative", overflow:"hidden", 
        backgroundImage: gridEnabled?`radial-gradient(circle, ${theme==="dark"?"rgba(255,255,255,0.06)":"rgba(0,0,0,0.08)"} 1px, transparent 1px)`:"none", 
        backgroundSize: `${30*(zoom/100)}px ${30*(zoom/100)}px`, 
        backgroundPosition: `${(offset.x*(zoom/100))%(30*(zoom/100))}px ${(offset.y*(zoom/100))%(30*(zoom/100))}px`,
        transition: "background-color 0.3s ease",
        cursor: isPanning ? "grabbing" : activeTool === "eraser" ? "none" : ["rect", "circle", "line", "arrow", "section"].includes(activeTool) ? "crosshair" : activeTool === "text" ? "text" : activeTool === "pencil" ? "crosshair" : hoveredId ? "pointer" : "default"
      }} 
      onMouseDown={handleMouseDown} 
      onMouseMove={handleMouseMove} 
      onMouseUp={handleMouseUp} 
      onWheel={handleWheel}
    >
      <svg ref={svgRef} width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" style={{ display: "block" }}>
        <defs>
          <clipPath id="artboard-clip">
            <rect 
              x={-artboardSize.width / 2} y={-artboardSize.height / 2} 
              width={artboardSize.width} height={artboardSize.height} 
            />
          </clipPath>
        </defs>

        <g transform={`translate(${offset.x*(zoom/100)}, ${offset.y*(zoom / 100)}) scale(${zoom / 100})`}>
          {activeMode === "designer" && (
             <g>
               {/* Background masking (Gray out area outside artboard) */}
               <path 
                 d={`M -10000,-10000 H 10000 V 10000 H -10000 Z M ${-artboardSize.width/2},${-artboardSize.height/2} V ${artboardSize.height/2} H ${artboardSize.width/2} V ${-artboardSize.height/2} Z`} 
                 fill={theme==="dark"?"rgba(0,0,0,0.3)":"rgba(0,0,0,0.04)"} 
                 fillRule="evenodd" 
                 style={{ pointerEvents: "none" }}
               />
               <rect 
                 x={-artboardSize.width / 2} y={-artboardSize.height / 2} 
                 width={artboardSize.width} height={artboardSize.height} 
                 fill={theme === "dark" ? "#1a1d21" : "#ffffff"} 
                 style={{ filter: "drop-shadow(0 10px 40px rgba(0,0,0,0.2))" }} 
               />
             </g>
          )}

          <g clipPath={activeMode === "designer" ? "url(#artboard-clip)" : undefined}>
            {[...elements].sort((a, b) => { if (a.type === "section" && b.type !== "section") return -1; if (b.type === "section" && a.type !== "section") return 1; return 0; }).map(el => {
              const isSelected = selectedIds.includes(el.id);
              const isEditing = el.id === editingTextId;
              const isHovered = hoveredId === el.id;

              const findRootGroup = (eid: string): string => {
                let current = elements.find(e => e.id === eid);
                if (!current) return eid;
                while (current && current.parentId) {
                  const parent = elements.find(e => e.id === current?.parentId);
                  if (!parent) break;
                  current = parent;
                }
                return current ? current.id : eid;
              };

              const handleItemClick = (e: React.MouseEvent) => {
                if (activeTool !== "selection" || el.locked) return;
                e.stopPropagation();

                const rootId = findRootGroup(el.id);
                const isRootSelected = selectedIds.includes(rootId);
                
                // If root is NOT selected, select root. 
                // If root IS selected, select the item itself (drill-down).
                let targetId = isRootSelected ? el.id : rootId;
                
                // If it's a double-click on text, let doubleClick handle it.
                // Shift key logic:
                let nextSelection: string[];
                if (e.shiftKey) {
                  nextSelection = selectedIds.includes(targetId)
                    ? selectedIds.filter(id => id !== targetId)
                    : [...selectedIds, targetId];
                } else {
                  nextSelection = [targetId];
                }

                onSelect(nextSelection);
                
                setDragInfo({ 
                  mode: "move", 
                  startX: getMousePos(e).x, 
                  startY: getMousePos(e).y, 
                  elementOffsets: elements
                    .filter(i => nextSelection.includes(i.id))
                    .map(i => ({ 
                      id: i.id, x: i.x, y: i.y, x2: i.x2, y2: i.y2, 
                      points: i.points ? [...i.points] : undefined 
                    })) 
                });
              };

              return (
                <g 
                  key={el.id} 
                  onMouseDown={handleItemClick} 
                  onDoubleClick={() => {
                    if (el.locked) return;
                    if (el.type === "text") {
                      setEditingTextId(el.id); 
                      setEditingTextPos({ x: el.x, y: el.y }); 
                      isNewTextRef.current = false; 
                      setTimeout(() => textareaRef.current?.focus(), 50);
                    } else if (el.parentId) {
                      // Drill down on non-text elements too? 
                      // Selecting the leaf on double click is standard.
                      onSelect([el.id]);
                    }
                  }} 
                  style={{ cursor: el.locked ? "not-allowed" : activeTool === "selection" ? "pointer" : "default" }}
                >
                  <HandDrawnElement_v2 element={el} isSelected={isSelected} isEditing={isEditing} isHovered={isHovered} theme={theme} />
                </g>
              );
            })}
          </g>

          {/* Render UI elements (Handles, Selection Box) OUTSIDE the clip group so they remain visible */}
          {elements.map(el => {
             const isSelected = selectedIds.includes(el.id);
             if (!isSelected || selectedIds.length > 1) return null;
             return <g key={`handles-${el.id}`}>{renderHandles(el)}</g>;
          })}

          {/* ── Multi-selection group bounding box ── */}
          {selectedIds.length > 1 && (() => {
            const selectedEls = elements.filter(el => selectedIds.includes(el.id));
            if (selectedEls.length === 0) return null;
            let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
            selectedEls.forEach(el => {
              const b = getElementBounds(el);
              minX = Math.min(minX, b.x);
              minY = Math.min(minY, b.y);
              maxX = Math.max(maxX, b.x + b.width);
              maxY = Math.max(maxY, b.y + b.height);
            });
            const PAD = 10;
            const gx = minX - PAD, gy = minY - PAD;
            const gw = maxX - minX + PAD * 2, gh = maxY - minY + PAD * 2;
            return (
              <g>
                {/* Filled draggable area */}
                <rect
                  x={gx} y={gy} width={gw} height={gh}
                  fill="rgba(79,139,255,0.04)"
                  stroke="#4f8bff"
                  strokeWidth={1.5}
                  strokeDasharray="6 4"
                  style={{ cursor: "move", pointerEvents: "all" }}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    const pos = getMousePos(e);
                    setDragInfo({
                      mode: "move",
                      startX: pos.x,
                      startY: pos.y,
                      elementOffsets: selectedEls.map(el => ({
                        id: el.id, x: el.x, y: el.y,
                        x2: el.x2, y2: el.y2,
                        points: el.points ? [...el.points] : undefined,
                      })),
                    });
                  }}
                />
                {/* Corner RESIZE handles */}
                {[
                  { handle: "tl", x: gx,      y: gy,       cursor: "nwse-resize" },
                  { handle: "tr", x: gx + gw, y: gy,       cursor: "nesw-resize" },
                  { handle: "bl", x: gx,      y: gy + gh,  cursor: "nesw-resize" },
                  { handle: "br", x: gx + gw, y: gy + gh,  cursor: "nwse-resize" },
                ].map((h) => (
                  <rect key={h.handle}
                    x={h.x - 6} y={h.y - 6} width={12} height={12} rx={2}
                    fill="white" stroke="#4f8bff" strokeWidth={1.5}
                    style={{ cursor: h.cursor, pointerEvents: "all" }}
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      const pos = getMousePos(e);
                      setDragInfo({
                        mode: "group-resize",
                        startX: pos.x,
                        startY: pos.y,
                        groupBounds: { gx, gy, gw, gh, handle: h.handle },
                        elementOffsets: selectedEls.map(el => ({
                          id: el.id, x: el.x, y: el.y,
                          x2: el.x2, y2: el.y2,
                          points: el.points ? [...el.points] : undefined,
                          width: el.width, height: el.height,
                          fontSize: el.fontSize,
                        })),
                      });
                    }}
                  />
                ))}
                {/* Selection count badge */}
                <rect x={gx} y={gy - 22} width={48} height={18} rx={4} fill="#4f8bff" style={{ pointerEvents: "none" }} />
                <text x={gx + 24} y={gy - 9} textAnchor="middle" dominantBaseline="middle"
                  style={{ fill: "#fff", fontSize: "11px", fontWeight: 700, fontFamily: "Inter,sans-serif", pointerEvents: "none", userSelect: "none" }}>
                  {selectedEls.length} items
                </text>
                {/* Rotation handle — circle above the top-center */}
                {(() => {
                  const rhx = gx + gw / 2;
                  const rhy = gy - 36;
                  return (
                    <g>
                      <line x1={rhx} y1={rhy + 6} x2={rhx} y2={gy}
                        stroke="#4f8bff" strokeWidth={1} strokeDasharray="3 3"
                        style={{ pointerEvents: "none" }}
                      />
                      <circle cx={rhx} cy={rhy} r={7}
                        fill="white" stroke="#4f8bff" strokeWidth={1.5}
                        style={{ cursor: "grab", pointerEvents: "all" }}
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          const pos = getMousePos(e);
                          const cx = gx + gw / 2, cy = gy + gh / 2;
                          setDragInfo({
                            mode: "group-rotate",
                            startX: pos.x, startY: pos.y,
                            groupCenter: { cx, cy, startAngle: Math.atan2(pos.y - cy, pos.x - cx) },
                            elementOffsets: selectedEls.map(el => ({
                              id: el.id, x: el.x, y: el.y,
                              x2: el.x2, y2: el.y2,
                              points: el.points ? [...el.points] : undefined,
                              rotation: el.rotation ?? 0,
                            })),
                          });
                        }}
                      />
                      {/* Rotation icon hint */}
                      <text x={rhx} y={rhy} textAnchor="middle" dominantBaseline="middle"
                        style={{ fontSize: "9px", fill: "#4f8bff", pointerEvents: "none", userSelect: "none", fontWeight: 700 }}>↻</text>
                    </g>
                  );
                })()}
              </g>

            );
          })()}

          {selectionBox && (
            <rect 
              x={Math.min(selectionBox.x, selectionBox.x+selectionBox.width)} 
              y={Math.min(selectionBox.y, selectionBox.y+selectionBox.height)} 
              width={Math.abs(selectionBox.width)} 
              height={Math.abs(selectionBox.height)} 
              fill="rgba(79, 139, 255, 0.08)" 
              stroke="#4f8bff" 
              strokeWidth="1.5"
              rx={4}
              style={{ filter: "drop-shadow(0 0 8px rgba(79,139,255,0.2))" }}
            />
          )}

          {/* ERASER CURSOR */}
          {activeTool === "eraser" && eraserPos && (
             <circle 
               cx={eraserPos.x} 
               cy={eraserPos.y} 
               r={eraserSize} 
               fill="rgba(255, 60, 60, 0.2)" 
               stroke="#ff4d4d" 
               strokeWidth="1" 
               style={{ pointerEvents: "none" }}
             />
          )}

          {/* SNAPPING GUIDES */}
          {snappingLines && (
            <g style={{ pointerEvents: "none" }}>
              {snappingLines.x !== undefined && (
                <line x1={snappingLines.x} y1={-10000} x2={snappingLines.x} y2={10000} stroke="#4f8bff" strokeWidth="1" strokeDasharray="5 5" opacity="0.4" />
              )}
              {snappingLines.y !== undefined && (
                <line x1={-10000} y1={snappingLines.y} x2={10000} y2={snappingLines.y} stroke="#4f8bff" strokeWidth="1" strokeDasharray="5 5" opacity="0.4" />
              )}
            </g>
          )}
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
            value={editingEl?.content || ""}
            onFocus={() => { /* textarea has focus — keep isNewTextRef intact */ }}
            onBlur={() => {
              // Fix #1: only auto-delete if this text element was NEWLY created and still empty
              if (isNewTextRef.current && editingEl && !editingEl.content?.trim()) {
                onRemoveElements([editingTextId]);
              }
              isNewTextRef.current = false;
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
                isNewTextRef.current = false;
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
              // Visible dashed outline so users know the editor is active
              outline: "1.5px dashed rgba(79,139,255,0.7)",
              outlineOffset: "4px",
              padding: "2px",
              margin: 0,
              fontFamily: editingEl?.fontFamily || "Inter, sans-serif",
              fontSize: `${(editingEl?.fontSize || 24) * (zoom / 100)}px`,
              lineHeight: 1.25,
              fontWeight: 800,
              resize: "none",
              whiteSpace: "pre-wrap",
              display: "block",
              overflow: "hidden",
              caretColor: editingEl?.stroke || (theme === "dark" ? "#ffffff" : "#000000"),
              transform: `translateY(${(editingEl?.fontSize || 24) * 0.1 * (zoom/100)}px)`
            }}
          />
        </Box>
      )}
    </Box>
  );
};
export default Canvas;
