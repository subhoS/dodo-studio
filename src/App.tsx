import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  IconButton,
  Stack,
  Button,
} from "@mui/material";
import {
  MousePointer2 as SelectionIcon,
  Square as RectIcon,
  Circle as CircleIcon,
  Pencil as PencilIcon,
  Type as TextIcon,
  Layers as LayersIcon,
  Settings as SettingsIcon,
  Sun as LightModeIcon,
  Moon as DarkModeIcon,
  Minus as LineIcon,
  ArrowRight as ArrowIcon,
  Eye as VisibleIcon,
  EyeOff as HiddenIcon,
  Download as SaveIcon,
  Edit2 as EditIcon,
} from "lucide-react";
import { useSvgStore } from "./hooks/useSvgStore";
import Canvas from "./components/Canvas";
import PropertyBar from "./components/PropertyBar";

const App: React.FC = () => {
  const [boardMode, setBoardMode] = useState<"moodboard" | "designer">("moodboard");
  const [artboardSize] = useState({ width: 1080, height: 1080 });
  const [lastSaved, setLastSaved] = useState<string>("Just now");

  const {
    elements,
    selectedIds,
    setSelectedIds,
    addElement,
    updateElement,
    updateElements,
    removeElements,
    toggleVisibility,
    addPoint,
    finalizeDrawing,
    duplicateElements,
    bringToFront,
    sendToBack,
    reorderElements,
    alignElements,
    undo,
    redo,
    selectedElement,
    projectName,
    setProjectName,
  } = useSvgStore(boardMode);

  const [gridEnabled, setGridEnabled] = useState(true);
  const [activeTool, setActiveTool] = useState("selection");
  const [zoom, setZoom] = useState(100);
  const [showLayers, setShowLayers] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [isEditingName, setIsEditingName] = useState(false);
  const [draggedLayerIdx, setDraggedLayerIdx] = useState<number | null>(null);

  // Fix #7: reset zoom when switching modes so canvas feels fresh
  useEffect(() => {
    setZoom(100);
  }, [boardMode]);

  useEffect(() => {
    const timer = setInterval(() => {
      setLastSaved(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  const handleZoom = (delta: number) => {
    setZoom((prev) => Math.min(200, Math.max(10, prev + delta)));
  };

  const handleExportPNG = async () => {
    const svgElement = document.querySelector("svg");
    if (!svgElement) return;
    const exportSvg = svgElement.cloneNode(true) as SVGSVGElement;
    const contentGroup = exportSvg.querySelector("g");
    if (!contentGroup) return;
    let width = boardMode === "designer" ? artboardSize.width : 2000;
    let height = boardMode === "designer" ? artboardSize.height : 1500;
    const vb = boardMode === "designer" ? `${-width/2} ${-height/2} ${width} ${height}` : `0 0 ${width} ${height}`;
    exportSvg.setAttribute("viewBox", vb);
    const canvas = document.createElement("canvas");
    canvas.width = width; canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const img = new Image();
    const svgData = new XMLSerializer().serializeToString(exportSvg);
    const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);
    img.onload = () => {
      ctx.fillStyle = theme === "dark" ? "#0b0e14" : "#ffffff";
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0);
      const pngUrl = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = pngUrl;
      link.download = `${projectName}.png`;
      link.click();
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  const toolbarTools = [
    { id: "selection", icon: <SelectionIcon />, label: "SELECT" },
    { id: "rect", icon: <RectIcon />, label: "RECT" },
    { id: "circle", icon: <CircleIcon />, label: "CIRCLE" },
    { id: "line", icon: <LineIcon />, label: "LINE" },
    { id: "arrow", icon: <ArrowIcon />, label: "ARROW" },
    { id: "pencil", icon: <PencilIcon />, label: "PENCIL" },
    { id: "text", icon: <TextIcon />, label: "TEXT" },
    { id: "grid", icon: <SettingsIcon />, label: "GRID" },
    { id: "layers", icon: <LayersIcon />, label: "LAYERS" },
  ];

  const borderColor = theme === "dark" ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.1)";
  const textColor = theme === "dark" ? "#ffffff" : "#000000";
  const subTextColor = theme === "dark" ? "rgba(255, 255, 255, 0.7)" : "rgba(0, 0, 0, 0.85)";

  return (
    <Box sx={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", bgcolor: theme === "dark" ? "#0b0e14" : "#ffffff", color: textColor, overflow: "hidden" }}>
      <Box sx={{ height: 64, px: 3, display: "flex", alignItems: "center", borderBottom: `1px solid ${borderColor}`, bgcolor: theme === "dark" ? "rgba(11, 14, 20, 0.8)" : "rgba(255, 255, 255, 0.8)", backdropFilter: "blur(12px)", zIndex: 1100 }}>
        <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mr: 4 }}>
          <Box sx={{ width: 36, height: 36, borderRadius: "10px", background: "linear-gradient(135deg, #4f8bff 0%, #3d6edb 100%)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem" }}>🦤</Box>
          <Typography variant="h6" sx={{ fontWeight: 900, background: "linear-gradient(90deg, #4f8bff, #8a63ff)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", letterSpacing:"-1px" }}>DODO</Typography>
        </Stack>
        <Stack direction="row" spacing={1} sx={{ ml: 4, alignItems: "center" }}>
          <Button variant={boardMode === "moodboard" ? "contained" : "text"} size="small" onClick={() => setBoardMode("moodboard")} startIcon={<PencilIcon size={16} />} sx={{ borderRadius: 2, textTransform: "none", fontWeight:800, bgcolor: boardMode === "moodboard" ? "#4f8bff" : "transparent", color: boardMode === "moodboard" ? "#fff" : "inherit" }}>Mood Board</Button>
          <Button variant={boardMode === "designer" ? "contained" : "text"} size="small" onClick={() => setBoardMode("designer")} startIcon={<LayersIcon size={16} />} sx={{ borderRadius: 2, textTransform: "none", fontWeight:800, bgcolor: boardMode === "designer" ? "#ffd33d" : "transparent", color: boardMode === "designer" ? "#000" : "inherit" }}>Designer</Button>
        </Stack>
        
        <Stack direction="row" alignItems="center" sx={{ flexGrow: 1, ml: 4, gap: 1 }}>
          {isEditingName ? (
            <input autoFocus value={projectName} onChange={(e) => setProjectName(e.target.value)} onBlur={() => setIsEditingName(false)} onKeyDown={(e) => e.key === "Enter" && setIsEditingName(false)} style={{ background: "transparent", color: textColor, border: "none", borderBottom: `2px solid #4f8bff`, outline: "none", fontWeight: 700, fontSize: "0.9rem", width: "150px" }} />
          ) : (
            <Stack direction="row" alignItems="center" spacing={1} onClick={() => setIsEditingName(true)} sx={{ cursor: "pointer", "&:hover": { opacity: 0.8 } }}>
              <Typography variant="body2" sx={{ fontWeight: 800 }}>{projectName}</Typography>
              <EditIcon size={12} style={{ opacity: 0.5 }} />
            </Stack>
          )}
          <Box component="span" sx={{ opacity: 0.4, fontSize: "0.75rem", fontWeight: 600 }}>• Saved {lastSaved}</Box>
        </Stack>

        <Stack direction="row" spacing={2} alignItems="center">
          <IconButton onClick={() => setTheme(theme === "dark" ? "light" : "dark")} sx={{ color: subTextColor }}>{theme === "dark" ? <LightModeIcon size={18} /> : <DarkModeIcon size={18} />}</IconButton>
          <IconButton onClick={handleExportPNG} sx={{ color: "#4f8bff" }}><SaveIcon size={18} /></IconButton>
          <Button variant="contained" onClick={handleExportPNG} sx={{ bgcolor: "#4f8bff", textTransform: "none", borderRadius: 2, fontWeight: 900, px: 3 }}>Export PNG</Button>
        </Stack>
      </Box>

      <Box sx={{ flexGrow: 1, display: "flex", overflow: "hidden", position: "relative" }}>
        <Box sx={{ width: 80, borderRight: `1px solid ${borderColor}`, bgcolor: theme === "dark" ? "rgba(11, 14, 20, 0.85)" : "rgba(255, 255, 255, 0.85)", backdropFilter: "blur(20px)", display: "flex", flexDirection: "column", alignItems: "center", py: 2, gap: 1 }}>
          {toolbarTools.map((tool) => {
            const isActive = activeTool === tool.id || (tool.id === "layers" && showLayers) || (tool.id === "grid" && gridEnabled);
            return (
              <IconButton 
                key={tool.id} 
                onClick={() => { 
                  if (tool.id === "layers") setShowLayers(!showLayers); 
                  else if (tool.id === "grid") setGridEnabled(!gridEnabled); 
                  else setActiveTool(tool.id); 
                }} 
                sx={{ 
                  flexDirection: "column", 
                  width: 64, height: 64, 
                  borderRadius: 3, 
                  color: isActive ? "#4f8bff" : subTextColor, 
                  bgcolor: isActive ? "rgba(79, 139, 255, 0.15)" : "transparent",
                  border: isActive ? "1px solid rgba(79, 139, 255, 0.3)" : "1px solid transparent",
                  transition: "all 0.2s"
                }}>
                {React.cloneElement(tool.icon as any, { size: 22 })}
                <Typography sx={{ fontSize: "0.6rem", fontWeight: 900, mt: 0.5 }}>{tool.label}</Typography>
              </IconButton>
            );
          })}
        </Box>

        <Box sx={{ flexGrow: 1, position: "relative" }}>
          <Canvas 
            elements={elements} 
            selectedIds={selectedIds} 
            onSelect={(ids) => setSelectedIds(ids || [])} 
            onAddPoint={addPoint} 
            onFinalizeDrawing={finalizeDrawing} 
            onUpdateElement={updateElement} 
            onUpdateElements={updateElements} 
            onAddElement={addElement} 
            onRemoveElements={removeElements} 
            onDuplicate={(ids)=>duplicateElements(ids)} 
            onBringToFront={bringToFront} 
            onSendToBack={sendToBack} 
            onUndo={undo} 
            onRedo={redo} 
            activeTool={activeTool} 
            onSetActiveTool={setActiveTool} 
            zoom={zoom} 
            onUpdateZoom={handleZoom} 
            theme={theme} 
            gridEnabled={gridEnabled} 
            boardMode={boardMode} 
            artboardSize={artboardSize} 
          />
          
          {selectedElement && (
            <Box sx={{ position: "absolute", bottom: 30, left: "50%", transform: "translateX(-50%)", zIndex: 1200 }}>
              <PropertyBar 
                element={selectedElement} 
                onUpdate={updateElement} 
                onRemove={(id)=>removeElements([id])} 
                onBringToFront={(id)=>bringToFront([id])} 
                onSendToBack={(id)=>sendToBack([id])} 
                onDuplicate={(id)=>duplicateElements([id])}
                onAlign={(id, align) => alignElements([id], align)}
                theme={theme} 
              />
            </Box>
          )}

          {showLayers && (
            <Paper sx={{ position: "absolute", top: 20, right: 20, width: 240, maxHeight: "calc(100% - 140px)", borderRadius: 4, border: `1px solid ${borderColor}`, bgcolor: theme === "dark" ? "rgba(11, 14, 20, 0.9)" : "rgba(255, 255, 255, 0.9)", backdropFilter: "blur(20px)", display: "flex", flexDirection: "column", overflow: "hidden", zIndex: 1200 }}>
              <Box sx={{ p: 2, borderBottom: `1px solid ${borderColor}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Typography sx={{ fontWeight: 900, fontSize: "0.85rem", letterSpacing: "0.5px" }}>LAYERS</Typography>
                <IconButton size="small" onClick={() => setShowLayers(false)}><LayersIcon size={14} /></IconButton>
              </Box>
              <Box sx={{ flexGrow: 1, overflowY: "auto", p: 1 }}>
                {elements.slice().reverse().map((el, i) => {
                  const actualIdx = elements.length - 1 - i;
                  return (
                    <Box key={el.id} 
                      draggable 
                      onDragStart={() => setDraggedLayerIdx(actualIdx)}
                      onDragOver={(e) => { e.preventDefault(); }}
                      onDrop={() => { if (draggedLayerIdx !== null) { reorderElements(draggedLayerIdx, actualIdx); setDraggedLayerIdx(null); } }}
                      onClick={() => setSelectedIds([el.id])} 
                      sx={{ p: 1.5, mb: 0.5, borderRadius: 2, bgcolor: selectedIds.includes(el.id) ? "rgba(79, 139, 255, 0.1)" : "transparent", color: selectedIds.includes(el.id) ? "#4f8bff" : textColor, cursor: "grab", display: "flex", alignItems: "center", gap: 1.5, border: draggedLayerIdx === actualIdx ? "2px dashed #4f8bff" : "none" }}>
                      <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: el.stroke }} />
                      <Typography sx={{ flexGrow: 1, fontSize: "0.8rem", fontWeight: 800 }}>{el.name}</Typography>
                      <IconButton size="small" onClick={(e) => { e.stopPropagation(); toggleVisibility(el.id); }}>{el.visible ? <VisibleIcon size={14} /> : <HiddenIcon size={14} />}</IconButton>
                    </Box>
                  );
                })}
              </Box>
            </Paper>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default App;
