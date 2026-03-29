import React from "react";
import { Box, Typography, Stack } from "@mui/material";

interface DodoLogoProps {
  size?: number;
  showText?: boolean;
}

const DodoLogo: React.FC<DodoLogoProps> = ({ size = 32, showText = true }) => {
  return (
    <Stack direction="row" alignItems="center" spacing={1.5}>
      <Box 
        sx={{ 
          width: size, 
          height: size, 
          background: "linear-gradient(135deg, #22d3ee 0%, #3b82f6 100%)",
          borderRadius: "30% 70% 70% 30% / 30% 30% 70% 70%", // Organic D shape
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 0 20px rgba(34, 211, 238, 0.4)",
          position: "relative",
          overflow: "hidden"
        }}
      >
        <Box 
          sx={{ 
            width: "40%", 
            height: "40%", 
            bgcolor: "white", 
            borderRadius: "50%",
            position: "absolute",
            top: "20%",
            right: "20%",
            opacity: 0.9,
            boxShadow: "0 2px 4px rgba(0,0,0,0.2)"
          }} 
        />
        <Box 
          sx={{ 
            width: "20%", 
            height: "20%", 
            bgcolor: "#020617", 
            borderRadius: "50%",
            position: "absolute",
            top: "30%",
            right: "25%"
          }} 
        />
      </Box>
      {showText && (
        <Typography 
          className="heading-font"
          sx={{ 
            fontSize: size * 0.7, 
            fontWeight: 800, 
            letterSpacing: "-1.5px",
            color: "#f1f5f9",
            textTransform: "uppercase"
          }}
        >
          Dodo<span style={{ color: "#22d3ee" }}>.</span>
        </Typography>
      )}
    </Stack>
  );
};

export default DodoLogo;
