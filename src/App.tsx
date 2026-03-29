import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  IconButton,
  Stack,
  Button,
  Tooltip,
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
  Download as SaveIcon,
  Edit2 as EditIcon,
  Upload as ImportIcon,
  Trash2 as TrashIcon,
  Layout as SectionIcon,
} from "lucide-react";
import { useSvgStore } from "./hooks/useSvgStore";
import Canvas from "./components/Canvas";
import PropertyBar from "./components/PropertyBar";
import LayersPanel from "./components/LayersPanel";

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
    toggleLock,
    addPoint,
    finalizeDrawing,
    duplicateElements,
    bringToFront,
    sendToBack,
    reorderElements,
    alignElements,
    clearCanvas,
    undo,
    redo,
    groupElements,
    ungroupElements,
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

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (file.type === "image/svg+xml") {
        // Simple SVG extraction: just the content inside <svg> if possible, or use as is
        let svgData = content;
        if (content.includes("<svg")) {
          const match = content.match(/<svg[^>]*>([\s\S]*?)<\/svg>/i);
          if (match) svgData = match[1];
        }
        addElement("svg", { svgContent: svgData, name: file.name, width: 200, height: 200 });
      } else {
        addElement("image", { url: content, name: file.name, width: 200, height: 200 });
      }
    };
    if (file.type === "image/svg+xml") reader.readAsText(file);
    else reader.readAsDataURL(file);
    e.target.value = "";
  };

  const toolbarTools = [
    { id: "selection", icon: <SelectionIcon />, label: "SELECT" },
    { id: "rect", icon: <RectIcon />, label: "RECT" },
    { id: "circle", icon: <CircleIcon />, label: "CIRCLE" },
    { id: "line", icon: <LineIcon />, label: "LINE" },
    { id: "arrow", icon: <ArrowIcon />, label: "ARROW" },
    { id: "pencil", icon: <PencilIcon />, label: "PENCIL" },
    { id: "text", icon: <TextIcon />, label: "TEXT" },
    { id: "section", icon: <SectionIcon />, label: "SECTION" },
    { id: "import", icon: <ImportIcon />, label: "IMPORT" },
    { id: "grid", icon: <SettingsIcon />, label: "GRID" },
    { id: "layers", icon: <LayersIcon />, label: "LAYERS" },
  ];

  const borderColor = theme === "dark" ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.1)";
  const textColor = theme === "dark" ? "#ffffff" : "#000000";
  const subTextColor = theme === "dark" ? "rgba(255, 255, 255, 0.7)" : "rgba(0, 0, 0, 0.85)";

  return (
    <Box sx={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", bgcolor: theme === "dark" ? "#0b0e14" : "#f0f2f5", color: textColor, overflow: "hidden" }}>
      <Box className="mui-glass-panel" sx={{ height: 64, px: 3, display: "flex", alignItems: "center", borderBottom: `1px solid ${borderColor}`, zIndex: 1100 }}>
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
          <Tooltip title="Clear Canvas">
            <IconButton 
              size="small" 
              onClick={() => { if(window.confirm("Clear all elements? This cannot be undone.")) clearCanvas(); }} 
              sx={{ color: "rgba(255,79,79,0.7)", ml: 2, p: 0.5 }}
            >
              <TrashIcon size={16} />
            </IconButton>
          </Tooltip>
          <Box component="span" sx={{ opacity: 0.4, fontSize: "0.75rem", fontWeight: 600, ml: 1 }}>• Saved {lastSaved}</Box>
        </Stack>

        <Stack direction="row" spacing={2} alignItems="center">
          <IconButton onClick={() => setTheme(theme === "dark" ? "light" : "dark")} sx={{ color: subTextColor }}>{theme === "dark" ? <LightModeIcon size={18} /> : <DarkModeIcon size={18} />}</IconButton>
          <IconButton onClick={handleExportPNG} sx={{ color: "#4f8bff" }}><SaveIcon size={18} /></IconButton>
          <Button variant="contained" onClick={handleExportPNG} sx={{ bgcolor: "#4f8bff", textTransform: "none", borderRadius: 2, fontWeight: 900, px: 3 }}>Export PNG</Button>
        </Stack>
      </Box>

      <Box sx={{ flexGrow: 1, display: "flex", overflow: "hidden", position: "relative" }}>
        <Box className="mui-glass-panel" sx={{ width: 80, borderRight: `1px solid ${borderColor}`, display: "flex", flexDirection: "column", alignItems: "center", py: 2, gap: 1 }}>
          {toolbarTools.map((tool) => {
            const isActive = activeTool === tool.id || (tool.id === "layers" && showLayers) || (tool.id === "grid" && gridEnabled);
            return (
              <Tooltip key={tool.id} title={tool.label} placement="right" arrow>
                <IconButton 
                  onClick={() => { 
                    if (tool.id === "layers") setShowLayers(!showLayers); 
                    else if (tool.id === "grid") setGridEnabled(!gridEnabled); 
                    else if (tool.id === "import") document.getElementById("import-input")?.click();
                    else setActiveTool(tool.id); 
                  }} 
                  sx={{ 
                    flexDirection: "column", 
                    width: 56, height: 56, 
                    borderRadius: 2, 
                    color: isActive ? "#4f8bff" : subTextColor, 
                    bgcolor: isActive ? "rgba(79, 139, 255, 0.12)" : "transparent",
                    transition: "all 0.2s",
                    "&:hover": { bgcolor: isActive ? "rgba(79, 139, 255, 0.2)" : "rgba(255,255,255,0.05)" }
                  }}>
                  {React.cloneElement(tool.icon as any, { size: 20 })}
                  <Typography sx={{ fontSize: "0.55rem", fontWeight: 900, mt: 0.5 }}>{tool.label.slice(0, 10)}</Typography>
                </IconButton>
              </Tooltip>
            );
          })}
          <input id="import-input" type="file" accept="image/*,.svg" style={{ display: "none" }} onChange={handleImport} />
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
            onDuplicate={duplicateElements} 
            onBringToFront={bringToFront} 
            onSendToBack={sendToBack} 
            onGroup={groupElements}
            onUngroup={ungroupElements}
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
            <Box sx={{ position: "absolute", top: 20, right: 20, zIndex: 1200 }}>
              <LayersPanel
                elements={elements}
                selectedIds={selectedIds}
                onSelect={(ids) => setSelectedIds(ids)}
                onToggleVisibility={toggleVisibility}
                onToggleLock={toggleLock}
                onRemoveElements={removeElements}
                onDuplicate={(ids) => duplicateElements(ids)}
                onReorder={reorderElements}
                onBringToFront={bringToFront}
                onSendToBack={sendToBack}
                onClose={() => setShowLayers(false)}
                onRename={(id, name) => updateElement(id, { name })}
                theme={theme}
              />
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default App;
