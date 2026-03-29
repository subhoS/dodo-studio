import React, { useState } from "react";
import { 
  Box, Typography, Stack, Grid, TextField, InputAdornment, 
  IconButton, Tooltip, Tabs, Tab, Card, CardActionArea 
} from "@mui/material";
import { 
  Search, X, Star, Heart, Triangle, Octagon, Hexagon, 
  Settings, User, Image as ImageIcon, Mail, MapPin, Phone, 
  Hash, Layout, Cloud, Moon, Anchor, Award, Pencil
} from "lucide-react";

interface LibraryItem {
  id: string;
  name: string;
  type: "path" | "svg";
  content?: string;
  svgContent?: string;
  icon: React.ReactNode;
}

const SHAPES: LibraryItem[] = [
  { id: "heart", name: "Heart", type: "path", content: "M 50 85 C 50 85 10 60 10 35 C 10 15 30 15 50 30 C 70 15 90 15 90 35 C 90 60 50 85 50 85 Z", icon: <Heart size={20} /> },
  { id: "star", name: "Star", type: "path", content: "M 50 5 L 63 38 L 98 38 L 70 59 L 81 91 L 50 72 L 19 91 L 30 59 L 2 38 L 37 38 Z", icon: <Star size={20} /> },
  { id: "triangle", name: "Triangle", type: "path", content: "M 50 10 L 90 90 L 10 90 Z", icon: <Triangle size={20} /> },
  { id: "octagon", name: "Octagon", type: "path", content: "M 30 10 L 70 10 L 90 30 L 90 70 L 70 90 L 30 90 L 10 70 L 10 30 Z", icon: <Octagon size={20} /> },
  { id: "hexagon", name: "Hexagon", type: "path", content: "M 50 10 L 90 30 L 90 70 L 50 90 L 10 70 L 10 30 Z", icon: <Hexagon size={20} /> },
  { id: "pentagon", name: "Pentagon", type: "path", content: "M 50 10 L 90 40 L 75 90 L 25 90 L 10 40 Z", icon: <Layout size={20} /> },
];

const ICONS: LibraryItem[] = [
  { id: "settings", name: "Settings", type: "svg", svgContent: `<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>`, icon: <Settings size={20} /> },
  { id: "user", name: "User", type: "svg", svgContent: `<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>`, icon: <User size={20} /> },
  { id: "image", name: "Image", type: "svg", svgContent: `<rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>`, icon: <ImageIcon size={20} /> },
  { id: "mail", name: "Mail", type: "svg", svgContent: `<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>`, icon: <Mail size={20} /> },
  { id: "map-pin", name: "Location", type: "svg", svgContent: `<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>`, icon: <MapPin size={20} /> },
  { id: "phone", name: "Phone", type: "svg", svgContent: `<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>`, icon: <Phone size={20} /> },
  { id: "hash", name: "Hashtag", type: "svg", svgContent: `<line x1="4" x2="20" y1="9" y2="9"/><line x1="4" x2="20" y1="15" y2="15"/><line x1="10" x2="8" y1="3" y2="21"/><line x1="16" x2="14" y1="3" y2="21"/>`, icon: <Hash size={20} /> },
  { id: "cloud", name: "Cloud", type: "svg", svgContent: `<path d="M17.5 19a5.5 5.5 0 0 0 0-11a5.5 5.5 0 0 0-11 0a5.5 5.5 0 0 0 0 11z"/>`, icon: <Cloud size={20} /> },
  { id: "moon", name: "Moon", type: "svg", svgContent: `<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>`, icon: <Moon size={20} /> },
  { id: "anchor", name: "Anchor", type: "svg", svgContent: `<path d="M12 2v8"/><path d="M5 12H2a10 10 0 0 0 20 0h-3"/><circle cx="12" cy="5" r="3"/>`, icon: <Anchor size={20} /> },
  { id: "award", name: "Award", type: "svg", svgContent: `<circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/>`, icon: <Award size={20} /> },
];

const PRESETS: LibraryItem[] = [
  { id: "dodo-badge", name: "Dodo Badge", type: "svg", svgContent: `<circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" stroke-width="2"/><path d="M30 50 Q 50 20 70 50 Q 50 80 30 50" fill="currentColor" fill-opacity="0.2"/><circle cx="50" cy="50" r="10" fill="currentColor"/>`, icon: <Award size={20} /> },
  { id: "sketch-banner", name: "Sketch Banner", type: "path", content: "M 10 20 L 90 20 L 85 50 L 90 80 L 10 80 L 15 50 Z", icon: <Pencil size={20} /> },
];

interface LibraryPanelProps {
  onAddItem: (type: "path" | "svg", name: string, content?: string, svgContent?: string) => void;
  onClose: () => void;
  theme: "light" | "dark";
}

const LibraryPanel: React.FC<LibraryPanelProps> = ({ onAddItem, onClose }) => {
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState(0);

  const filterItems = (items: LibraryItem[]) => 
    items.filter(i => i.name.toLowerCase().includes(search.toLowerCase()));

  const filteredShapes = filterItems(SHAPES);
  const filteredIcons = filterItems(ICONS);
  const filteredPresets = filterItems(PRESETS);

  return (
    <Box className="glass-panel" sx={{ 
      width: 280, height: "calc(100vh - 120px)", 
      display: "flex", flexDirection: "column",
      boxShadow: "0 20px 40px rgba(0,0,0,0.4)"
    }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ p: 2, borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <Typography className="heading-font" sx={{ fontWeight: 800, fontSize: "0.9rem", color: "#22d3ee" }}>LIBRARY</Typography>
        <IconButton size="small" onClick={onClose} sx={{ color: "rgba(255,255,255,0.4)" }}><X size={18} /></IconButton>
      </Stack>

      <Box sx={{ p: 1.5 }}>
        <TextField 
          fullWidth size="small" placeholder="Search elements..." 
          value={search} onChange={(e) => setSearch(e.target.value)}
          InputProps={{
            startAdornment: <InputAdornment position="start"><Search size={14} opacity={0.4} /></InputAdornment>,
            sx: { borderRadius: "10px", bgcolor: "rgba(255,255,255,0.03)", fontSize: "0.75rem" }
          }}
        />
      </Box>

      <Tabs 
        value={tab} onChange={(_, v) => setTab(v)} variant="fullWidth"
        sx={{ borderBottom: "1px solid rgba(255,255,255,0.08)", minHeight: 40, "& .MuiTabs-indicator": { bgcolor: "#22d3ee" } }}
      >
        <Tab label="Shapes" sx={{ fontSize: "0.65rem", fontWeight: 700, minWidth: 0, minHeight: 40, color: "rgba(255,255,255,0.4)", "&.Mui-selected": { color: "#fff" } }} />
        <Tab label="Icons" sx={{ fontSize: "0.65rem", fontWeight: 700, minWidth: 0, minHeight: 40, color: "rgba(255,255,255,0.4)", "&.Mui-selected": { color: "#fff" } }} />
        <Tab label="Elements" sx={{ fontSize: "0.65rem", fontWeight: 700, minWidth: 0, minHeight: 40, color: "rgba(255,255,255,0.4)", "&.Mui-selected": { color: "#fff" } }} />
      </Tabs>

      <Box sx={{ flexGrow: 1, overflowY: "auto", p: 1.5, "&::-webkit-scrollbar": { width: "4px" }, "&::-webkit-scrollbar-thumb": { bgcolor: "rgba(255,255,255,0.1)", borderRadius: "4px" } }}>
        <Grid container spacing={1}>
          {tab === 0 && filteredShapes.map(item => (
            <Grid key={item.id} size={4}>
              <Tooltip title={item.name} arrow placement="top">
                <Card sx={{ 
                  borderRadius: "10px", bgcolor: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)",
                  transition: "all 0.2s", "&:hover": { transform: "scale(1.05)", borderColor: "#22d3ee", bgcolor: "rgba(34,211,238,0.05)" }
                }}>
                  <CardActionArea 
                    onClick={() => onAddItem(item.type, item.name, item.content, item.svgContent)}
                    sx={{ p: 1.5, display: "flex", alignItems: "center", justifyContent: "center", color: "#22d3ee" }}
                  >
                    {item.icon}
                  </CardActionArea>
                </Card>
              </Tooltip>
            </Grid>
          ))}
          
          {tab === 1 && filteredIcons.map(item => (
            <Grid key={item.id} size={4}>
               <Tooltip title={item.name} arrow placement="top">
                <Card sx={{ 
                  borderRadius: "10px", bgcolor: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)",
                  transition: "all 0.2s", "&:hover": { transform: "scale(1.05)", borderColor: "#4f8bff", bgcolor: "rgba(79,139,255,0.05)" }
                }}>
                  <CardActionArea 
                    onClick={() => onAddItem(item.type, item.name, item.content, item.svgContent)}
                    sx={{ p: 1.5, display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.6)" }}
                  >
                    {item.icon}
                  </CardActionArea>
                </Card>
              </Tooltip>
            </Grid>
          ))}

          {tab === 2 && filteredPresets.map(item => (
            <Grid key={item.id} size={6}>
               <Tooltip title={item.name} arrow placement="top">
                <Card sx={{ 
                  borderRadius: "10px", bgcolor: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)",
                  transition: "all 0.2s", "&:hover": { transform: "scale(1.05)", borderColor: "#fbbf24", bgcolor: "rgba(251,191,36,0.05)" }
                }}>
                  <CardActionArea 
                    onClick={() => onAddItem(item.type, item.name, item.content, item.svgContent)}
                    sx={{ p: 1.5, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#fbbf24", gap: 0.5 }}
                  >
                    {item.icon}
                    <Typography sx={{ fontSize: "0.55rem", fontWeight: 700, opacity: 0.7 }}>{item.name}</Typography>
                  </CardActionArea>
                </Card>
              </Tooltip>
            </Grid>
          ))}
        </Grid>

        {(tab === 0 ? filteredShapes : (tab === 1 ? filteredIcons : filteredPresets)).length === 0 && (
          <Box sx={{ py: 4, textAlign: "center", opacity: 0.3 }}>
            <Typography variant="caption" sx={{ fontSize: "0.6rem" }}>No items found</Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default LibraryPanel;
