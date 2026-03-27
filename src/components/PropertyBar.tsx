import React, { useRef } from "react";
import {
  Box,
  Typography,
  Slider,
  Stack,
  IconButton,
  Tooltip,
  Divider,
  Paper,
} from "@mui/material";
import * as Icons from "lucide-react";
import type { SvgElement } from "../types/svg";

interface PropertyBarProps {
  element: SvgElement;
  onUpdate: (id: string, updates: Partial<SvgElement>) => void;
  onRemove: (id: string) => void;
  onBringToFront: (id: string) => void;
  onSendToBack: (id: string) => void;
  onDuplicate: (id: string) => void;
  onAlign: (id: string, alignment: "left" | "center" | "right" | "top" | "v-center" | "bottom") => void;
  theme: "light" | "dark";
}

const SafeIcon = ({ name, size = 18, color = "inherit" }: { name: string; size?: number; color?: string }) => {
  const IconComponent = (Icons as any)[name] || Icons.HelpCircle;
  return <IconComponent size={size} color={color} />;
};

const PropertyBar: React.FC<PropertyBarProps> = ({
  element,
  onUpdate,
  onRemove,
  onBringToFront,
  onSendToBack,
  onDuplicate,
  onAlign,
  theme,
}) => {
  const colorInputRef = useRef<HTMLInputElement>(null);
  const borderColor = theme === "dark" ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.12)";
  const bgColor = theme === "dark" ? "rgba(22, 27, 34, 0.98)" : "rgba(255, 255, 255, 0.98)";

  const colors = ["#f6f8fa", "#4f8bff", "#ff7b72", "#79c0ff", "#d29922", "#3fb950", "#a5d6ff"];

  const handleUpdate = (updates: Partial<SvgElement>) => onUpdate(element.id, updates);

  const handleEyeDropper = async () => {
    if (!(window as any).EyeDropper) {
      alert("EyeDropper API not supported in this browser.");
      return;
    }
    const dropper = new (window as any).EyeDropper();
    try {
      const result = await dropper.open();
      handleUpdate({ stroke: result.sRGBHex, fill: element.fill !== "transparent" ? result.sRGBHex : "transparent" });
    } catch (e) {}
  };

  const currentIconName = element.type === "rect" ? "Square" : element.type === "circle" ? "Circle" : element.type === "pencil" ? "Pencil" : element.type === "text" ? "Type" : "Square";

  return (
    <Paper
      elevation={24}
      sx={{
        display: "flex",
        alignItems: "center",
        p: 1.5,
        px: 2.5,
        gap: 2.5,
        borderRadius: "24px",
        border: `1px solid ${borderColor}`,
        bgcolor: bgColor,
        backdropFilter: "blur(30px)",
        boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
      }}
    >
      <Stack direction="row" spacing={1} alignItems="center">
        <Box sx={{ color: "#4f8bff", display: "flex", alignItems: "center", gap: 1.5, mr: 1 }}>
          <SafeIcon name={currentIconName} size={16} />
          <Typography sx={{ fontSize: "0.80rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: 1.5 }}>
            {element.type}
          </Typography>
        </Box>
        <Divider orientation="vertical" flexItem />
      </Stack>

      <Stack direction="row" spacing={1} alignItems="center">
        <Stack direction="row" spacing={0.5}>
          {colors.map((c) => (
            <Box key={c} onClick={() => handleUpdate({ stroke: c, fill: element.fill !== "transparent" ? c : "transparent" })} sx={{ width: 24, height: 24, borderRadius: "50%", bgcolor: c, cursor: "pointer", border: element.stroke === c ? "2px solid #4f8bff" : "2px solid transparent", boxSizing: "border-box", transition: "all 0.1s", "&:hover": { transform: "scale(1.2)" } }} />
          ))}
          <Tooltip title="Custom Color">
            <IconButton size="small" onClick={() => colorInputRef.current?.click()} sx={{ color: "inherit", opacity: 0.7 }}><SafeIcon name="Palette" size={18} /></IconButton>
          </Tooltip>
          <input type="color" ref={colorInputRef} style={{ display: "none" }} onChange={(e) => handleUpdate({ stroke: e.target.value, fill: element.fill !== "transparent" ? e.target.value : "transparent" })} />
          <Tooltip title="Eye Dropper">
            <IconButton size="small" onClick={handleEyeDropper} sx={{ color: "inherit", opacity: 0.7 }}><SafeIcon name="Pipette" size={18} /></IconButton>
          </Tooltip>
        </Stack>
        <Divider orientation="vertical" flexItem />
        <Tooltip title={element.fill === "transparent" ? "Add Fill" : "Remove Fill"}>
          <IconButton size="small" onClick={() => handleUpdate({ fill: element.fill === "transparent" ? element.stroke : "transparent" })} sx={{ color: element.fill !== "transparent" ? "#4f8bff" : theme === "dark" ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.7)" }}>
            <SafeIcon name={element.fill === "transparent" ? "Ghost" : "Fill"} size={20} />
          </IconButton>
        </Tooltip>
        <Tooltip title={element.fillStyle === "solid" ? "Switch to Rough Fill" : "Switch to Solid Fill"}>
          <IconButton size="small" onClick={() => handleUpdate({ fillStyle: element.fillStyle === "solid" ? "rough" : "solid" })} sx={{ color: element.fillStyle === "solid" ? "#4f8bff" : "inherit" }}>
            <SafeIcon name="Layers" size={20} />
          </IconButton>
        </Tooltip>
      </Stack>

      <Divider orientation="vertical" flexItem />

      <Stack direction="row" spacing={3} alignItems="center" sx={{ minWidth: 240 }}>
        <Box sx={{ flexGrow: 1 }}>
          <Typography sx={{ fontSize: "0.65rem", fontWeight: 900, opacity: 0.6, mb: 0.5 }}>STROKE: {element.strokeWidth}px</Typography>
          <Slider size="small" value={element.strokeWidth} min={1} max={20} onChange={(_, v) => handleUpdate({ strokeWidth: v as number })} sx={{ color: "#4f8bff", py: 1 }} />
        </Box>
        <Box sx={{ flexGrow: 1 }}>
          <Typography sx={{ fontSize: "0.65rem", fontWeight: 900, opacity: 0.6, mb: 0.5 }}>OPACITY: {Math.round((element.opacity ?? 1) * 100)}%</Typography>
          <Slider size="small" value={(element.opacity ?? 1) * 100} min={1} max={100} onChange={(_, v) => handleUpdate({ opacity: (v as number) / 100 })} sx={{ color: "#ffd33d", py: 1 }} />
        </Box>
      </Stack>

      <Divider orientation="vertical" flexItem />

      <Stack direction="row" spacing={0.5} alignItems="center">
        <Typography sx={{ fontSize: "0.6rem", fontWeight: 900, opacity: 0.4, mr: 1 }}>ALIGN</Typography>
        <Tooltip title="Left"><IconButton size="small" onClick={() => onAlign(element.id, "left")} sx={{ color: "inherit" }}><SafeIcon name="AlignLeft" size={16} /></IconButton></Tooltip>
        <Tooltip title="Center"><IconButton size="small" onClick={() => onAlign(element.id, "center")} sx={{ color: "inherit" }}><SafeIcon name="AlignCenter" size={16} /></IconButton></Tooltip>
        <Tooltip title="Right"><IconButton size="small" onClick={() => onAlign(element.id, "right")} sx={{ color: "inherit" }}><SafeIcon name="AlignRight" size={16} /></IconButton></Tooltip>
        <Divider orientation="vertical" flexItem sx={{ height: 16, my: "auto", mx: 1 }} />
        <Tooltip title="Top"><IconButton size="small" onClick={() => onAlign(element.id, "top")} sx={{ color: "inherit" }}><SafeIcon name="AlignVerticalJustifyStart" size={16} /></IconButton></Tooltip>
        <Tooltip title="Middle"><IconButton size="small" onClick={() => onAlign(element.id, "v-center")} sx={{ color: "inherit" }}><SafeIcon name="AlignVerticalJustifyCenter" size={16} /></IconButton></Tooltip>
        <Tooltip title="Bottom"><IconButton size="small" onClick={() => onAlign(element.id, "bottom")} sx={{ color: "inherit" }}><SafeIcon name="AlignVerticalJustifyEnd" size={16} /></IconButton></Tooltip>
      </Stack>

      <Divider orientation="vertical" flexItem />

      <Stack direction="row" spacing={0.5}>
        <Tooltip title="Forward"><IconButton size="small" onClick={() => onBringToFront(element.id)} sx={{ color: "inherit" }}><SafeIcon name="BringToFront" size={18} /></IconButton></Tooltip>
        <Tooltip title="Backward"><IconButton size="small" onClick={() => onSendToBack(element.id)} sx={{ color: "inherit" }}><SafeIcon name="SendToBack" size={18} /></IconButton></Tooltip>
        <Tooltip title="Duplicate"><IconButton size="small" onClick={() => onDuplicate(element.id)} sx={{ color: "inherit" }}><SafeIcon name="Copy" size={18} /></IconButton></Tooltip>
        <Tooltip title="Delete"><IconButton size="small" onClick={() => onRemove(element.id)} sx={{ color: "#ff4d4d", "&:hover": { bgcolor: "rgba(255, 77, 77, 0.1)" } }}><SafeIcon name="Trash2" size={18} /></IconButton></Tooltip>
      </Stack>
    </Paper>
  );
};
export default PropertyBar;
