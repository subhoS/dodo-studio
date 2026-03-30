import React, { useState, useEffect } from "react";
import { 
  Box, IconButton, Tooltip, Stack, Typography, Button, Divider, Slider 
} from "@mui/material";
import { 
  Square, Circle, MousePointer2, Pencil, Type, Layers as LayersIcon, 
  Minus as LineIcon, ArrowRight as ArrowIcon, Edit2 as EditIcon, 
  Upload as ImportIcon, Trash2 as TrashIcon, Maximize, Grid as GridIcon,
  Sun as LightModeIcon, Moon as DarkModeIcon, 
  ChevronLeft, Share2, Download, User, Library, Eraser as EraserIcon
} from "lucide-react";
import { useSvgStore } from "./hooks/useSvgStore";
import DodoLogo from "./components/DodoLogo";
import Canvas from "./components/Canvas";
import PropertyBar from "./components/PropertyBar";
import LayersPanel from "./components/LayersPanel";
import ShortcutsModal from "./components/ShortcutsModal";
import Dashboard from "./components/Dashboard";
import LibraryPanel from "./components/LibraryPanel";

const App: React.FC = () => {
  const { 
    elements, activeProject, projects,
    createProject, loadProject, deleteProject, updateProjectName,
    addElement, updateElement, updateElements, removeElements, 
    duplicateElements, bringToFront, sendToBack, 
    reorderElements, groupElements, ungroupElements, alignElements, 
    toggleVisibility, toggleLock,
    addPoint, finalizeDrawing,
    undo, redo, clearCanvas,
    selectedIds, setSelectedIds,
    selectedElement, eraseFromPencil
  } = useSvgStore();

  const [activeTool, setActiveTool] = useState("selection");
  const [showLayers, setShowLayers] = useState(false);
  const [showLibrary, setShowLibrary] = useState(false);
  const [gridEnabled, setGridEnabled] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [zoom, setZoom] = useState(100);
  const [view, setView] = useState<"dashboard" | "editor">("dashboard");
  const [isEditingName, setIsEditingName] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [eraserSize, setEraserSize] = useState(10);
  const [eraserMode, setEraserMode] = useState<"object" | "freeform">("object");

  const activeMode = activeProject?.mode || "designer";
  const artboardSize = activeProject?.artboardSize || { width: 1000, height: 1000 };
  const projectName = activeProject?.name || "Untitled";

  useEffect(() => {
    if (activeProject) {
      setView("editor");
      setActiveTool("selection");
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent("fit-to-screen"));
      }, 50);
    } else {
      setView("dashboard");
    }
  }, [activeProject?.id, artboardSize.width, artboardSize.height]);

  const handleZoom = (val: number, isAbsolute = false) => {
    setZoom(prev => {
      const next = isAbsolute ? val : prev + val;
      return Math.min(Math.max(next, 5), 800);
    });
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "?" && !isEditingName) {
        setShowShortcuts(prev => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isEditingName]);

  const handleExportPNG = async () => {
    if (elements.length === 0) return;

    const scale = 2; // 2x for Retina
    let vbX: number, vbY: number, vbW: number, vbH: number;

    if (activeMode === "designer") {
      vbX = -artboardSize.width / 2;
      vbY = -artboardSize.height / 2;
      vbW = artboardSize.width;
      vbH = artboardSize.height;
    } else {
      // Moodboard: auto-fit to content bounds with padding
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      elements.forEach(el => {
        if (!el.visible) return;
        const b = (() => {
          if (el.type === "line" || el.type === "arrow") {
            const x1 = Math.min(el.x, el.x2 || el.x), y1 = Math.min(el.y, el.y2 || el.y);
            const x2 = Math.max(el.x, el.x2 || el.x), y2 = Math.max(el.y, el.y2 || el.y);
            return { x: x1, y: y1, w: Math.max(2, x2 - x1), h: Math.max(2, y2 - y1) };
          } else if (el.type === "pencil" && el.points?.length) {
            const xs = el.points.map(p => p.x), ys = el.points.map(p => p.y);
            const px = Math.min(...xs), py = Math.min(...ys);
            return { x: px, y: py, w: Math.max(2, Math.max(...xs) - px), h: Math.max(2, Math.max(...ys) - py) };
          }
          return { x: el.x, y: el.y, w: el.width || 100, h: el.height || 100 };
        })();
        minX = Math.min(minX, b.x);
        minY = Math.min(minY, b.y);
        maxX = Math.max(maxX, b.x + b.w);
        maxY = Math.max(maxY, b.y + b.h);
      });
      const pad = 40;
      vbX = minX - pad; vbY = minY - pad;
      vbW = maxX - minX + pad * 2;
      vbH = maxY - minY + pad * 2;
    }

    const canvasW = vbW * scale;
    const canvasH = vbH * scale;

    // Build a clean SVG string from element data — no UI artifacts
    const buildElementSvg = (el: typeof elements[0]): string => {
      if (!el.visible) return "";
      const rot = el.rotation ? `transform="rotate(${el.rotation}, ${el.x + (el.width || 0) / 2}, ${el.y + (el.height || 0) / 2})"` : "";
      const opacity = (el.opacity ?? 1) !== 1 ? `opacity="${el.opacity}"` : "";

      switch (el.type) {
        case "rect":
          return `<g ${rot} ${opacity}><rect x="${el.x}" y="${el.y}" width="${el.width || 0}" height="${el.height || 0}" fill="${el.fill}" stroke="${el.stroke}" stroke-width="${el.strokeWidth}" rx="${el.cornerRadius || 0}" ry="${el.cornerRadius || 0}" ${el.strokeStyle === "dashed" ? 'stroke-dasharray="8 8"' : el.strokeStyle === "dotted" ? 'stroke-dasharray="2 4"' : ""}/></g>`;
        case "circle":
          return `<g ${rot} ${opacity}><ellipse cx="${el.x + (el.width || 0) / 2}" cy="${el.y + (el.height || 0) / 2}" rx="${(el.width || 0) / 2}" ry="${(el.height || 0) / 2}" fill="${el.fill}" stroke="${el.stroke}" stroke-width="${el.strokeWidth}" ${el.strokeStyle === "dashed" ? 'stroke-dasharray="8 8"' : el.strokeStyle === "dotted" ? 'stroke-dasharray="2 4"' : ""}/></g>`;
        case "line":
          return `<g ${opacity}><line x1="${el.x}" y1="${el.y}" x2="${el.x2 || el.x}" y2="${el.y2 || el.y}" stroke="${el.stroke}" stroke-width="${el.strokeWidth}" ${el.strokeStyle === "dashed" ? 'stroke-dasharray="8 8"' : ""}/></g>`;
        case "arrow": {
          const ax1 = el.x, ay1 = el.y, ax2 = el.x2 || el.x, ay2 = el.y2 || el.y;
          const angle = Math.atan2(ay2 - ay1, ax2 - ax1), headL = 15, headA = Math.PI / 6;
          return `<g ${opacity}><line x1="${ax1}" y1="${ay1}" x2="${ax2}" y2="${ay2}" stroke="${el.stroke}" stroke-width="${el.strokeWidth}"/>
            <line x1="${ax2}" y1="${ay2}" x2="${ax2 - headL * Math.cos(angle - headA)}" y2="${ay2 - headL * Math.sin(angle - headA)}" stroke="${el.stroke}" stroke-width="${el.strokeWidth}"/>
            <line x1="${ax2}" y1="${ay2}" x2="${ax2 - headL * Math.cos(angle + headA)}" y2="${ay2 - headL * Math.sin(angle + headA)}" stroke="${el.stroke}" stroke-width="${el.strokeWidth}"/></g>`;
        }
        case "pencil":
          if (!el.points?.length) return "";
          return `<g ${opacity}><polyline points="${el.points.map(p => `${p.x},${p.y}`).join(" ")}" fill="none" stroke="${el.stroke}" stroke-width="${el.strokeWidth}" stroke-linecap="round" stroke-linejoin="round"/></g>`;
        case "text":
          return `<g ${rot} ${opacity}><text x="${el.x}" y="${el.y}" dominant-baseline="hanging" style="font-family: ${el.fontFamily || "Inter, sans-serif"}; font-size: ${el.fontSize || 24}px; font-weight: 800; fill: ${el.stroke}; white-space: pre-wrap;">${(el.content || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</text></g>`;
        case "image":
          if (!el.content && !el.url) return "";
          return `<g ${rot} ${opacity}><image href="${el.url || el.content}" x="${el.x}" y="${el.y}" width="${el.width || 100}" height="${el.height || 100}" preserveAspectRatio="xMidYMid meet"/></g>`;
        case "svg":
          if (!el.svgContent) return "";
          return `<g ${rot} ${opacity} transform="translate(${el.x},${el.y}) scale(${(el.width || 100) / 100}, ${(el.height || 100) / 100})">${el.svgContent}</g>`;
        case "path":
          if (!el.content) return "";
          return `<g ${rot} ${opacity}><path d="${el.content}" fill="${el.fill}" stroke="${el.stroke}" stroke-width="${el.strokeWidth}"/></g>`;
        case "section":
          return `<g ${opacity}><rect x="${el.x}" y="${el.y}" width="${el.width || 0}" height="${el.height || 0}" rx="12" fill="rgba(128,128,128,0.03)" stroke="rgba(128,128,128,0.15)" stroke-width="1.5" stroke-dasharray="6 4"/></g>`;
        default:
          return "";
      }
    };

    const bgFill = theme === "dark" ? "#1a1d21" : "#ffffff";
    const sortedEls = [...elements].sort((a, _b) => (a.type === "section" ? -1 : 1));
    const contentSvg = sortedEls.map(buildElementSvg).join("\n");

    const svgStr = `<svg xmlns="http://www.w3.org/2000/svg" width="${canvasW}" height="${canvasH}" viewBox="${vbX} ${vbY} ${vbW} ${vbH}">
      <rect x="${vbX}" y="${vbY}" width="${vbW}" height="${vbH}" fill="${bgFill}"/>
      ${contentSvg}
    </svg>`;

    const svgBlob = new Blob([svgStr], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);

    const canvas = document.createElement("canvas");
    canvas.width = canvasW;
    canvas.height = canvasH;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      ctx.drawImage(img, 0, 0, canvasW, canvasH);
      try {
        const pngUrl = canvas.toDataURL("image/png");
        const link = document.createElement("a");
        link.href = pngUrl;
        link.download = `${projectName}_2x.png`;
        link.click();
      } catch {
        // Fallback: download SVG directly if canvas is tainted
        const svgLink = document.createElement("a");
        svgLink.href = url;
        svgLink.download = `${projectName}.svg`;
        svgLink.click();
      }
      URL.revokeObjectURL(url);
    };
    img.onerror = () => {
      // Fallback: download SVG if image rendering fails
      const svgLink = document.createElement("a");
      svgLink.href = url;
      svgLink.download = `${projectName}.svg`;
      svgLink.click();
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleImportFile(file);
    e.target.value = "";
  };

  const handleImportFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (file.type === "image/svg+xml") {
        addElement("svg", { content, name: file.name });
      } else {
        addElement("image", { content, name: file.name });
      }
    };
    if (file.type === "image/svg+xml") reader.readAsText(file);
    else reader.readAsDataURL(file);
  };

  const toolbarTools = [
    { id: "selection", label: "Select (V)", icon: <MousePointer2 /> },
    { id: "rect", label: "Rectangle (R)", icon: <Square /> },
    { id: "circle", label: "Circle (O)", icon: <Circle /> },
    { id: "line", label: "Line (L)", icon: <LineIcon /> },
    { id: "arrow", label: "Arrow (A)", icon: <ArrowIcon /> },
    { id: "pencil", label: "Pencil (P)", icon: <Pencil /> },
    { id: "text", label: "Text (T)", icon: <Type /> },
    { id: "library", label: "Library", icon: <Library /> },
    { id: "eraser", label: "Eraser (E)", icon: <EraserIcon /> },
    { id: "section", label: "Section (S)", icon: <Maximize /> },
    { id: "import", label: "Import (I)", icon: <ImportIcon /> },
    { id: "grid", label: "Grid (G)", icon: <GridIcon /> },
    { id: "layers", label: "Layers", icon: <LayersIcon /> },
  ];

  if (view === "dashboard") {
    return (
      <Dashboard 
        projects={projects} 
        onCreateProject={createProject} 
        onLoadProject={loadProject} 
        onDeleteProject={deleteProject}
        theme={theme}
      />
    );
  }

  return (
    <Box sx={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", bgcolor: "transparent", color: "#f1f5f9", overflow: "hidden", position: "relative" }}>
      {/* Editor Header */}
      <Box className="glass-panel" sx={{ height: 64, px: 3, display: "flex", alignItems: "center", zIndex: 1100, borderRadius: 0, borderTop: "none", borderLeft: "none", borderRight: "none" }}>
        <Stack direction="row" alignItems="center" spacing={2} sx={{ mr: 4 }}>
          <IconButton onClick={() => loadProject("")} sx={{ color: "rgba(255,255,255,0.4)", "&:hover": { color: "#22d3ee" } }}>
            <ChevronLeft size={20} />
          </IconButton>
          <DodoLogo size={24} />
        </Stack>

        <Divider orientation="vertical" flexItem sx={{ mx: 1, my: 1.5, opacity: 0.1 }} />

        <Stack direction="row" alignItems="center" sx={{ flexGrow: 1, ml: 3, gap: 1 }}>
          {isEditingName ? (
            <input 
              autoFocus 
              value={projectName} 
              onChange={(e) => updateProjectName(e.target.value)} 
              onBlur={() => setIsEditingName(false)} 
              onKeyDown={(e) => e.key === "Enter" && setIsEditingName(false)} 
              className="heading-font"
              style={{ background: "transparent", color: "#fff", border: "none", borderBottom: "2px solid #22d3ee", outline: "none", fontWeight: 700, fontSize: "0.95rem", width: "180px" }} 
            />
          ) : (
            <Stack direction="row" alignItems="center" spacing={1} onClick={() => setIsEditingName(true)} sx={{ cursor: "pointer", "&:hover": { opacity: 0.8 } }}>
              <Typography className="heading-font" sx={{ fontWeight: 700, fontSize: "0.95rem" }}>{projectName}</Typography>
              <EditIcon size={12} style={{ opacity: 0.3 }} />
            </Stack>
          )}
          <Box className="heading-font" component="span" sx={{ opacity: 0.3, fontSize: "0.7rem", fontWeight: 600, ml: 1, textTransform: "uppercase", letterSpacing: "1px" }}>• {activeMode}</Box>
        </Stack>

        <Stack direction="row" spacing={1.5} alignItems="center">
          <IconButton onClick={() => setTheme(theme === "dark" ? "light" : "dark")} sx={{ color: "rgba(255,255,255,0.4)" }}>
            {theme === "dark" ? <LightModeIcon size={18} /> : <DarkModeIcon size={18} />}
          </IconButton>
          
          <Button 
            variant="outlined" 
            size="small" 
            startIcon={<Share2 size={16} />}
            sx={{ borderRadius: "8px", borderColor: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.8)", textTransform: "none", fontWeight: 700, height: 36 }}
          >
            Share
          </Button>

          <Button 
            variant="contained" 
            onClick={handleExportPNG} 
            startIcon={<Download size={16} />}
            sx={{ bgcolor: "#22d3ee", color: "#020617", textTransform: "none", borderRadius: "8px", fontWeight: 800, px: 2, height: 36, "&:hover": { bgcolor: "#67e8f9" } }}
          >
            Export
          </Button>

          <Box sx={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", ml: 1 }}>
            <User size={16} color="rgba(255,255,255,0.4)" />
          </Box>
        </Stack>
      </Box>

      <Box sx={{ flexGrow: 1, display: "flex", overflow: "hidden", position: "relative" }}>
        {/* Floating Toolbar */}
        <Box 
          className="glass-panel" 
          sx={{ 
            position: "absolute", left: 20, top: "50%", transform: "translateY(-50%)",
            width: 64, borderRadius: "16px", zIndex: 1100,
            display: "flex", flexDirection: "column", alignItems: "center", py: 2, gap: 0.5,
            boxShadow: "0 10px 40px rgba(0,0,0,0.5)",
            maxHeight: "calc(100vh - 140px)",
            overflowY: "auto",
            scrollbarWidth: "none", // Hide for Firefox
            "&::-webkit-scrollbar": { display: "none" } // Hide for Chrome
          }}
        >
          {toolbarTools.map((tool) => {
            const isActive = activeTool === tool.id || (tool.id === "layers" && showLayers) || (tool.id === "grid" && gridEnabled);
            return (
              <Tooltip key={tool.id} title={tool.label} placement="right" arrow>
                <IconButton
                  onClick={() => {
                    if (tool.id === "layers") { setShowLayers(!showLayers); setShowLibrary(false); }
                    else if (tool.id === "library") { setShowLibrary(!showLibrary); setShowLayers(false); }
                    else if (tool.id === "grid") setGridEnabled(!gridEnabled);
                    else if (tool.id === "import") document.getElementById("import-input")?.click();
                    else setActiveTool(tool.id);
                  }}
                  sx={{
                    width: 48, height: 48,
                    borderRadius: "12px",
                    color: isActive ? "#22d3ee" : "rgba(255,255,255,0.4)",
                    bgcolor: isActive ? "rgba(34, 211, 238, 0.1)" : "transparent",
                    transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                    "&:hover": { bgcolor: isActive ? "rgba(34, 211, 238, 0.15)" : "rgba(255,255,255,0.05)", color: isActive ? "#22d3ee" : "#fff", transform: "scale(1.05)" }
                  }}>
                  {React.cloneElement(tool.icon as any, { size: 20, strokeWidth: isActive ? 2.5 : 2 })}
                </IconButton>
              </Tooltip>
            );
          })}
          <input id="import-input" type="file" accept="image/*,.svg" style={{ display: "none" }} onChange={handleImport} />
          
          <Divider sx={{ width: "60%", my: 1, opacity: 0.1 }} />

          <Tooltip title="Clear Canvas">
            <IconButton onClick={() => { if (window.confirm("Clear all elements?")) clearCanvas(); }} sx={{ color: "rgba(255,100,100,0.4)", "&:hover": { color: "#ff5f5f", bgcolor: "rgba(255,0,0,0.05)" } }}>
              <TrashIcon size={18} />
            </IconButton>
          </Tooltip>
        </Box>

        <Box sx={{ flexGrow: 1, position: "relative", display: "flex" }}>
          {showLibrary && (
            <Box sx={{ position: "absolute", top: 20, left: 100, zIndex: 1200 }}>
              <LibraryPanel 
                theme={theme} 
                onClose={() => setShowLibrary(false)} 
                onAddItem={(type, name, content, svgContent) => {
                  addElement(type, { 
                    name, 
                    content: content || "", 
                    svgContent: svgContent || "",
                    x: (window.innerWidth / 2) - 300, 
                    y: (window.innerHeight / 2) - 100,
                    width: 100,
                    height: 100,
                    fill: activeMode === "designer" ? "#22d3ee" : "transparent"
                  });
                }}
              />
            </Box>
          )}

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
            onImportFile={handleImportFile}
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
            activeMode={activeMode} 
            artboardSize={artboardSize} 
            eraserSize={eraserSize}
            eraserMode={eraserMode}
            eraseFromPencil={eraseFromPencil}
          />

          {selectedElement && (
            <Box sx={{ 
              position: "absolute", 
              bottom: (activeTool === "eraser") ? 110 : 30, // Stack above eraser settings if both active
              left: "50%", 
              transform: "translateX(-50%)", 
              zIndex: 1200,
              transition: "bottom 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              maxWidth: "calc(100% - 40px)"
            }}>
              <PropertyBar
                element={selectedElement}
                onUpdate={updateElement}
                onRemove={(id) => removeElements([id])}
                onBringToFront={(id) => bringToFront([id])}
                onSendToBack={(id) => sendToBack([id])}
                onDuplicate={(id) => duplicateElements([id])}
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
      <ShortcutsModal open={showShortcuts} onClose={() => setShowShortcuts(false)} theme={theme} />

      <Tooltip title="Keyboard Shortcuts (?)">
        <IconButton 
          onClick={() => setShowShortcuts(true)}
          sx={{ 
            position: "absolute", bottom: 24, right: 24, 
            width: 48, height: 48,
            borderRadius: "50%",
            zIndex: 2000,
            bgcolor: "rgba(15, 23, 42, 0.4)",
            backdropFilter: "blur(12px)",
            border: "1px solid rgba(255,255,255,0.1)",
            color: "#22d3ee",
            "&:hover": { bgcolor: "rgba(34, 211, 238, 0.1)", transform: "scale(1.05)" },
            transition: "all 0.2s"
          }}
        >
          <Typography className="heading-font" sx={{ fontWeight: 800, fontSize: "1.1rem" }}>?</Typography>
        </IconButton>
      </Tooltip>

      {/* Eraser Size Tooltip/Slider when eraser is active */}
      {activeTool === "eraser" && (
        <Box 
          className="glass-panel" 
          sx={{ 
            position: "absolute", bottom: 30, left: "50%", transform: "translateX(-50%)", 
            px: 3, py: 1, borderRadius: "20px", display: "flex", alignItems: "center", gap: 2,
            zIndex: 2000, minWidth: 200, boxShadow: "0 10px 40px rgba(0,0,0,0.4)"
          }}
        >
          <Stack direction="row" spacing={2} alignItems="center" sx={{ width: "100%" }}>
            <EraserIcon size={18} color="#22d3ee" />
            <Box sx={{ flexGrow: 1, px: 1 }}>
              <Typography sx={{ fontSize: "0.6rem", fontWeight: 900, opacity: 0.5, mb: -0.5 }}>ERASER SIZE: {eraserSize}px</Typography>
              <Slider 
                size="small" min={5} max={100} value={eraserSize} 
                onChange={(_, v) => setEraserSize(v as number)}
                sx={{ color: "#22d3ee", py: 1 }}
              />
            </Box>
            <Divider orientation="vertical" flexItem sx={{ height: 24, alignSelf: "center", mx: 1 }} />
            <Stack direction="row" spacing={0.5} sx={{ p: 0.5, bgcolor: "rgba(255,255,255,0.05)", borderRadius: "12px" }}>
              <Button 
                size="small"
                onClick={() => setEraserMode("object")}
                sx={{ 
                  fontSize: "0.6rem", px: 1.5, py: 0.5, borderRadius: "8px", 
                  bgcolor: eraserMode === "object" ? "#22d3ee" : "transparent",
                  color: eraserMode === "object" ? "#0f172a" : "white",
                  "&:hover": { bgcolor: eraserMode === "object" ? "#22d3ee" : "rgba(255,255,255,0.1)" }
                }}
              >
                Object
              </Button>
              <Button 
                size="small"
                onClick={() => setEraserMode("freeform")}
                sx={{ 
                  fontSize: "0.6rem", px: 1.5, py: 0.5, borderRadius: "8px", 
                  bgcolor: eraserMode === "freeform" ? "#22d3ee" : "transparent",
                  color: eraserMode === "freeform" ? "#0f172a" : "white",
                  "&:hover": { bgcolor: eraserMode === "freeform" ? "#22d3ee" : "rgba(255,255,255,0.1)" }
                }}
              >
                Normal
              </Button>
            </Stack>
          </Stack>
        </Box>
      )}
    </Box>
  );
};

export default App;
