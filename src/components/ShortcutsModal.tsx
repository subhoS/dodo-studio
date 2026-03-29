import React from "react";
import { Box, Typography, Modal, Backdrop, Fade, Stack, Divider, IconButton } from "@mui/material";
import { X, Command } from "lucide-react";

interface ShortcutsModalProps {
  open: boolean;
  onClose: () => void;
  theme: "light" | "dark";
}

const ShortcutRow: React.FC<{ keys: string[]; label: string; theme: string }> = ({ keys, label, theme }) => (
  <Stack direction="row" justifyContent="space-between" alignItems="center" py={1}>
    <Typography sx={{ fontSize: "0.85rem", opacity: 0.8, fontWeight: 500 }}>{label}</Typography>
    <Stack direction="row" spacing={0.5}>
      {keys.map((k, i) => (
        <Box key={i} sx={{ 
          px: 0.8, py: 0.4, 
          borderRadius: "6px", 
          border: `1px solid ${theme === "dark" ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.1)"}`,
          bgcolor: theme === "dark" ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)",
          fontSize: "0.75rem",
          fontWeight: 800,
          color: "#4f8bff",
          minWidth: 24,
          textAlign: "center"
        }}>
          {k}
        </Box>
      ))}
    </Stack>
  </Stack>
);

const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ open, onClose, theme }) => {
  const isDark = theme === "dark";
  const bg = isDark ? "rgba(11,14,20,0.95)" : "rgba(255,255,255,0.95)";

  return (
    <Modal
      open={open}
      onClose={onClose}
      closeAfterTransition
      slots={{ backdrop: Backdrop }}
      slotProps={{
        backdrop: { timeout: 500, sx: { backdropFilter: "blur(8px)", bgcolor: "rgba(0,0,0,0.4)" } },
      }}
    >
      <Fade in={open}>
        <Box sx={{
          position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
          width: 440,
          maxHeight: "80vh",
          overflowY: "auto",
          bgcolor: bg,
          backdropFilter: "blur(20px)",
          borderRadius: "24px",
          border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}`,
          boxShadow: "0 32px 64px rgba(0,0,0,0.4)",
          p: 4,
          outline: "none"
        }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
            <Stack direction="row" spacing={1.5} alignItems="center">
               <Box sx={{ p: 1, bgcolor: "rgba(79,139,255,0.1)", borderRadius: "12px", color: "#4f8bff" }}>
                  <Command size={20} />
               </Box>
               <Typography variant="h6" sx={{ fontWeight: 900, fontSize: "1.1rem" }}>Keyboard Shortcuts</Typography>
            </Stack>
            <IconButton onClick={onClose} sx={{ color: isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)" }}>
               <X size={20} />
            </IconButton>
          </Stack>

          <Typography sx={{ fontSize: "0.7rem", fontWeight: 900, color: "#4f8bff", letterSpacing: "1px", mb: 1 }}>TOOLS</Typography>
          <ShortcutRow keys={["V"]} label="Selection Tool" theme={theme} />
          <ShortcutRow keys={["R"]} label="Rectangle Tool" theme={theme} />
          <ShortcutRow keys={["O"]} label="Circle Tool" theme={theme} />
          <ShortcutRow keys={["L"]} label="Line Tool" theme={theme} />
          <ShortcutRow keys={["A"]} label="Arrow Tool" theme={theme} />
          <ShortcutRow keys={["P"]} label="Pencil Tool" theme={theme} />
          <ShortcutRow keys={["T"]} label="Text Tool" theme={theme} />

          <Divider sx={{ my: 2, opacity: 0.1 }} />
          <Typography sx={{ fontSize: "0.7rem", fontWeight: 900, color: "#4f8bff", letterSpacing: "1px", mb: 1 }}>ORGANIZATION</Typography>
          <ShortcutRow keys={["⌘", "G"]} label="Group Selected" theme={theme} />
          <ShortcutRow keys={["⌘", "⇧", "G"]} label="Ungroup Selected" theme={theme} />
          <ShortcutRow keys={["⌘", "A"]} label="Select All" theme={theme} />
          <ShortcutRow keys={["⌘", "D"]} label="Duplicate Selected" theme={theme} />
          <ShortcutRow keys={["⌘", "F"]} label="Bring to Front" theme={theme} />
          <ShortcutRow keys={["⌘", "B"]} label="Send to Back" theme={theme} />

          <Divider sx={{ my: 2, opacity: 0.1 }} />
          <Typography sx={{ fontSize: "0.7rem", fontWeight: 900, color: "#4f8bff", letterSpacing: "1px", mb: 1 }}>CANVAS</Typography>
          <ShortcutRow keys={["Space", "Drag"]} label="Pan Workspace" theme={theme} />
          <ShortcutRow keys={["Scroll"]} label="Zoom In / Out" theme={theme} />
          <ShortcutRow keys={["⇧", "Drag"]} label="Constrain Ratios / Snap" theme={theme} />
          <ShortcutRow keys={["⌥", "Drag"]} label="Create from Center" theme={theme} />

          <Divider sx={{ my: 2, opacity: 0.1 }} />
          <Typography sx={{ fontSize: "0.7rem", fontWeight: 900, color: "#4f8bff", letterSpacing: "1px", mb: 1 }}>ACTIONS</Typography>
          <ShortcutRow keys={["⌘", "Z"]} label="Undo" theme={theme} />
          <ShortcutRow keys={["⌘", "⇧", "Z"]} label="Redo" theme={theme} />
          <ShortcutRow keys={["?"]} label="Show Help" theme={theme} />
        </Box>
      </Fade>
    </Modal>
  );
};

export default ShortcutsModal;
