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

const SafeIcon = ({ name, size = 18 }: { name: string; size?: number }) => {
  const IconComponent = (Icons as any)[name] || Icons.HelpCircle;
  return <IconComponent size={size} />;
};

const PropertyBar: React.FC<PropertyBarProps> = ({
  element,
  onUpdate,
  onRemove,
  onBringToFront,
  onSendToBack,
  onDuplicate,
  theme,
}) => {
  const colorInputRef = useRef<HTMLInputElement>(null);
  const borderColor = theme === "dark" ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.12)";
  const bgColor = theme === "dark" ? "rgba(22, 27, 34, 0.98)" : "rgba(255, 255, 255, 0.98)";
  // Explicit text color so all "inherit" icons render correctly on both themes
  const textColor = theme === "dark" ? "#ffffff" : "#000000";

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
        alignItems: "center",
        p: 0.75,
        px: 1.5,
        gap: 1,
        borderRadius: "20px",
        border: `1px solid ${borderColor}`,
        bgcolor: bgColor,
        // ↓ THE KEY FIX: explicit color so all `color:"inherit"` children are visible
        color: textColor,
        backdropFilter: "blur(30px)",
        boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
        maxWidth: "calc(100vw - 120px)",
        overflowX: "auto",
        "&::-webkit-scrollbar": { height: "3px" },
        "&::-webkit-scrollbar-thumb": { bgcolor: "rgba(79,139,255,0.4)", borderRadius: "3px" },
      }}
    >
      {/* — Element type badge — */}
      <Stack direction="row" alignItems="center" sx={{ color: "#4f8bff", gap: 1, mr: 0.5, flexShrink: 0 }}>
        <SafeIcon name={typeIconName} size={15} />
        <Typography sx={{ fontSize: "0.75rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: 1 }}>
          {element.type}
        </Typography>
      </Stack>

      {element.type !== "image" && (
        <>
          <Divider orientation="vertical" flexItem />
          {/* — Color swatches — */}
          <Stack direction="row" spacing={0.5} alignItems="center" sx={{ flexShrink: 0 }}>
            {colors.map((c) => (
              <Box
                key={c}
                onClick={() => handleUpdate({ stroke: c, fill: element.fill !== "transparent" ? c : "transparent" })}
                sx={{
                  width: 20, height: 20, borderRadius: "50%", bgcolor: c, cursor: "pointer",
                  border: element.stroke === c ? "2px solid #4f8bff" : "2px solid transparent",
                  boxSizing: "border-box", transition: "all 0.1s", "&:hover": { transform: "scale(1.2)" },
                }}
              />
            ))}
            <Tooltip title="Custom Color">
              <IconButton size="small" onClick={() => colorInputRef.current?.click()} sx={{ color: "inherit", opacity: 0.7, p: 0.5 }}>
                <SafeIcon name="Palette" size={15} />
              </IconButton>
            </Tooltip>
            <input type="color" ref={colorInputRef} style={{ display: "none" }} onChange={(e) => handleUpdate({ stroke: e.target.value, fill: element.fill !== "transparent" ? e.target.value : "transparent" })} />
            <Tooltip title="Eye Dropper">
              <IconButton size="small" onClick={handleEyeDropper} sx={{ color: "inherit", opacity: 0.7, p: 0.5 }}>
                <SafeIcon name="Pipette" size={15} />
              </IconButton>
            </Tooltip>
          </Stack>

          <Divider orientation="vertical" flexItem />

          {/* — Fill controls — */}
          <Stack direction="row" spacing={0.5} alignItems="center" sx={{ flexShrink: 0 }}>
            <Tooltip title={element.fill === "transparent" ? "Add Fill" : "Remove Fill"}>
              <IconButton
                size="small"
                onClick={() => handleUpdate({ fill: element.fill === "transparent" ? element.stroke : "transparent" })}
                sx={{ color: element.fill !== "transparent" ? "#4f8bff" : "inherit", opacity: element.fill !== "transparent" ? 1 : 0.6, p: 0.5 }}
              >
                <SafeIcon name={element.fill === "transparent" ? "Ghost" : "PaintBucket"} size={17} />
              </IconButton>
            </Tooltip>
            <Tooltip title={element.fillStyle === "solid" ? "Rough Fill" : "Solid Fill"}>
              <IconButton
                size="small"
                onClick={() => handleUpdate({ fillStyle: element.fillStyle === "solid" ? "rough" : "solid" })}
                sx={{ color: element.fillStyle === "solid" ? "#4f8bff" : "inherit", opacity: element.fillStyle === "solid" ? 1 : 0.6, p: 0.5 }}
              >
                <SafeIcon name="Layers" size={17} />
              </IconButton>
            </Tooltip>
          </Stack>
        </>
      )}

      <Divider orientation="vertical" flexItem />

      {/* — Stroke width — */}
      <Box sx={{ minWidth: 90, flexShrink: 0 }}>
        <Typography sx={{ fontSize: "0.6rem", fontWeight: 900, opacity: 0.5, mb: 0.25 }}>
          STROKE {element.strokeWidth}px
        </Typography>
        <Slider
          size="small"
          value={element.strokeWidth} min={1} max={20}
          onChange={(_, v) => handleUpdate({ strokeWidth: v as number })}
          sx={{ color: "#4f8bff", py: 0.75 }}
        />
      </Box>

      {/* — Opacity — */}
      <Box sx={{ minWidth: 90, flexShrink: 0 }}>
        <Typography sx={{ fontSize: "0.6rem", fontWeight: 900, opacity: 0.5, mb: 0.25 }}>
          OPACITY {Math.round((element.opacity ?? 1) * 100)}%
        </Typography>
        <Slider
          size="small"
          value={(element.opacity ?? 1) * 100} min={1} max={100}
          onChange={(_, v) => handleUpdate({ opacity: (v as number) / 100 })}
          sx={{ color: "#ffd33d", py: 0.75 }}
        />
      </Box>

      <Divider orientation="vertical" flexItem />

      {/* — Layer order + actions — */}
      <Stack direction="row" spacing={0.25} alignItems="center" sx={{ flexShrink: 0 }}>
        <Tooltip title="Bring Forward"><IconButton size="small" onClick={() => onBringToFront(element.id)} sx={{ color: "inherit", p: 0.5 }}><SafeIcon name="BringToFront" size={17} /></IconButton></Tooltip>
        <Tooltip title="Send Backward"><IconButton size="small" onClick={() => onSendToBack(element.id)} sx={{ color: "inherit", p: 0.5 }}><SafeIcon name="SendToBack" size={17} /></IconButton></Tooltip>
        <Divider orientation="vertical" flexItem sx={{ height: 16, mx: 0.5, my: "auto" }} />
        <Tooltip title="Duplicate"><IconButton size="small" onClick={() => onDuplicate(element.id)} sx={{ color: "inherit", p: 0.5 }}><SafeIcon name="Copy" size={17} /></IconButton></Tooltip>
        <Tooltip title="Delete"><IconButton size="small" onClick={() => onRemove(element.id)} sx={{ color: "#ff4d4d", p: 0.5, "&:hover": { bgcolor: "rgba(255,77,77,0.1)" } }}><SafeIcon name="Trash2" size={17} /></IconButton></Tooltip>
      </Stack>
    </Paper>
  );
};
export default PropertyBar;
