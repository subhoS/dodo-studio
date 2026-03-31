import React, { useRef } from "react";
import {
  Box,
  Typography,
  Stack,
  IconButton,
  Tooltip,
  Divider,
  Paper,
} from "@mui/material";
import * as Icons from "lucide-react";
import type { SvgElement } from "../types/svg";
import { 
  TransformSection, 
  TypographySection, 
  AppearanceSection, 
  EffectsSection, 
  ArrangementSection 
} from "./InspectorSections.tsx";

interface PropertyBarProps {
  element: SvgElement;
  onUpdate: (id: string, updates: Partial<SvgElement>) => void;
  onRemove: (id: string) => void;
  onBringToFront: (id: string) => void;
  onSendToBack: (id: string) => void;
  onDuplicate: (id: string) => void;
  onAlign: (id: string, alignment: "left" | "center" | "right" | "top" | "v-center" | "bottom") => void;
  selectedIds?: string[];
  onMultiUpdate?: (ids: string[], updates: Partial<SvgElement>) => void;
  onBooleanOp?: (ids: string[], type: "union" | "intersect" | "exclude") => void;
  theme: "light" | "dark";
}

const SafeIcon = ({ name, size = 18 }: { name: string; size?: number }) => {
  const IconComponent = (Icons as any)[name] || Icons.HelpCircle;
  return <IconComponent size={size} />;
};

const PropertyBar: React.FC<PropertyBarProps> = React.memo(({
  element,
  onUpdate,
  onRemove,
  onBringToFront,
  onSendToBack,
  onDuplicate,
  onAlign,
  selectedIds = [],
  onMultiUpdate,
  onBooleanOp,
  theme,
}) => {
  if (!element && selectedIds.length === 0) return null;
  if (!element && selectedIds.length > 0) return null; 

  const colorInputRef = useRef<HTMLInputElement>(null);
  const borderColor = theme === "dark" ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.12)";
  const bgColor = theme === "dark" ? "rgba(22, 27, 34, 0.98)" : "rgba(255, 255, 255, 0.98)";
  const textColor = theme === "dark" ? "#ffffff" : "#000000";

  const colors = ["#ffffff", "#22d3ee", "#ff2e63", "#38bdf8", "#fbbf24", "#4ade80", "#a78bfa"];

  const handleUpdate = (updates: Partial<SvgElement>) => {
    if (selectedIds.length > 1 && onMultiUpdate) {
      onMultiUpdate(selectedIds, updates);
    } else {
      onUpdate(element.id, updates);
    }
  };

  const typeIconName =
    element.type === "rect" ? "Square"
    : element.type === "circle" ? "Circle"
    : element.type === "pencil" ? "Pencil"
    : element.type === "text" ? "Type"
    : element.type === "line" ? "Minus"
    : element.type === "arrow" ? "ArrowRight"
    : element.type === "image" ? "Image"
    : element.type === "svg" ? "FileCode"
    : "Square";

  return (
    <Paper
      elevation={24}
      sx={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "stretch",
        p: 1.5,
        gap: 2,
        borderRadius: "24px",
        border: `1px solid ${borderColor}`,
        bgcolor: bgColor,
        color: textColor,
        backdropFilter: "blur(40px)",
        boxShadow: "0 25px 60px rgba(0,0,0,0.6)",
        maxWidth: "calc(100vw - 80px)",
        maxHeight: "350px",
        overflowY: "auto",
        scrollbarWidth: "none",
        "&::-webkit-scrollbar": { display: "none" },
      }}
    >
      {/* 1. Header & Quick Info */}
      <Stack direction="row" alignItems="center" sx={{ color: "#22d3ee", gap: 1, flexShrink: 0, minWidth: 80 }}>
        <SafeIcon name={typeIconName} size={16} />
        <Typography className="heading-font" sx={{ fontSize: "0.75rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: 2 }}>
          {element.type}
        </Typography>
      </Stack>

      <Divider orientation="vertical" flexItem />

      {/* 2. Logical Sections */}
      <TransformSection 
        element={element} handleUpdate={handleUpdate} 
        borderColor={borderColor} textColor={textColor} theme={theme} 
      />

      <Divider orientation="vertical" flexItem />

      {element.type === "text" && (
        <>
          <TypographySection 
            element={element} handleUpdate={handleUpdate} 
            textColor={textColor} theme={theme} 
          />
          <Divider orientation="vertical" flexItem />
        </>
      )}

      {element.type !== "image" && element.type !== "svg" && (
        <>
          <AppearanceSection 
            element={element} handleUpdate={handleUpdate} 
            colors={colors} colorInputRef={colorInputRef} 
          />
          <Divider orientation="vertical" flexItem />
        </>
      )}

      <EffectsSection 
        element={element} handleUpdate={handleUpdate} 
      />

      <Divider orientation="vertical" flexItem />

      <ArrangementSection 
        element={element} onBringToFront={onBringToFront} 
        onSendToBack={onSendToBack} onDuplicate={onDuplicate} 
        onRemove={onRemove} 
      />

      {/* 3. Batch Boolean & Alignment Operations (Special logic) */}
      {selectedIds.length > 1 && (
        <>
          <Divider orientation="vertical" flexItem />
          <Box sx={{ flexShrink: 0 }}>
             <Typography sx={{ fontSize: "0.55rem", fontWeight: 900, opacity: 0.4, mb: 0.5, textTransform: "uppercase" }}>Batch Actions</Typography>
             <Stack direction="row" spacing={1} alignItems="center">
                {onBooleanOp && (
                  <Stack direction="row" spacing={0.5}>
                    <Tooltip title="Union"><IconButton size="small" onClick={() => onBooleanOp(selectedIds, "union")} sx={{ color: "#22d3ee", p: 0.4 }}><SafeIcon name="Combine" size={16} /></IconButton></Tooltip>
                    <Tooltip title="Intersect"><IconButton size="small" onClick={() => onBooleanOp(selectedIds, "intersect")} sx={{ color: "#22d3ee", p: 0.4 }}><SafeIcon name="Intersect" size={16} /></IconButton></Tooltip>
                    <Tooltip title="Exclude"><IconButton size="small" onClick={() => onBooleanOp(selectedIds, "exclude")} sx={{ color: "#22d3ee", p: 0.4 }}><SafeIcon name="Ungroup" size={16} /></IconButton></Tooltip>
                  </Stack>
                )}
                <Divider orientation="vertical" flexItem sx={{ height: 20 }} />
                <Stack direction="row" spacing={0.25}>
                  {["left", "center", "right", "top", "v-center", "bottom"].map((align) => (
                    <Tooltip key={align} title={`Align ${align}`}>
                      <IconButton size="small" onClick={() => onAlign(element.id, align as any)} sx={{ color: "inherit", p: 0.4 }}>
                        <SafeIcon 
                          name={align === "left" ? "AlignLeft" : align === "center" ? "AlignCenter" : align === "right" ? "AlignRight" : align === "top" ? "AlignStartVertical" : align === "v-center" ? "AlignCenterVertical" : "AlignEndVertical"} 
                          size={14} 
                        />
                      </IconButton>
                    </Tooltip>
                  ))}
                </Stack>
             </Stack>
          </Box>
        </>
      )}

    </Paper>
  );
});

export default PropertyBar;
