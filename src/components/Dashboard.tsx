import React, { useState } from "react";
import { 
  Box, Typography, Stack, Grid, Card, CardActionArea, IconButton, 
  Button, TextField, InputAdornment, Tooltip, Divider 
} from "@mui/material";
import { 
  Plus, Search, Layout, Smartphone, Play, 
  FileText, Clock, Trash2, Bell, Settings 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { Project, CanvasSize } from "../types/svg";
import DodoLogo from "./DodoLogo";

interface DashboardProps {
  projects: Project[];
  onCreateProject: (name: string, mode: "moodboard" | "designer", size: CanvasSize) => void;
  onLoadProject: (id: string) => void;
  onDeleteProject: (id: string) => void;
  theme: "light" | "dark";
  gridEnabled?: boolean;
  activeMode?: "moodboard" | "designer";
  artboardSize?: { width: number; height: number };
}

const PRESETS: CanvasSize[] = [
  { label: "Instagram Story", width: 1080, height: 1920 },
  { label: "Social Post", width: 1080, height: 1080 },
  { label: "Presentation", width: 1920, height: 1080 },
  { label: "Desktop Wallpaper", width: 2560, height: 1440 },
  { label: "LinkedIn Banner", width: 1584, height: 396 },
];

const Dashboard: React.FC<DashboardProps> = ({ projects, onCreateProject, onLoadProject, onDeleteProject, theme: _theme }) => {
  const [search, setSearch] = useState("");
  const [showCustom, setShowCustom] = useState(false);
  const [customSize, setCustomSize] = useState({ width: 1000, height: 1000 });
  const [customName, setCustomName] = useState("Untitled Project");

  const filteredProjects = projects.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <Box sx={{ 
      flexGrow: 1, 
      height: "100vh", 
      overflowY: "auto", 
      bgcolor: "transparent", 
      color: "#f8fafc",
    }}>
      {/* Top Navbar */}
      <Box sx={{ 
        position: "sticky", top: 0, zIndex: 1000,
        px: { xs: 2, md: 6 }, py: 2,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
        bgcolor: "rgba(2, 6, 23, 0.7)"
      }}>
        <DodoLogo size={28} />
        
        <Stack direction="row" spacing={1} alignItems="center">
           <IconButton sx={{ color: "rgba(255,255,255,0.4)" }}><Bell size={20} /></IconButton>
           <IconButton sx={{ color: "rgba(255,255,255,0.4)" }}><Settings size={20} /></IconButton>
           <Divider orientation="vertical" flexItem sx={{ mx: 1, my: 1, opacity: 0.1 }} />
           <Box sx={{ 
              width: 32, height: 32, borderRadius: "50%", 
              background: "linear-gradient(45deg, #22d3ee, #4f8bff)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontWeight: 800, fontSize: "0.7rem", color: "#020617"
           }}>
              SD
           </Box>
        </Stack>
      </Box>

      <Box sx={{ p: { xs: 2, md: 6 } }}>
        {/* Hero Section */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Stack direction="column" alignItems="center" spacing={4} sx={{ mb: 8, mt: 4 }}>
            <Typography className="heading-font" variant="h3" sx={{ fontWeight: 800, color: "#fff", textAlign: "center", letterSpacing: "-2px" }}>
              What will you design today?
            </Typography>
            
            <Box sx={{ width: "100%", maxWidth: 600, position: "relative" }}>
              <TextField 
                fullWidth
                placeholder="Search your projects..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                InputProps={{
                  startAdornment: <InputAdornment position="start"><Search size={20} style={{ opacity: 0.3 }} color="#22d3ee" /></InputAdornment>,
                  sx: { borderRadius: "16px", bgcolor: "rgba(255,255,255,0.03)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.08)", height: 56, fontSize: "1.1rem" }
                }}
              />
            </Box>
          </Stack>
        </motion.div>

        {/* Categories / Presets */}
        <Box sx={{ mb: 8 }}>
          <Typography variant="h6" className="heading-font" sx={{ fontWeight: 700, mb: 3, opacity: 0.8 }}>Start a new design</Typography>
          <Grid container spacing={3}>
            <Grid size={{ xs: 6, sm: 4, md: 2.4 }}>
               <Card className="accent-glow" sx={{ borderRadius: "16px", bgcolor: "rgba(34,211,238,0.05)", border: "2px dashed rgba(34,211,238,0.3)", height: "100%", transition: "all 0.2s ease", "&:hover": { bgcolor: "rgba(34,211,238,0.08)", transform: "translateY(-4px)" } }}>
                  <CardActionArea onClick={() => setShowCustom(true)} sx={{ height: "100%", p: 3, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                     <Plus size={32} color="#22d3ee" />
                     <Typography className="heading-font" sx={{ mt: 1, fontWeight: 700, fontSize: "0.8rem", color: "#22d3ee" }}>Custom Size</Typography>
                  </CardActionArea>
               </Card>
            </Grid>
            {PRESETS.map((preset, i) => (
              <Grid size={{ xs: 6, sm: 4, md: 2.4 }} key={i}>
                 <Card sx={{ borderRadius: "16px", overflow: "hidden", bgcolor: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", transition: "all 0.2s ease", "&:hover": { transform: "translateY(-4px)", borderColor: "#22d3ee", bgcolor: "rgba(255,255,255,0.05)" } }}>
                    <CardActionArea onClick={() => onCreateProject(`New ${preset.label || "Project"}`, "designer", preset)} sx={{ p: 3, display: "flex", flexDirection: "column", alignItems: "center" }}>
                       <Box sx={{ p: 2, bgcolor: "rgba(34,211,238,0.08)", borderRadius: "14px", mb: 2 }}>
                          {(preset.label || "").includes("Story") ? <Smartphone color="#22d3ee" size={20} /> : (preset.label || "").includes("Presentation") ? <Play color="#22d3ee" size={20} /> : <Layout color="#22d3ee" size={20} />}
                       </Box>
                       <Typography className="heading-font" sx={{ fontWeight: 700, fontSize: "0.85rem", textAlign: "center" }}>{preset.label}</Typography>
                       <Typography sx={{ fontSize: "0.7rem", opacity: 0.4, mt: 0.5 }}>{preset.width} × {preset.height} PX</Typography>
                    </CardActionArea>
                 </Card>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Custom Size Modal Overlay */}
        <AnimatePresence>
          {showCustom && (
            <Box sx={{ position: "fixed", inset: 0, zIndex: 3000, display: "flex", alignItems: "center", justifyContent: "center", p: 2 }}>
              <motion.div 
                 initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                 style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(10px)" }}
                 onClick={() => setShowCustom(false)}
              />
              <motion.div 
                 initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                 style={{ zIndex: 1, width: "100%", maxWidth: 400 }}
              >
                 <Box sx={{ bgcolor: "#161b22", p: 4, borderRadius: "24px", boxShadow: "0 32px 64px rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.08)" }}>
                    <Typography variant="h6" className="heading-font" sx={{ fontWeight: 800, mb: 3 }}>Custom Dimensions</Typography>
                    <Stack spacing={3}>
                       <TextField fullWidth label="Project Name" value={customName} onChange={(e) => setCustomName(e.target.value)} />
                       <Stack direction="row" spacing={2}>
                          <TextField fullWidth label="Width" type="number" value={customSize.width} onChange={(e) => setCustomSize({ ...customSize, width: Number(e.target.value) })} InputProps={{ endAdornment: <Typography sx={{ opacity: 0.4, fontSize: "0.7rem" }}>PX</Typography> }} />
                          <TextField fullWidth label="Height" type="number" value={customSize.height} onChange={(e) => setCustomSize({ ...customSize, height: Number(e.target.value) })} InputProps={{ endAdornment: <Typography sx={{ opacity: 0.4, fontSize: "0.7rem" }}>PX</Typography> }} />
                       </Stack>
                       <Button 
                          fullWidth variant="contained" size="large" 
                          onClick={() => { onCreateProject(customName, "designer", customSize); setShowCustom(false); }}
                          sx={{ bgcolor: "#22d3ee", color: "#020617", height: 56, borderRadius: "12px", fontWeight: 800, "&:hover": { bgcolor: "#67e8f9" } }}
                       >
                          Create Design
                       </Button>
                    </Stack>
                 </Box>
              </motion.div>
            </Box>
          )}
        </AnimatePresence>

        {/* Recent Projects */}
        <Box>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
             <Typography variant="h6" className="heading-font" sx={{ fontWeight: 700, opacity: 0.8 }}>Recent Projects</Typography>
             <Button startIcon={<Clock size={16} />} sx={{ color: "inherit", opacity: 0.5, fontWeight: 700 }}>View all</Button>
          </Stack>
          
          {filteredProjects.length === 0 ? (
            <Box sx={{ py: 10, textAlign: "center", opacity: 0.2 }}>
               <FileText size={64} style={{ marginBottom: 16 }} />
               <Typography variant="h6" className="heading-font">No projects found</Typography>
            </Box>
          ) : (
            <Grid container spacing={3}>
              {filteredProjects.map((project, i) => (
                <Grid size={{ xs: 12, sm: 6, md: 3 }} key={project.id}>
                  <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}>
                    <Card sx={{ borderRadius: "16px", overflow: "hidden", position: "relative", bgcolor: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", transition: "all 0.2s ease", "&:hover": { bgcolor: "rgba(255,255,255,0.04)" } }}>
                      <CardActionArea onClick={() => onLoadProject(project.id)} sx={{ p: 2 }}>
                         <Box sx={{ 
                            width: "100%", height: 160, borderRadius: "12px", mb: 2, 
                            bgcolor: "rgba(0,0,0,0.2)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            position: "relative", overflow: "hidden"
                         }}>
                            <Box sx={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, rgba(34,211,238,0.05), transparent)" }} />
                            <Typography variant="h1" sx={{ opacity: 0.03, fontWeight: 900, letterSpacing: "-10px" }}>DODO</Typography>
                            <Box sx={{ position: "absolute", bottom: 12, right: 12, px: 1, py: 0.5, borderRadius: "6px", bgcolor: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }}>
                              <Typography sx={{ fontSize: "10px", fontWeight: 700, color: "#22d3ee" }}>{project.artboardSize.width}×{project.artboardSize.height}</Typography>
                            </Box>
                         </Box>
                         <Stack spacing={0.5}>
                            <Typography className="heading-font" sx={{ fontWeight: 700, fontSize: "0.95rem", color: "#f8fafc" }}>{project.name}</Typography>
                            <Stack direction="row" divider={<Box sx={{ width: 4, height: 4, borderRadius: "50%", bgcolor: "currentColor", opacity: 0.2 }} />} spacing={1} alignItems="center">
                               <Typography sx={{ fontSize: "0.7rem", opacity: 0.4, textTransform: "uppercase", fontWeight: 700 }}>{project.mode}</Typography>
                               <Typography sx={{ fontSize: "0.7rem", opacity: 0.4 }}>{new Date(project.lastModified).toLocaleDateString()}</Typography>
                            </Stack>
                         </Stack>
                      </CardActionArea>
                      <Box sx={{ position: "absolute", top: 8, right: 8 }}>
                         <Tooltip title="Delete">
                            <IconButton size="small" onClick={(e) => { e.stopPropagation(); onDeleteProject(project.id); }} sx={{ color: "rgba(255,79,79,0.7)", bgcolor: "rgba(0,0,0,0.2)", "&:hover": { bgcolor: "rgba(255,79,79,0.2)" } }}>
                               <Trash2 size={14} />
                            </IconButton>
                         </Tooltip>
                      </Box>
                    </Card>
                  </motion.div>
                </Grid>
              ))}
            </Grid>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default Dashboard;
