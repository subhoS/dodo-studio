import React from "react";
import {
  Box,
  Typography,
  Slider,
  Stack,
  IconButton,
  Tooltip,
  Divider,
  Menu,
  MenuItem,
} from "@mui/material";
import * as Icons from "lucide-react";
import type { SvgElement } from "../types/svg";

const SafeIcon = ({ name, size = 18 }: { name: string; size?: number }) => {
  const IconComponent = (Icons as any)[name] || Icons.HelpCircle;
  return <IconComponent size={size} />;
};

// --- SUBSCRIPT COMPONENTS ---

export const SectionHeader: React.FC<{ label: string; icon: string }> = ({ label, icon }) => (
  <Stack direction="row" alignItems="center" spacing={0.5} sx={{ opacity: 0.4, mb: 0.5 }}>
    <SafeIcon name={icon} size={10} />
    <Typography sx={{ fontSize: "0.55rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: 1 }}>
      {label}
    </Typography>
  </Stack>
);

export const TransformSection: React.FC<{
  element: SvgElement;
  handleUpdate: (updates: Partial<SvgElement>) => void;
  borderColor: string;
  textColor: string;
  theme: string;
}> = ({ element, handleUpdate, borderColor, textColor, theme }) => {
  const fields = [
    { label: "X", value: element.x, field: "x" },
    { label: "Y", value: element.y, field: "y" },
    ...(element.type !== "pencil" && element.type !== "line" && element.type !== "arrow" ? [
      { label: "W", value: element.width || 0, field: "width" },
      { label: "H", value: element.height || 0, field: "height" },
      { label: "R°", value: element.rotation || 0, field: "rotation" },
    ] : [])
  ];

  return (
    <Box sx={{ flexShrink: 0 }}>
      <SectionHeader label="Layout" icon="Maximize" />
      <Stack direction="row" spacing={1} alignItems="center">
        {fields.map(prop => (
          <Stack key={prop.label} direction="row" alignItems="center" spacing={0.5}>
            <Typography sx={{ fontSize: "0.6rem", fontWeight: 800, opacity: 0.5 }}>{prop.label}</Typography>
            <input 
              type="number" 
              value={Math.round(prop.value as number)} 
              onChange={(e) => handleUpdate({ [prop.field]: Number(e.target.value) })}
              style={{ 
                width: 42, height: 22, 
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
    </Box>
  );
};

export const FontGalleryMenu: React.FC<{
  currentFont: string;
  onSelect: (font: string) => void;
  textColor: string;
  theme: string;
}> = ({ currentFont, onSelect, textColor, theme }) => {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  
  const fonts = [
    { id: "pj", label: "Jakarta Sans", font: "'Plus Jakarta Sans', sans-serif" },
    { id: "inter", label: "Inter Pro", font: "Inter, sans-serif" },
    { id: "mont", label: "Montserrat", font: "Montserrat, sans-serif" },
    { id: "play", label: "Playfair Serif", font: "'Playfair Display', serif" },
    { id: "mono", label: "Space Mono", font: "'Space Mono', monospace" },
    { id: "bang", label: "Bangers Display", font: "Bangers, cursive" },
    { id: "out", label: "Outfit Bold", font: "Outfit, sans-serif" },
    { id: "pac", label: "Hand Script", font: "Pacifico, cursive" },
    { id: "sync", label: "Syncopate", font: "Syncopate, sans-serif" }
  ];

  const currentLabel = fonts.find(f => f.font === currentFont)?.label || "Select Font";

  return (
    <Box>
      <Tooltip title="Change Typeface">
        <Box 
          onClick={(e) => setAnchorEl(e.currentTarget)}
          sx={{ 
            px: 1.5, py: 0.5, borderRadius: "8px", cursor: "pointer",
            bgcolor: theme === "dark" ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)",
            border: "1px solid rgba(34,211,238,0.2)",
            display: "flex", alignItems: "center", gap: 1,
            transition: "all 0.2s",
            "&:hover": { bgcolor: "rgba(34,211,238,0.1)" }
          }}
        >
          <Typography sx={{ fontSize: "0.7rem", fontWeight: 700, fontFamily: currentFont, whiteSpace: "nowrap" }}>
            {currentLabel}
          </Typography>
          <SafeIcon name="ChevronDown" size={14} />
        </Box>
      </Tooltip>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={() => setAnchorEl(null)}
        PaperProps={{
          sx: {
            mt: 1, borderRadius: "12px",
            bgcolor: theme === "dark" ? "rgba(15, 23, 42, 0.95)" : "rgba(255,255,255,0.95)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(34,211,238,0.2)",
            boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
            maxHeight: 300,
            width: 200,
          }
        }}
      >
        {fonts.map((f) => (
          <MenuItem 
            key={f.id} 
            onClick={() => { onSelect(f.font); setAnchorEl(null); }}
            sx={{ 
              fontFamily: f.font, fontSize: "0.85rem", color: textColor,
              bgcolor: currentFont === f.font ? "rgba(34,211,238,0.1)" : "transparent",
              py: 1, px: 2,
              "&:hover": { bgcolor: "rgba(34,211,238,0.05)" }
            }}
          >
            {f.label}
          </MenuItem>
        ))}
      </Menu>
    </Box>
  );
};

export const TypographySection: React.FC<{
  element: SvgElement;
  handleUpdate: (updates: Partial<SvgElement>) => void;
  textColor: string;
  theme: string;
}> = ({ element, handleUpdate, textColor, theme }) => {
  return (
    <Box sx={{ flexShrink: 0 }}>
      <SectionHeader label="Typography" icon="Type" />
      <Stack direction="row" spacing={1.5} alignItems="center">
        <FontGalleryMenu 
          currentFont={element.fontFamily || "Inter, sans-serif"} 
          onSelect={(font) => handleUpdate({ fontFamily: font })} 
          textColor={textColor}
          theme={theme}
        />
        
        <Box sx={{ minWidth: 80 }}>
          <Typography sx={{ fontSize: "0.5rem", fontWeight: 900, opacity: 0.5, mb: 0.1 }}>
            SIZE {element.fontSize || 24}px
          </Typography>
          <Slider
            size="small"
            value={element.fontSize || 24} min={8} max={200}
            onChange={(_, v) => handleUpdate({ fontSize: v as number })}
            sx={{ color: "#22d3ee", py: 0.5 }}
          />
        </Box>

        <Stack direction="row" spacing={0.5} sx={{ bgcolor: "rgba(255,255,255,0.05)", p: 0.25, borderRadius: "8px" }}>
          <Tooltip title="Bold"><IconButton size="small" onClick={() => handleUpdate({ fontWeight: element.fontWeight === "bold" || element.fontWeight === 700 ? 400 : "bold" })} sx={{ color: (element.fontWeight === "bold" || element.fontWeight === 700) ? "#22d3ee" : "inherit", p: 0.4 }}><SafeIcon name="Bold" size={13} /></IconButton></Tooltip>
          <Tooltip title="Italic"><IconButton size="small" onClick={() => handleUpdate({ fontStyle: element.fontStyle === "italic" ? "normal" : "italic" })} sx={{ color: element.fontStyle === "italic" ? "#22d3ee" : "inherit", p: 0.4 }}><SafeIcon name="Italic" size={13} /></IconButton></Tooltip>
          <Tooltip title="Underline"><IconButton size="small" onClick={() => handleUpdate({ textDecoration: element.textDecoration === "underline" ? "none" : "underline" })} sx={{ color: element.textDecoration === "underline" ? "#22d3ee" : "inherit", p: 0.4 }}><SafeIcon name="Underline" size={13} /></IconButton></Tooltip>
        </Stack>

        <Stack direction="row" spacing={1}>
           <Box sx={{ minWidth: 60 }}>
             <Typography sx={{ fontSize: "0.45rem", fontWeight: 900, opacity: 0.5 }}>LINE</Typography>
             <Slider size="small" value={element.lineHeight || 1.2} min={0.5} max={3} step={0.1} onChange={(_,v)=>handleUpdate({lineHeight: v as number})} sx={{ color: "#22d3ee", py: 0.3 }} />
           </Box>
           <Box sx={{ minWidth: 60 }}>
             <Typography sx={{ fontSize: "0.45rem", fontWeight: 900, opacity: 0.5 }}>LETTER</Typography>
             <Slider size="small" value={element.letterSpacing || 0} min={-5} max={20} step={0.5} onChange={(_,v)=>handleUpdate({letterSpacing: v as number})} sx={{ color: "#22d3ee", py: 0.3 }} />
           </Box>
        </Stack>
      </Stack>
    </Box>
  );
};

export const AppearanceSection: React.FC<{
  element: SvgElement;
  handleUpdate: (updates: Partial<SvgElement>) => void;
  colors: string[];
  colorInputRef: React.RefObject<HTMLInputElement | null>;
}> = ({ element, handleUpdate, colors, colorInputRef }) => {
  return (
    <Box sx={{ flexShrink: 0 }}>
      <SectionHeader label="Style" icon="Palette" />
      <Stack direction="row" spacing={1.5} alignItems="center">
        <Stack direction="row" spacing={0.5}>
          {colors.map((c) => (
            <Box
              key={c}
              onClick={() => handleUpdate({ stroke: c, fill: element.fill !== "transparent" ? c : "transparent" })}
              sx={{
                width: 18, height: 18, borderRadius: "50%", bgcolor: c, cursor: "pointer",
                border: element.stroke === c ? "2px solid #22d3ee" : "1px solid rgba(255,255,255,0.1)",
                transition: "transform 0.1s", "&:hover": { transform: "scale(1.2)" },
              }}
            />
          ))}
          <IconButton size="small" onClick={() => colorInputRef.current?.click()} sx={{ color: "inherit", p: 0.4, opacity: 0.7 }}>
            <SafeIcon name="Plus" size={14} />
          </IconButton>
        </Stack>

        <Divider orientation="vertical" flexItem sx={{ height: 20 }} />

        <Stack direction="row" spacing={0.5}>
           <Tooltip title="Toggle Fill"><IconButton size="small" onClick={() => handleUpdate({ fill: element.fill === "transparent" ? element.stroke : "transparent" })} sx={{ color: element.fill !== "transparent" ? "#22d3ee" : "inherit", p: 0.4 }}><SafeIcon name={element.fill === "transparent" ? "Ghost" : "PaintBucket"} size={15} /></IconButton></Tooltip>
           <Box sx={{ minWidth: 70 }}>
             <Typography sx={{ fontSize: "0.45rem", fontWeight: 900, opacity: 0.5 }}>OPACITY</Typography>
             <Slider size="small" value={(element.opacity ?? 1) * 100} min={1} max={100} onChange={(_,v)=>handleUpdate({opacity: (v as number)/100})} sx={{ color: "#ffd33d", py: 0.3 }} />
           </Box>
        </Stack>
      </Stack>
    </Box>
  );
};

export const EffectsSection: React.FC<{
  element: SvgElement;
  handleUpdate: (updates: Partial<SvgElement>) => void;
}> = ({ element, handleUpdate }) => {
  return (
    <Box sx={{ flexShrink: 0 }}>
      <SectionHeader label="Effects" icon="Sparkles" />
      <Stack direction="row" spacing={1.5} alignItems="center">
        <Tooltip title="Drop Shadow">
          <IconButton 
            size="small" 
            onClick={() => handleUpdate({ 
              dropShadow: { 
                enabled: !element.dropShadow?.enabled, 
                color: element.dropShadow?.color || "rgba(0,0,0,0.5)",
                blur: element.dropShadow?.blur || 10,
                offsetX: element.dropShadow?.offsetX || 5,
                offsetY: element.dropShadow?.offsetY || 5
              } 
            })}
            sx={{ color: element.dropShadow?.enabled ? "#ffd33d" : "inherit", p: 0.4 }}
          >
            <SafeIcon name="Copy" size={15} />
          </IconButton>
        </Tooltip>

        <Stack direction="row" alignItems="center" spacing={0.5}>
          <SafeIcon name="Layers" size={13} />
          <select 
            value={element.blendMode || "normal"}
            onChange={(e) => handleUpdate({ blendMode: e.target.value })}
            style={{
              background: "transparent", border: "none", color: "inherit",
              fontSize: "0.6rem", fontWeight: 800, cursor: "pointer", outline: "none"
            }}
          >
            {["normal", "multiply", "screen", "overlay", "darken", "lighten", "difference", "exclusion"].map(m => (
              <option key={m} value={m}>{m.charAt(0).toUpperCase() + m.slice(1)}</option>
            ))}
          </select>
        </Stack>
      </Stack>
    </Box>
  );
};

export const ArrangementSection: React.FC<{
  element: SvgElement;
  onBringToFront: (id: string) => void;
  onSendToBack: (id: string) => void;
  onDuplicate: (id: string) => void;
  onRemove: (id: string) => void;
}> = ({ element, onBringToFront, onSendToBack, onDuplicate, onRemove }) => {
  return (
    <Box sx={{ flexShrink: 0 }}>
      <SectionHeader label="Arrange" icon="Layers" />
      <Stack direction="row" spacing={0.25} alignItems="center">
        <Tooltip title="Forward"><IconButton size="small" onClick={() => onBringToFront(element.id)} sx={{ color: "inherit", p: 0.4 }}><SafeIcon name="BringToFront" size={15} /></IconButton></Tooltip>
        <Tooltip title="Backward"><IconButton size="small" onClick={() => onSendToBack(element.id)} sx={{ color: "inherit", p: 0.4 }}><SafeIcon name="SendToBack" size={15} /></IconButton></Tooltip>
        <Divider orientation="vertical" flexItem sx={{ height: 14, mx: 0.5, my: "auto" }} />
        <Tooltip title="Duplicate"><IconButton size="small" onClick={() => onDuplicate(element.id)} sx={{ color: "inherit", p: 0.4 }}><SafeIcon name="Copy" size={15} /></IconButton></Tooltip>
        <Tooltip title="Delete"><IconButton size="small" onClick={() => onRemove(element.id)} sx={{ color: "#ff4d4d", p: 0.4 }}><SafeIcon name="Trash2" size={15} /></IconButton></Tooltip>
      </Stack>
    </Box>
  );
};

export const ShapeSection: React.FC<{
  element: SvgElement;
  handleUpdate: (updates: Partial<SvgElement>) => void;
}> = ({ element, handleUpdate }) => {
  if (element.type !== "star" && element.type !== "polygon") return null;

  return (
    <Box sx={{ flexShrink: 0 }}>
      <SectionHeader label="Shape" icon="Pentagon" />
      <Stack direction="row" spacing={2} alignItems="center">
        <Box sx={{ minWidth: 80 }}>
          <Typography sx={{ fontSize: "0.5rem", fontWeight: 900, opacity: 0.5, mb: 0.1 }}>
            {element.type === "star" ? "POINTS" : "SIDES"} {element.sides || (element.type === "star" ? 5 : 6)}
          </Typography>
          <Slider
            size="small"
            value={element.sides || (element.type === "star" ? 5 : 6)} min={3} max={20} step={1}
            onChange={(_, v) => handleUpdate({ sides: v as number })}
            sx={{ color: "#22d3ee", py: 0.5 }}
          />
        </Box>

        {element.type === "star" && (
          <Box sx={{ minWidth: 80 }}>
            <Typography sx={{ fontSize: "0.5rem", fontWeight: 900, opacity: 0.5, mb: 0.1 }}>
              INNER RADIUS {Math.round((element.innerRadiusRatio ?? 0.4) * 100)}%
            </Typography>
            <Slider
              size="small"
              value={element.innerRadiusRatio ?? 0.4} min={0.1} max={0.9} step={0.05}
              onChange={(_, v) => handleUpdate({ innerRadiusRatio: v as number })}
              sx={{ color: "#22d3ee", py: 0.5 }}
            />
          </Box>
        )}
      </Stack>
    </Box>
  );
};

