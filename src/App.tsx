import React, { useState } from "react";
import {
  Box,
  Typography,
  Paper,
  IconButton,
  Tooltip,
  Divider,
  Stack,
  Avatar,
  Button,
} from "@mui/material";
import {
  Mouse as SelectionIcon,
  Rectangle as RectIcon,
  Circle as CircleIcon,
  Create as PencilIcon,
  TextFields as TextIcon,
  Layers as LayersIcon,
  Settings as SettingsIcon,
  HelpOutline as HelpIcon,
  Visibility as VisibleIcon,
  VisibilityOff as HiddenIcon,
  Delete as DeleteIcon,
  ContentCopy as DuplicateIcon,
  HorizontalRule as LineIcon,
  ArrowForward as ArrowIcon,
  ZoomIn,
  ZoomOut,
  Fullscreen,
  LightMode as LightModeIcon,
  DarkMode as DarkModeIcon,
  Opacity as OpacityIcon,
  AlignHorizontalLeft,
  AlignHorizontalCenter,
  AlignHorizontalRight,
  AlignVerticalTop,
  AlignVerticalCenter,
  AlignVerticalBottom,
  FlipToFront,
  FlipToBack,
  Colorize as ColorizeIcon,
} from "@mui/icons-material";
import { Slider } from "@mui/material";
import { useSvgStore } from "./hooks/useSvgStore";
import Canvas from "./components/Canvas";

const App: React.FC = () => {
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error(
          `Error attempting to enable full-screen mode: ${err.message}`,
        );
      });
    } else {
      document.exitFullscreen();
    }
  };

  const handleZoom = (delta: number) => {
    setZoom((prev) => Math.min(200, Math.max(10, prev + delta)));
  };
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
    duplicateElements,
    bringToFront,
    sendToBack,
    reorderElements,
    alignElements,
    clearCanvas,
    undo,
    redo,
    canUndo,
    canRedo,
    selectedElements,
    selectedElement,
  } = useSvgStore();

  const [gridEnabled, setGridEnabled] = useState(true);

  const [activeTool, setActiveTool] = useState("selection");
  const [zoom, setZoom] = useState(100);
  const [showLayers, setShowLayers] = useState(true);
  const [theme, setTheme] = useState<"light" | "dark">("dark");

  const handleExportSVG = () => {
    const svgElement = document.querySelector("svg");
    if (!svgElement) return;
    const svgData = new XMLSerializer().serializeToString(svgElement);
    const blob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "kinetic-sketch.svg";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const openEyeDropper = async () => {
    if (!("EyeDropper" in window)) return;
    const EyeDropper = (window as any).EyeDropper;
    const dropper = new EyeDropper();
    try {
      const result = await dropper.open();
      updateElements(selectedIds, { stroke: result.sRGBHex });
    } catch (e) {
      console.log("EyeDropper cancelled");
    }
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.setData("dragIndex", index.toString());
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    const dragIndex = parseInt(e.dataTransfer.getData("dragIndex"));
    if (dragIndex === dropIndex) return;
    reorderElements(dragIndex, dropIndex);
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

  const colors =
    theme === "dark"
      ? ["#4f8bff", "#ff7b72", "#ffffff", "#ffd33d", "#7ee787"]
      : ["#0969da", "#cf222e", "#1f2328", "#9a6700", "#1a7f37"];

  const bgMain = theme === "dark" ? "#0b0e14" : "#ffffff";
  const bgSidebar = theme === "dark" ? "#0b0e14" : "#f6f8fa";
  const borderColor =
    theme === "dark" ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.08)";
  const textColor = theme === "dark" ? "white" : "#1f2328";
  const subTextColor =
    theme === "dark" ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.5)";

  return (
    <Box
      sx={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        bgcolor: bgMain,
        color: textColor,
        overflow: "hidden",
        transition: "background-color 0.3s ease, color 0.3s ease",
      }}
    >
      {/* Top Header */}
      <Box
        sx={{
          height: 64,
          minHeight: 64,
          px: 3,
          display: "flex",
          alignItems: "center",
          borderBottom: `1px solid ${borderColor}`,
          bgcolor: bgMain,
          zIndex: 1100,
          overflow: "hidden",
          whiteSpace: "nowrap",
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mr: 4 }}>
          <span style={{ fontSize: 28, marginRight: 6 }}>🦤</span>
          <Typography
            variant="h6"
            sx={{ fontWeight: 800, letterSpacing: "-0.5px", color: "#4f8bff" }}
          >
            DODO
          </Typography>
        </Stack>

        <Typography variant="body2" sx={{ color: subTextColor, flexGrow: 1 }}>
          Untitled Project{" "}
          <Box
            component="span"
            sx={{ ml: 1, fontSize: "0.75rem", opacity: 0.6 }}
          >
            Saved 2m ago
          </Box>
        </Typography>

        <Stack direction="row" spacing={3} sx={{ mr: 4 }}>
          <Button
            variant="text"
            sx={{
              color:
                theme === "dark" ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.6)",
              textTransform: "none",
              fontWeight: 600,
            }}
          >
            Dashboard
          </Button>
          <Button
            variant="text"
            sx={{
              color: "#4f8bff",
              textTransform: "none",
              fontWeight: 700,
              position: "relative",
              "&::after": {
                content: '""',
                position: "absolute",
                bottom: -18,
                left: 0,
                right: 0,
                height: 2,
                bgcolor: "#4f8bff",
              },
            }}
          >
            Projects
          </Button>
          <Button
            variant="text"
            sx={{
              color:
                theme === "dark" ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.6)",
              textTransform: "none",
              fontWeight: 600,
            }}
          >
            Community
          </Button>
        </Stack>

        <Stack direction="row" spacing={2} alignItems="center">
          <IconButton
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            sx={{ color: subTextColor }}
          >
            {theme === "dark" ? (
              <LightModeIcon fontSize="small" />
            ) : (
              <DarkModeIcon fontSize="small" />
            )}
          </IconButton>
          <Tooltip title="Undo (Ctrl+Z)">
            <span>
              <IconButton
                onClick={undo}
                disabled={!canUndo}
                sx={{ color: subTextColor }}
              >
                <DuplicateIcon sx={{ transform: "scaleX(-1)" }} />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="Redo (Ctrl+Y)">
            <span>
              <IconButton
                onClick={redo}
                disabled={!canRedo}
                sx={{ color: subTextColor }}
              >
                <DuplicateIcon />
              </IconButton>
            </span>
          </Tooltip>
          <Button
            variant="text"
            onClick={clearCanvas}
            sx={{ color: "#ff7b72", textTransform: "none" }}
          >
            Clear
          </Button>
          <Button
            variant="contained"
            onClick={handleExportSVG}
            sx={{
              bgcolor: "#4f8bff",
              "&:hover": { bgcolor: "#3d6edb" },
              textTransform: "none",
              borderRadius: 2,
              fontWeight: 700,
              px: 3,
            }}
          >
            Export SVG
          </Button>
          <Avatar
            sx={{
              width: 32,
              height: 32,
              bgcolor:
                theme === "dark" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)",
              cursor: "pointer",
              border: `1px solid ${borderColor}`,
            }}
          />
        </Stack>
      </Box>

      <Box sx={{ flexGrow: 1, display: "flex", overflow: "hidden" }}>
        {/* Left Sidebar */}
        <Box
          sx={{
            width: 80,
            minWidth: 80,
            height: "100%",
            borderRight: `1px solid ${borderColor}`,
            py: 2,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 0.5,
            zIndex: 1100,
            bgcolor: bgSidebar,
            overflowY: "auto",
            "&::-webkit-scrollbar": { width: 0 },
          }}
        >
          {toolbarTools.map((tool) => (
            <Tooltip key={tool.id} title={tool.label} placement="right">
              <IconButton
                onClick={() => {
                  if (tool.id === "layers") setShowLayers(!showLayers);
                  if (tool.id === "grid") setGridEnabled(!gridEnabled);
                  if (tool.id !== "layers" && tool.id !== "grid")
                    setActiveTool(tool.id);
                }}
                sx={{
                  flexDirection: "column",
                  color:
                    activeTool === tool.id
                      ? "#4f8bff"
                      : theme === "dark"
                        ? "rgba(255,255,255,0.3)"
                        : "rgba(0,0,0,0.3)",
                  bgcolor:
                    activeTool === tool.id
                      ? "rgba(79, 139, 255, 0.1)"
                      : "transparent",
                  borderRadius: 2.5,
                  width: 56,
                  height: 56,
                  minHeight: 56,
                  "&:hover": {
                    bgcolor:
                      theme === "dark"
                        ? "rgba(255,255,255,0.03)"
                        : "rgba(0,0,0,0.03)",
                  },
                }}
              >
                {React.cloneElement(tool.icon as React.ReactElement<any>, {
                  sx: { fontSize: "1.2rem" },
                })}
                <Typography
                  sx={{
                    fontSize: "0.5rem",
                    mt: 0.2,
                    fontWeight: activeTool === tool.id ? 800 : 500,
                    letterSpacing: "0.5px",
                  }}
                >
                  {tool.label}
                </Typography>
              </IconButton>
            </Tooltip>
          ))}
          <Box sx={{ flexGrow: 1 }} />
          <IconButton
            sx={{
              color:
                theme === "dark" ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)",
              mb: 1,
            }}
          >
            <SettingsIcon />
          </IconButton>
          <IconButton
            sx={{
              color:
                theme === "dark" ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)",
            }}
          >
            <HelpIcon />
          </IconButton>
        </Box>

        {/* Canvas Area */}
        <Box sx={{ flexGrow: 1, position: "relative", overflow: "hidden" }}>
          <Canvas
            elements={elements}
            selectedIds={selectedIds}
            onSelect={(ids) => setSelectedIds(ids || [])}
            onAddPoint={addPoint}
            onUpdateElement={updateElement}
            onUpdateElements={updateElements}
            onAddElement={addElement}
            onRemoveElements={removeElements}
            onDuplicate={duplicateElements}
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
          />
          {selectedElements.length > 0 && (
            <Box
              sx={{
                position: "absolute",
                bottom: 30,
                left: "50%",
                transform: "translateX(-50%)",
                zIndex: 1100,
              }}
            >
              <Paper
                elevation={12}
                sx={{
                  p: 1,
                  px: 2,
                  borderRadius: 4,
                  bgcolor: theme === "dark" ? "#161b22" : "#ffffff",
                  border: `1px solid ${borderColor}`,
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                  boxShadow: "0 12px 40px rgba(0,0,0,0.2)",
                }}
              >
                {/* Alignment (only if 2+ selected) */}
                {selectedIds.length > 1 && (
                  <>
                    <Stack direction="row" spacing={0.5}>
                      <Tooltip title="Align Left">
                        <IconButton
                          size="small"
                          onClick={() => alignElements(selectedIds, "left")}
                          sx={{ color: textColor }}
                        >
                          <AlignHorizontalLeft fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Align Center">
                        <IconButton
                          size="small"
                          onClick={() => alignElements(selectedIds, "center")}
                          sx={{ color: textColor }}
                        >
                          <AlignHorizontalCenter fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Align Right">
                        <IconButton
                          size="small"
                          onClick={() => alignElements(selectedIds, "right")}
                          sx={{ color: textColor }}
                        >
                          <AlignHorizontalRight fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Divider
                        orientation="vertical"
                        flexItem
                        sx={{ mx: 0.5, bgcolor: borderColor }}
                      />
                      <Tooltip title="Align Top">
                        <IconButton
                          size="small"
                          onClick={() => alignElements(selectedIds, "top")}
                          sx={{ color: textColor }}
                        >
                          <AlignVerticalTop fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Align Middle">
                        <IconButton
                          size="small"
                          onClick={() => alignElements(selectedIds, "middle")}
                          sx={{ color: textColor }}
                        >
                          <AlignVerticalCenter fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Align Bottom">
                        <IconButton
                          size="small"
                          onClick={() => alignElements(selectedIds, "bottom")}
                          sx={{ color: textColor }}
                        >
                          <AlignVerticalBottom fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                    <Divider
                      orientation="vertical"
                      flexItem
                      sx={{ bgcolor: borderColor }}
                    />
                  </>
                )}

                {/* Stroke Width */}
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Typography
                    sx={{
                      color: textColor,
                      fontSize: "0.8rem",
                      fontWeight: 700,
                      minWidth: 20,
                    }}
                  >
                    {selectedElement ? `${selectedElement.strokeWidth}` : ""}
                  </Typography>
                  <IconButton
                    size="small"
                    onClick={() =>
                      updateElements(selectedIds, (el) => ({
                        strokeWidth: Math.max(1, (el.strokeWidth || 2) - 1),
                      }))
                    }
                    sx={{ color: textColor }}
                  >
                    <ZoomOut fontSize="inherit" />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() =>
                      updateElements(selectedIds, (el) => ({
                        strokeWidth: (el.strokeWidth || 2) + 1,
                      }))
                    }
                    sx={{ color: textColor }}
                  >
                    <ZoomIn fontSize="inherit" />
                  </IconButton>
                </Stack>
                <Divider
                  orientation="vertical"
                  flexItem
                  sx={{ bgcolor: borderColor }}
                />

                {/* Font Family (Only for Text) */}
                {selectedElement?.type === "text" && (
                  <>
                    <Stack direction="row" spacing={0.5}>
                      <Tooltip title="Modern (Inter)">
                        <IconButton
                          size="small"
                          onClick={() =>
                            updateElements(selectedIds, {
                              fontFamily: "Inter, sans-serif",
                            })
                          }
                          sx={{
                            color:
                              selectedElement.fontFamily ===
                                "Inter, sans-serif" ||
                              !selectedElement.fontFamily
                                ? "#4f8bff"
                                : textColor,
                            fontSize: "0.8rem",
                            fontWeight: 700,
                          }}
                        >
                          Aa
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Serif (Georgia)">
                        <IconButton
                          size="small"
                          onClick={() =>
                            updateElements(selectedIds, {
                              fontFamily: "Georgia, serif",
                            })
                          }
                          sx={{
                            color:
                              selectedElement.fontFamily === "Georgia, serif"
                                ? "#4f8bff"
                                : textColor,
                            fontFamily: "Georgia, serif",
                            fontSize: "0.8rem",
                          }}
                        >
                          Aa
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Hand-drawn (Comic Sans MS)">
                        <IconButton
                          size="small"
                          onClick={() =>
                            updateElements(selectedIds, {
                              fontFamily: '"Comic Sans MS", cursive',
                            })
                          }
                          sx={{
                            color:
                              selectedElement.fontFamily ===
                              '"Comic Sans MS", cursive'
                                ? "#4f8bff"
                                : textColor,
                            fontFamily: '"Comic Sans MS", cursive',
                            fontSize: "0.8rem",
                          }}
                        >
                          Aa
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Mono (Fira Code)">
                        <IconButton
                          size="small"
                          onClick={() =>
                            updateElements(selectedIds, {
                              fontFamily: '"Fira Code", monospace',
                            })
                          }
                          sx={{
                            color:
                              selectedElement.fontFamily ===
                              '"Fira Code", monospace'
                                ? "#4f8bff"
                                : textColor,
                            fontFamily: "monospace",
                            fontSize: "0.8rem",
                          }}
                        >
                          Aa
                        </IconButton>
                      </Tooltip>
                    </Stack>
                    <Divider
                      orientation="vertical"
                      flexItem
                      sx={{ bgcolor: borderColor }}
                    />
                  </>
                )}

                {/* Corner Radius (Only for Rect) */}
                {selectedElement?.type === "rect" && (
                  <>
                    <Stack
                      direction="row"
                      alignItems="center"
                      spacing={2}
                      sx={{ minWidth: 100 }}
                    >
                      <Tooltip title="Corner Radius">
                        <IconButton size="small" sx={{ color: subTextColor }}>
                          <RectIcon
                            fontSize="inherit"
                            sx={{ borderRadius: "4px" }}
                          />
                        </IconButton>
                      </Tooltip>
                      <Slider
                        size="small"
                        min={0}
                        max={50}
                        value={selectedElement?.cornerRadius || 0}
                        onChange={(_, val) =>
                          updateElements(selectedIds, {
                            cornerRadius: val as number,
                          })
                        }
                        sx={{ color: "#4f8bff" }}
                      />
                    </Stack>
                    <Divider
                      orientation="vertical"
                      flexItem
                      sx={{ bgcolor: borderColor }}
                    />
                  </>
                )}

                {/* Roughness & Bowing (Illustrator Curves) */}
                <Stack
                  direction="row"
                  alignItems="center"
                  spacing={2}
                  sx={{ minWidth: 150 }}
                >
                  <Tooltip title="Roughness / Curve">
                    <IconButton size="small" sx={{ color: subTextColor }}>
                      <PencilIcon fontSize="inherit" />
                    </IconButton>
                  </Tooltip>
                  <Stack sx={{ width: "100%" }}>
                    <Slider
                      size="small"
                      min={0}
                      max={5}
                      step={0.1}
                      value={selectedElement?.roughness ?? 1}
                      onChange={(_, val) =>
                        updateElements(selectedIds, {
                          roughness: val as number,
                        })
                      }
                      sx={{ color: "#4f8bff", mb: -1 }}
                    />
                    <Slider
                      size="small"
                      min={0}
                      max={20}
                      step={0.5}
                      value={selectedElement?.bowing ?? 1}
                      onChange={(_, val) =>
                        updateElements(selectedIds, { bowing: val as number })
                      }
                      sx={{ color: "#ffd33d" }}
                    />
                  </Stack>
                </Stack>
                <Divider
                  orientation="vertical"
                  flexItem
                  sx={{ bgcolor: borderColor }}
                />

                {/* Opacity */}
                <Stack
                  direction="row"
                  alignItems="center"
                  spacing={2}
                  sx={{ minWidth: 120 }}
                >
                  <OpacityIcon sx={{ color: subTextColor, fontSize: "1rem" }} />
                  <Slider
                    size="small"
                    value={(selectedElement?.opacity ?? 1) * 100}
                    onChange={(_, val) =>
                      updateElements(selectedIds, {
                        opacity: (val as number) / 100,
                      })
                    }
                    sx={{ color: "#4f8bff" }}
                  />
                </Stack>
                <Divider
                  orientation="vertical"
                  flexItem
                  sx={{ bgcolor: borderColor }}
                />

                {/* Stroke Style */}
                <Stack direction="row" spacing={0.5}>
                  <Tooltip title="Solid">
                    <IconButton
                      size="small"
                      onClick={() =>
                        updateElements(selectedIds, { strokeStyle: "solid" })
                      }
                      sx={{
                        color:
                          selectedElement?.strokeStyle === "solid"
                            ? "#4f8bff"
                            : textColor,
                      }}
                    >
                      <Box
                        sx={{ width: 16, height: 2, bgcolor: "currentColor" }}
                      />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Dashed">
                    <IconButton
                      size="small"
                      onClick={() =>
                        updateElements(selectedIds, { strokeStyle: "dashed" })
                      }
                      sx={{
                        color:
                          selectedElement?.strokeStyle === "dashed"
                            ? "#4f8bff"
                            : textColor,
                      }}
                    >
                      <Box
                        sx={{
                          width: 16,
                          height: 2,
                          border: "1px dashed currentColor",
                        }}
                      />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Dotted">
                    <IconButton
                      size="small"
                      onClick={() =>
                        updateElements(selectedIds, { strokeStyle: "dotted" })
                      }
                      sx={{
                        color:
                          selectedElement?.strokeStyle === "dotted"
                            ? "#4f8bff"
                            : textColor,
                      }}
                    >
                      <Box
                        sx={{
                          width: 16,
                          height: 2,
                          border: "1px dotted currentColor",
                        }}
                      />
                    </IconButton>
                  </Tooltip>
                </Stack>
                <Divider
                  orientation="vertical"
                  flexItem
                  sx={{ bgcolor: borderColor }}
                />

                {/* Color */}
                <Stack direction="row" spacing={0.5} alignItems="center">
                  {colors.map((color) => (
                    <Box
                      key={color}
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 0.5,
                      }}
                    >
                      <Box
                        onClick={() =>
                          updateElements(selectedIds, { stroke: color })
                        }
                        sx={{
                          width: 16,
                          height: 16,
                          borderRadius: "50%",
                          bgcolor: color,
                          cursor: "pointer",
                          border: selectedElements.some(
                            (el) => el.stroke === color,
                          )
                            ? "2px solid white"
                            : "none",
                          "&:hover": { transform: "scale(1.2)" },
                          transition: "0.2s",
                        }}
                      />
                      <Box
                        onClick={() =>
                          updateElements(selectedIds, { fill: color })
                        }
                        sx={{
                          width: 16,
                          height: 8,
                          borderRadius: "2px",
                          bgcolor: color,
                          opacity: selectedElements.some(
                            (el) => el.fill === color,
                          )
                            ? 1
                            : 0.3,
                          cursor: "pointer",
                          "&:hover": { opacity: 0.8 },
                          transition: "0.2s",
                        }}
                      />
                    </Box>
                  ))}
                  <Divider
                    orientation="vertical"
                    flexItem
                    sx={{ mx: 0.5, bgcolor: borderColor }}
                  />
                  <Tooltip title="No Fill">
                    <IconButton
                      size="small"
                      onClick={() =>
                        updateElements(selectedIds, { fill: "transparent" })
                      }
                      sx={{ color: textColor }}
                    >
                      <OpacityIcon fontSize="small" sx={{ opacity: 0.5 }} />
                    </IconButton>
                  </Tooltip>
                  <Divider
                    orientation="vertical"
                    flexItem
                    sx={{ mx: 0.5, bgcolor: borderColor }}
                  />
                  {"EyeDropper" in window && (
                    <Tooltip title="Eye Dropper">
                      <IconButton
                        size="small"
                        onClick={openEyeDropper}
                        sx={{ color: textColor }}
                      >
                        <ColorizeIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                  <Tooltip title="Custom Stroke/Fill">
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 0.5,
                      }}
                    >
                      <input
                        type="color"
                        value={selectedElement?.stroke || "#4f8bff"}
                        onChange={(e) =>
                          updateElements(selectedIds, {
                            stroke: e.target.value,
                          })
                        }
                        style={{
                          width: 24,
                          height: 12,
                          border: "none",
                          background: "transparent",
                          cursor: "pointer",
                          padding: 0,
                        }}
                      />
                      <input
                        type="color"
                        value={
                          selectedElement?.fill &&
                          selectedElement.fill !== "transparent"
                            ? selectedElement.fill
                            : "#4f8bff"
                        }
                        onChange={(e) =>
                          updateElements(selectedIds, { fill: e.target.value })
                        }
                        style={{
                          width: 24,
                          height: 12,
                          border: "none",
                          background: "transparent",
                          cursor: "pointer",
                          padding: 0,
                          opacity:
                            selectedElement?.fill === "transparent" ? 0.3 : 1,
                        }}
                      />
                    </Box>
                  </Tooltip>
                </Stack>
                <Divider
                  orientation="vertical"
                  flexItem
                  sx={{ bgcolor: borderColor }}
                />

                {/* Actions */}
                <Stack direction="row" spacing={0.5}>
                  <Tooltip title="Bring to Front">
                    <IconButton
                      size="small"
                      onClick={() => bringToFront(selectedIds)}
                      sx={{ color: textColor }}
                    >
                      <FlipToFront fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Send to Back">
                    <IconButton
                      size="small"
                      onClick={() => sendToBack(selectedIds)}
                      sx={{ color: textColor }}
                    >
                      <FlipToBack fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Duplicate">
                    <IconButton
                      size="small"
                      onClick={() => duplicateElements(selectedIds)}
                      sx={{ color: textColor }}
                    >
                      <DuplicateIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete">
                    <IconButton
                      size="small"
                      onClick={() => removeElements(selectedIds)}
                      sx={{ color: "#ff7b72" }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Stack>
              </Paper>
            </Box>
          )}
          {/* Bottom Right Controls */}
          <Box
            sx={{
              position: "absolute",
              bottom: 30,
              right: 30,
              display: "flex",
              flexDirection: "column",
              gap: 2,
              zIndex: 1100,
            }}
          >
            <Paper
              sx={{
                display: "flex",
                alignItems: "center",
                bgcolor: theme === "dark" ? "#161b22" : "#ffffff",
                borderRadius: 2,
                p: 0.5,
                border: `1px solid ${borderColor}`,
              }}
            >
              <IconButton
                size="small"
                onClick={() => handleZoom(-10)}
                sx={{
                  color: subTextColor,
                  "&:hover": {
                    bgcolor:
                      theme === "dark"
                        ? "rgba(255,255,255,0.1)"
                        : "rgba(0,0,0,0.05)",
                  },
                }}
              >
                <ZoomOut fontSize="small" />
              </IconButton>
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 700,
                  minWidth: 40,
                  textAlign: "center",
                  color: textColor,
                }}
              >
                {zoom}%
              </Typography>
              <IconButton
                size="small"
                onClick={() => handleZoom(10)}
                sx={{
                  color: subTextColor,
                  "&:hover": {
                    bgcolor:
                      theme === "dark"
                        ? "rgba(255,255,255,0.1)"
                        : "rgba(0,0,0,0.05)",
                  },
                }}
              >
                <ZoomIn fontSize="small" />
              </IconButton>
            </Paper>

            <IconButton
              onClick={toggleFullscreen}
              sx={{
                bgcolor: theme === "dark" ? "rgba(22, 27, 34, 0.8)" : "#ffffff",
                backdropFilter: "blur(10px)",
                border: `1px solid ${borderColor}`,
                color: textColor,
                "&:hover": {
                  bgcolor:
                    theme === "dark"
                      ? "rgba(79, 139, 255, 0.2)"
                      : "rgba(0,0,0,0.05)",
                  borderColor: "#4f8bff",
                },
              }}
            >
              <Fullscreen />
            </IconButton>
          </Box>
        </Box>

        {/* Right Layers Panel */}
        {showLayers && (
          <Box
            sx={{
              width: 300,
              borderLeft: `1px solid ${borderColor}`,
              bgcolor: bgSidebar,
              p: 2.5,
              display: "flex",
              flexDirection: "column",
              zIndex: 1100,
            }}
          >
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              sx={{ mb: 3 }}
            >
              <Typography
                variant="subtitle2"
                sx={{ fontWeight: 800, letterSpacing: "0.5px" }}
              >
                Layers
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: "#4f8bff",
                  cursor: "pointer",
                  fontWeight: 800,
                  letterSpacing: "0.5px",
                }}
              >
                NEW LAYER
              </Typography>
            </Stack>
            <Stack
              spacing={1}
              sx={{
                overflowY: "auto",
                flexGrow: 1,
                "&::-webkit-scrollbar": { width: 4 },
                "&::-webkit-scrollbar-thumb": {
                  bgcolor: borderColor,
                  borderRadius: 2,
                },
              }}
            >
              {elements.length === 0 && (
                <Typography
                  sx={{
                    color: subTextColor,
                    fontSize: "0.8rem",
                    textAlign: "center",
                    mt: 4,
                  }}
                >
                  No elements yet
                </Typography>
              )}
              {elements
                .slice()
                .reverse()
                .map((el, i) => {
                  const actualIndex = elements.length - 1 - i;
                  return (
                    <Paper
                      key={el.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, actualIndex)}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => handleDrop(e, actualIndex)}
                      onClick={() => setSelectedIds([el.id])}
                      sx={{
                        p: 1.5,
                        display: "flex",
                        alignItems: "center",
                        bgcolor: selectedIds.includes(el.id)
                          ? "rgba(79, 139, 255, 0.08)"
                          : "transparent",
                        border: "1px solid",
                        borderColor: selectedIds.includes(el.id)
                          ? "#4f8bff"
                          : borderColor,
                        cursor: "grab",
                        borderRadius: 2,
                        "&:hover": {
                          bgcolor:
                            theme === "dark"
                              ? "rgba(255,255,255,0.02)"
                              : "rgba(0,0,0,0.02)",
                        },
                        "&:active": { cursor: "grabbing" },
                      }}
                    >
                      <Box
                        sx={{
                          width: 14,
                          height: 14,
                          border: `1.5px solid ${textColor}`,
                          mr: 2,
                          borderRadius: 0.5,
                          opacity: 0.6,
                        }}
                      />
                      <Typography
                        variant="body2"
                        sx={{
                          flexGrow: 1,
                          color: el.visible ? textColor : subTextColor,
                          fontWeight: selectedIds.includes(el.id) ? 700 : 400,
                          fontSize: "0.85rem",
                        }}
                      >
                        {el.name}
                      </Typography>
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleVisibility(el.id);
                        }}
                        sx={{ color: subTextColor, mr: 0.5 }}
                      >
                        {el.visible ? (
                          <VisibleIcon fontSize="inherit" />
                        ) : (
                          <HiddenIcon fontSize="inherit" />
                        )}
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeElements([el.id]);
                        }}
                        sx={{
                          color: "#ff7b72",
                          opacity: 0.6,
                          "&:hover": { opacity: 1 },
                        }}
                      >
                        <DeleteIcon fontSize="inherit" />
                      </IconButton>
                    </Paper>
                  );
                })}
            </Stack>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default App;
