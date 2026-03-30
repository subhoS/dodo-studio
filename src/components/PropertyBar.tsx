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

const PropertyBar: React.FC<PropertyBarProps> = React.memo(({
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
  // Explicit text color so all "inherit" icons render correctly on both themes
  const textColor = theme === "dark" ? "#ffffff" : "#000000";

  const colors = ["#ffffff", "#22d3ee", "#ff2e63", "#38bdf8", "#fbbf24", "#4ade80", "#a78bfa"];

  const handleUpdate = (updates: Partial<SvgElement>) => onUpdate(element.id, updates);


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
        flexWrap: "wrap", // Allow wrapping on small screens
        alignItems: "center",
        p: { xs: 0.5, md: 0.75 },
        px: { xs: 1, md: 1.5 },
        gap: { xs: 0.5, md: 1 },
        borderRadius: "20px",
        border: `1px solid ${borderColor}`,
        bgcolor: bgColor,
        color: textColor,
        backdropFilter: "blur(30px)",
        boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
        maxWidth: "calc(100vw - 100px)",
        maxHeight: "200px", // Prevent it from getting too tall when wrapping
        overflowY: "auto",
        scrollbarWidth: "none",
        "&::-webkit-scrollbar": { display: "none" },
      }}
    >
      {/* — Element type badge — */}
      <Stack direction="row" alignItems="center" sx={{ color: "#22d3ee", gap: 1, mr: 0.5, flexShrink: 0 }}>
        <SafeIcon name={typeIconName} size={15} />
        <Typography className="heading-font" sx={{ fontSize: "0.7rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: 1.5 }}>
          {element.type}
        </Typography>
      </Stack>

      <Divider orientation="vertical" flexItem />

      {/* Numeric Inputs for X, Y, W, H, Rotation */}
      <Stack direction="row" spacing={1} alignItems="center" sx={{ flexShrink: 0, px: 0.5 }}>
        {[
          { label: "X", value: element.x, field: "x" },
          { label: "Y", value: element.y, field: "y" },
          ...(element.type !== "pencil" && element.type !== "line" && element.type !== "arrow" ? [
            { label: "W", value: element.width || 0, field: "width" },
            { label: "H", value: element.height || 0, field: "height" },
            { label: "R°", value: element.rotation || 0, field: "rotation" },
          ] : [])
        ].map(prop => (
          <Stack key={prop.label} direction="row" alignItems="center" spacing={0.5}>
            <Typography sx={{ fontSize: "0.55rem", fontWeight: 800, opacity: 0.6 }}>{prop.label}</Typography>
            <input 
              type="number" 
              value={Math.round(prop.value as number)} 
              onChange={(e) => handleUpdate({ [prop.field]: Number(e.target.value) })}
              style={{ 
                width: 45, height: 22, 
                backgroundColor: theme === "dark" ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)", 
                border: `1px solid ${borderColor}`, 
                color: textColor, 
                borderRadius: 4, 
                fontSize: "0.7rem", 
                padding: "0 4px",
                fontFamily: "Inter, sans-serif"
              }} 
            />
          </Stack>
        ))}
      </Stack>

      {element.type !== "image" && element.type !== "svg" && (
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
          </Stack>

          {/* — Fill & Shape-specific controls — */}
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
            {element.type !== "text" && (
              <Tooltip title={element.fillStyle === "solid" ? "Rough Fill" : "Solid Fill"}>
                <IconButton
                  size="small"
                  onClick={() => handleUpdate({ fillStyle: element.fillStyle === "solid" ? "rough" : "solid" })}
                  sx={{ color: element.fillStyle === "solid" ? "#4f8bff" : "inherit", opacity: element.fillStyle === "solid" ? 1 : 0.6, p: 0.5 }}
                >
                  <SafeIcon name="Layers" size={17} />
                </IconButton>
              </Tooltip>
            )}

            {element.type === "rect" && (
              <>
                <Divider orientation="vertical" flexItem />
                <Box sx={{ minWidth: 80, flexShrink: 0 }}>
                  <Typography sx={{ fontSize: "0.6rem", fontWeight: 900, opacity: 0.5, mb: 0.25 }}>
                    RADIUS {element.cornerRadius || 0}px
                  </Typography>
                  <Slider
                    size="small"
                    value={element.cornerRadius || 0} min={0} max={50}
                    onChange={(_, v) => handleUpdate({ cornerRadius: v as number })}
                    sx={{ color: "#4f8bff", py: 0.75 }}
                  />
                </Box>
              </>
            )}

            {element.type === "text" && (
              <>
                <Divider orientation="vertical" flexItem />
                <Box sx={{ minWidth: 100, flexShrink: 0 }}>
                  <Typography sx={{ fontSize: "0.6rem", fontWeight: 900, opacity: 0.5, mb: 0.25 }}>
                    FONT SIZE {element.fontSize || 24}px
                  </Typography>
                  <Slider
                    size="small"
                    value={element.fontSize || 24} min={8} max={200}
                    onChange={(_, v) => handleUpdate({ fontSize: v as number })}
                    sx={{ color: "#4f8bff", py: 0.75 }}
                  />
                </Box>
                <Divider orientation="vertical" flexItem />
                <Stack 
                  direction="row" 
                  spacing={0.5} 
                  sx={{ 
                    p: 0.5, 
                    bgcolor: theme === "dark" ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)", 
                    borderRadius: "8px",
                    maxWidth: 240,
                    overflowX: "auto",
                    "&::-webkit-scrollbar": { height: "2px" },
                    "&::-webkit-scrollbar-thumb": { bgcolor: "rgba(34,211,238,0.3)", borderRadius: "2px" }
                  }}
                >
                  {[
                    { id: "pj", label: "Jakarta", font: "'Plus Jakarta Sans', sans-serif" },
                    { id: "inter", label: "Inter", font: "Inter, sans-serif" },
                    { id: "mont", label: "Mont", font: "Montserrat, sans-serif" },
                    { id: "play", label: "Serif", font: "'Playfair Display', serif" },
                    { id: "mono", label: "Mono", font: "'Space Mono', monospace" },
                    { id: "bang", label: "Bangers", font: "Bangers, cursive" },
                    { id: "out", label: "Outfit", font: "Outfit, sans-serif" },
                    { id: "pac", label: "Hand", font: "Pacifico, cursive" },
                    { id: "sync", label: "Sync", font: "Syncopate, sans-serif" }
                  ].map(f => (
                    <Box
                      key={f.id}
                      onClick={() => handleUpdate({ fontFamily: f.font })}
                      sx={{
                        px: 1, py: 0.3, borderRadius: "6px", cursor: "pointer", 
                        fontSize: "0.6rem", fontWeight: 800, whiteSpace: "nowrap",
                        fontFamily: f.font,
                        bgcolor: element.fontFamily === f.font ? "#22d3ee" : "transparent",
                        color: element.fontFamily === f.font ? "#020617" : "inherit",
                        transition: "all 0.15s", 
                        "&:hover": { bgcolor: element.fontFamily === f.font ? "#22d3ee" : "rgba(34,211,238,0.1)" }
                      }}
                    >
                      {f.label}
                    </Box>
                  ))}
                </Stack>
              </>
            )}
          </Stack>
        </>
      )}

      <Divider orientation="vertical" flexItem />

      {/* — Alignment Actions — */}
      <Stack direction="row" spacing={0.1} alignItems="center" sx={{ flexShrink: 0 }}>
        <Tooltip title="Align Left"><IconButton size="small" onClick={() => onAlign(element.id, "left")} sx={{ color: "inherit", p: 0.4 }}><SafeIcon name="AlignLeft" size={15} /></IconButton></Tooltip>
        <Tooltip title="Align Center"><IconButton size="small" onClick={() => onAlign(element.id, "center")} sx={{ color: "inherit", p: 0.4 }}><SafeIcon name="AlignCenter" size={15} /></IconButton></Tooltip>
        <Tooltip title="Align Right"><IconButton size="small" onClick={() => onAlign(element.id, "right")} sx={{ color: "inherit", p: 0.4 }}><SafeIcon name="AlignRight" size={15} /></IconButton></Tooltip>
        <Divider orientation="vertical" flexItem sx={{ height: 14, mx: 0.25, my: "auto" }} />
        <Tooltip title="Align Top"><IconButton size="small" onClick={() => onAlign(element.id, "top")} sx={{ color: "inherit", p: 0.4 }}><SafeIcon name="AlignStartVertical" size={15} /></IconButton></Tooltip>
        <Tooltip title="Align Middle"><IconButton size="small" onClick={() => onAlign(element.id, "v-center")} sx={{ color: "inherit", p: 0.4 }}><SafeIcon name="AlignCenterVertical" size={15} /></IconButton></Tooltip>
        <Tooltip title="Align Bottom"><IconButton size="small" onClick={() => onAlign(element.id, "bottom")} sx={{ color: "inherit", p: 0.4 }}><SafeIcon name="AlignEndVertical" size={15} /></IconButton></Tooltip>
      </Stack>

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
});
export default PropertyBar;
