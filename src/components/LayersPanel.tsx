import React, { useState, useRef } from "react";
import {
  Box, Typography, IconButton, Tooltip, Stack, Divider,
} from "@mui/material";
import {
  Eye, EyeOff, Lock, Unlock, Copy, Trash2, X, Search,
  Square, Circle, Pencil, Type, Minus, ArrowRight, GripVertical,
  ChevronUp, ChevronDown, CheckSquare, Layers,
} from "lucide-react";
import type { SvgElement } from "../types/svg";

interface LayersPanelProps {
  elements: SvgElement[];
  selectedIds: string[];
  onSelect: (ids: string[]) => void;
  onToggleVisibility: (id: string) => void;
  onToggleLock: (id: string) => void;
  onRemoveElements: (ids: string[]) => void;
  onDuplicate: (ids: string[]) => void;
  onReorder: (fromIdx: number, toIdx: number) => void;
  onBringToFront: (ids: string[]) => void;
  onSendToBack: (ids: string[]) => void;
  onClose: () => void;
  onRename: (id: string, name: string) => void;
  theme: "light" | "dark";
}

const TYPE_ICONS: Record<string, React.ReactNode> = {
  rect:   <Square   size={13} />,
  circle: <Circle   size={13} />,
  pencil: <Pencil   size={13} />,
  text:   <Type     size={13} />,
  line:   <Minus    size={13} />,
  arrow:  <ArrowRight size={13} />,
  path:   <Pencil   size={13} />,
};

const LayersPanel: React.FC<LayersPanelProps> = ({
  elements,
  selectedIds,
  onSelect,
  onToggleVisibility,
  onToggleLock,
  onRemoveElements,
  onDuplicate,
  onReorder,
  onBringToFront,
  onSendToBack,
  onClose,
  onRename,
  theme,
}) => {
  const [search, setSearch]         = useState("");
  const [hoveredId, setHoveredId]   = useState<string | null>(null);
  const [editingId, setEditingId]   = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
  const [lastSelectedId, setLastSelectedId] = useState<string | null>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  const dark   = theme === "dark";
  const bg     = dark ? "rgba(11,14,20,0.97)"    : "rgba(255,255,255,0.97)";
  const rowBg  = dark ? "rgba(255,255,255,0.04)"  : "rgba(0,0,0,0.03)";
  const selBg  = dark ? "rgba(79,139,255,0.15)"   : "rgba(79,139,255,0.08)";
  const border = dark ? "rgba(255,255,255,0.10)"  : "rgba(0,0,0,0.10)";
  const txt    = dark ? "#ffffff"                  : "#000000";
  const sub    = dark ? "rgba(255,255,255,0.55)"   : "rgba(0,0,0,0.45)";

  // Reversed list: top of panel = front of canvas
  const reversed = [...elements].reverse();
  const filtered = search.trim()
    ? reversed.filter(el => el.name.toLowerCase().includes(search.trim().toLowerCase()))
    : reversed;

  const handleRowClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const isCmd = e.metaKey || e.ctrlKey;
    const isShift = e.shiftKey;

    if (isShift && lastSelectedId && filtered.length > 0) {
      const idx1 = filtered.findIndex(el => el.id === lastSelectedId);
      const idx2 = filtered.findIndex(el => el.id === id);
      if (idx1 !== -1 && idx2 !== -1) {
        const start = Math.min(idx1, idx2);
        const end = Math.max(idx1, idx2);
        const range = filtered.slice(start, end + 1).map(el => el.id);
        // Combine with existing if CMD is also held, else replace
        onSelect(isCmd ? Array.from(new Set([...selectedIds, ...range])) : range);
        setLastSelectedId(id);
        return;
      }
    }

    if (isCmd) {
      onSelect(
        selectedIds.includes(id)
          ? selectedIds.filter(sid => sid !== id)
          : [...selectedIds, id]
      );
    } else {
      onSelect([id]);
    }
    setLastSelectedId(id);
  };

  const startRename = (el: SvgElement) => {
    setEditingId(el.id);
    setEditingName(el.name);
    setTimeout(() => nameInputRef.current?.select(), 30);
  };

  const commitRename = () => {
    if (editingId && editingName.trim()) {
      onRename(editingId, editingName.trim());
    }
    setEditingId(null);
  };

  const selectAll = () => {
    const visibleUnlocked = elements.filter(el => el.visible && !el.locked);
    onSelect(visibleUnlocked.map(el => el.id));
  };

  const handleDragStart = (idx: number) => setDraggedIdx(idx);
  const handleDragOver  = (e: React.DragEvent, idx: number) => { e.preventDefault(); setDragOverIdx(idx); };
  const handleDrop      = (tgtDisplayIdx: number) => {
    if (draggedIdx === null || draggedIdx === tgtDisplayIdx) { setDraggedIdx(null); setDragOverIdx(null); return; }
    // Convert display indices back to real indices (reversed display)
    const fromReal = elements.length - 1 - draggedIdx;
    const toReal   = elements.length - 1 - tgtDisplayIdx;
    onReorder(fromReal, toReal);
    setDraggedIdx(null);
    setDragOverIdx(null);
  };

  return (
    <Box sx={{
      width: { xs: 240, md: 280 },
      maxHeight: "calc(100vh - 180px)",
      borderRadius: "16px",
      border: `1px solid ${border}`,
      bgcolor: bg,
      backdropFilter: "blur(30px)",
      boxShadow: "0 24px 60px rgba(0,0,0,0.5)",
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
      color: txt,
    }}>
      {/* ── Header ── */}
      <Box sx={{ px: 2, pt: 2, pb: 1.5, borderBottom: `1px solid ${border}` }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1.5}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Layers size={16} color="#4f8bff" />
            <Typography sx={{ fontWeight: 900, fontSize: "0.82rem", letterSpacing: "0.6px", textTransform: "uppercase" }}>
              Layers
            </Typography>
            <Box sx={{ bgcolor: "#4f8bff", color: "#fff", borderRadius: "10px", px: 0.75, py: 0.1, fontSize: "0.65rem", fontWeight: 900, lineHeight: 1.6 }}>
              {elements.length}
            </Box>
          </Stack>
          <Stack direction="row" spacing={0.5}>
            <Tooltip title="Select All Visible"><IconButton size="small" onClick={selectAll} sx={{ color: sub, p: 0.5, "&:hover": { color: "#4f8bff" } }}><CheckSquare size={14} /></IconButton></Tooltip>
            <Tooltip title="Close panel"><IconButton size="small" onClick={onClose} sx={{ color: sub, p: 0.5, "&:hover": { color: txt } }}><X size={14} /></IconButton></Tooltip>
          </Stack>
        </Stack>

        {/* Search */}
        <Box sx={{ position: "relative" }}>
          <Search size={13} style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", color: sub, pointerEvents: "none" }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search layers…"
            style={{
              width: "100%",
              boxSizing: "border-box",
              paddingLeft: 28,
              paddingRight: 8,
              paddingTop: 6,
              paddingBottom: 6,
              background: dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)",
              border: `1px solid ${border}`,
              borderRadius: 8,
              color: txt,
              fontSize: "0.78rem",
              outline: "none",
              fontFamily: "Inter, sans-serif",
            }}
          />
        </Box>

        {/* Quick actions for multi-selection */}
        {selectedIds.length > 1 && (
          <Stack direction="row" spacing={0.5} mt={1}>
            <Tooltip title="Bring to Front"><IconButton size="small" onClick={() => onBringToFront(selectedIds)} sx={{ color: sub, p: 0.5, "&:hover": { color: "#4f8bff" } }}><ChevronUp size={13} /></IconButton></Tooltip>
            <Tooltip title="Send to Back"><IconButton size="small" onClick={() => onSendToBack(selectedIds)} sx={{ color: sub, p: 0.5, "&:hover": { color: "#4f8bff" } }}><ChevronDown size={13} /></IconButton></Tooltip>
            <Tooltip title="Duplicate selection"><IconButton size="small" onClick={() => onDuplicate(selectedIds)} sx={{ color: sub, p: 0.5, "&:hover": { color: "#4f8bff" } }}><Copy size={13} /></IconButton></Tooltip>
            <Tooltip title="Delete selection"><IconButton size="small" onClick={() => onRemoveElements(selectedIds)} sx={{ color: "#ff4d4d", p: 0.5, "&:hover": { bgcolor: "rgba(255,77,77,0.1)" } }}><Trash2 size={13} /></IconButton></Tooltip>
            <Typography sx={{ fontSize: "0.7rem", color: sub, ml: "auto !important", alignSelf: "center" }}>{selectedIds.length} selected</Typography>
          </Stack>
        )}
      </Box>

      {/* ── Layer list ── */}
      <Box sx={{ flexGrow: 1, overflowY: "auto", py: 0.5,
        "&::-webkit-scrollbar": { width: "4px" },
        "&::-webkit-scrollbar-thumb": { bgcolor: "rgba(79,139,255,0.3)", borderRadius: "4px" },
      }}>
        {filtered.length === 0 && (
          <Box sx={{ py: 6, display: "flex", flexDirection: "column", alignItems: "center", gap: 1, opacity: 0.4 }}>
            <Layers size={32} />
            <Typography sx={{ fontSize: "0.78rem", fontWeight: 700 }}>{search ? "No layers match" : "Canvas is empty"}</Typography>
            <Typography sx={{ fontSize: "0.68rem" }}>{search ? "Try a different search" : "Draw something to get started"}</Typography>
          </Box>
        )}

        {filtered.map((el, dispIdx) => {
          const isSel    = selectedIds.includes(el.id);
          const isHov    = hoveredId === el.id;
          const isDraggedThis = draggedIdx === dispIdx;
          const isDragTarget  = dragOverIdx === dispIdx && draggedIdx !== dispIdx;
          const opacity = el.visible ? 1 : 0.4;

          return (
            <Box
              key={el.id}
              draggable
              onDragStart={() => handleDragStart(dispIdx)}
              onDragOver={e => handleDragOver(e, dispIdx)}
              onDrop={() => handleDrop(dispIdx)}
              onDragEnd={() => { setDraggedIdx(null); setDragOverIdx(null); }}
              onMouseEnter={() => setHoveredId(el.id)}
              onMouseLeave={() => setHoveredId(null)}
              onClick={e => handleRowClick(e, el.id)}
              sx={{
                mx: 0.5,
                mb: 0.25,
                px: 1,
                py: 0.75,
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
                gap: 0.75,
                cursor: el.locked ? "default" : "pointer",
                bgcolor: isSel ? selBg : isHov ? rowBg : "transparent",
                border: isDragTarget ? "1.5px dashed #4f8bff" : isDraggedThis ? "1.5px dashed rgba(79,139,255,0.4)" : "1.5px solid transparent",
                opacity: isDraggedThis ? 0.5 : 1,
                transition: "background 0.12s, border 0.12s",
                userSelect: "none",
                pl: el.parentId ? 4 : 1,
              }}
            >
              {/* Drag handle */}
              <Box sx={{ color: sub, opacity: isHov ? 0.7 : 0, transition: "opacity 0.15s", flexShrink: 0, cursor: "grab" }}>
                <GripVertical size={12} />
              </Box>

              {/* Type icon */}
              <Box sx={{ color: isSel ? "#4f8bff" : sub, flexShrink: 0, opacity }}>
                {TYPE_ICONS[el.type] || <Square size={13} />}
              </Box>

              {/* Color swatch */}
              <Box sx={{
                width: 10, height: 10, borderRadius: "50%", flexShrink: 0,
                bgcolor: el.stroke, border: `1px solid ${border}`, opacity,
              }} />

              {/* Name (editable on double-click) */}
              <Box sx={{ flexGrow: 1, minWidth: 0, opacity }} onDoubleClick={e => { e.stopPropagation(); startRename(el); }}>
                {editingId === el.id ? (
                  <input
                    ref={nameInputRef}
                    value={editingName}
                    autoFocus
                    onChange={e => setEditingName(e.target.value)}
                    onBlur={commitRename}
                    onKeyDown={e => { if (e.key === "Enter" || e.key === "Escape") { e.preventDefault(); commitRename(); } }}
                    onClick={e => e.stopPropagation()}
                    style={{
                      width: "100%",
                      background: dark ? "rgba(79,139,255,0.15)" : "rgba(79,139,255,0.08)",
                      border: "1px solid #4f8bff",
                      borderRadius: 4,
                      color: txt,
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      padding: "1px 4px",
                      outline: "none",
                      fontFamily: "Inter, sans-serif",
                    }}
                  />
                ) : (
                  <Typography noWrap sx={{
                    fontSize: "0.75rem",
                    fontWeight: isSel ? 800 : 600,
                    color: isSel ? "#4f8bff" : txt,
                    lineHeight: 1.4,
                  }}>
                    {el.name}
                  </Typography>
                )}
              </Box>

              {/* Opacity badge (only if not 100%) */}
              {(el.opacity !== undefined && el.opacity < 1) && (
                <Typography sx={{ fontSize: "0.6rem", color: sub, flexShrink: 0, fontWeight: 700, opacity }}>
                  {Math.round((el.opacity) * 100)}%
                </Typography>
              )}

              {/* Hover action buttons  */}
              {(isHov || isSel) && !isDraggedThis && (
                <Stack direction="row" spacing={0} sx={{ flexShrink: 0 }}>
                  <Tooltip title="Duplicate">
                    <IconButton size="small" onClick={e => { e.stopPropagation(); onDuplicate([el.id]); }}
                      sx={{ p: 0.4, color: sub, "&:hover": { color: "#4f8bff" } }}>
                      <Copy size={11} />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete">
                    <IconButton size="small" onClick={e => { e.stopPropagation(); onRemoveElements([el.id]); }}
                      sx={{ p: 0.4, color: sub, "&:hover": { color: "#ff4d4d" } }}>
                      <Trash2 size={11} />
                    </IconButton>
                  </Tooltip>
                </Stack>
              )}

              {/* Visibility toggle */}
              <Tooltip title={el.visible ? "Hide layer" : "Show layer"}>
                <IconButton size="small" onClick={e => { e.stopPropagation(); onToggleVisibility(el.id); }}
                  sx={{ p: 0.4, color: el.visible ? (isSel ? "#4f8bff" : sub) : "#ff7b72", "&:hover": { color: "#4f8bff" }, flexShrink: 0 }}>
                  {el.visible ? <Eye size={13} /> : <EyeOff size={13} />}
                </IconButton>
              </Tooltip>

              {/* Lock toggle */}
              <Tooltip title={el.locked ? "Unlock layer" : "Lock layer"}>
                <IconButton size="small" onClick={e => { e.stopPropagation(); onToggleLock(el.id); }}
                  sx={{ p: 0.4, color: el.locked ? "#ffd33d" : sub, "&:hover": { color: "#ffd33d" }, flexShrink: 0 }}>
                  {el.locked ? <Lock size={13} /> : <Unlock size={13} />}
                </IconButton>
              </Tooltip>
            </Box>
          );
        })}
      </Box>

      {/* ── Footer ── */}
      <Divider sx={{ borderColor: border }} />
      <Box sx={{ px: 2, py: 1, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Typography sx={{ fontSize: "0.68rem", color: sub }}>
          {elements.filter(el => !el.visible).length > 0
            ? `${elements.filter(el => !el.visible).length} hidden`
            : "All visible"}
        </Typography>
        <Typography sx={{ fontSize: "0.68rem", color: sub }}>
          {elements.filter(el => el.locked).length > 0
            ? `${elements.filter(el => el.locked).length} locked`
            : ""}
        </Typography>
        <Stack direction="row" spacing={0.5}>
          <Tooltip title="Bring selection forward">
            <IconButton size="small" disabled={selectedIds.length === 0} onClick={() => onBringToFront(selectedIds)} sx={{ p: 0.5, color: sub, "&:hover": { color: "#4f8bff" } }}>
              <ChevronUp size={14} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Send selection backward">
            <IconButton size="small" disabled={selectedIds.length === 0} onClick={() => onSendToBack(selectedIds)} sx={{ p: 0.5, color: sub, "&:hover": { color: "#4f8bff" } }}>
              <ChevronDown size={14} />
            </IconButton>
          </Tooltip>
        </Stack>
      </Box>
    </Box>
  );
};

export default LayersPanel;
