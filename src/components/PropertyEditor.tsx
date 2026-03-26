import React from "react";
import {
  Box,
  Typography,
  TextField,
  Slider,
  Stack,
  IconButton,
  Tooltip,
  Divider,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from "@mui/material";
import { Delete as DeleteIcon } from "@mui/icons-material";
import type { SvgElement } from "../hooks/useSvgStore";

interface PropertyEditorProps {
  element: SvgElement | null;
  onUpdate: (id: string, updates: Partial<SvgElement>) => void;
  onRemove: (id: string) => void;
}

const PropertyEditor: React.FC<PropertyEditorProps> = ({
  element,
  onUpdate,
  onRemove,
}) => {
  if (!element) {
    return (
      <Box sx={{ p: 3, textAlign: "center", opacity: 0.6 }}>
        <Typography variant="body1">
          Select an item to edit its properties
        </Typography>
      </Box>
    );
  }

  const handleChange = (field: keyof SvgElement, value: any) => {
    onUpdate(element.id, { [field]: value });
  };

  return (
    <Box sx={{ p: 3 }}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        mb={2}
      >
        <Typography variant="h6" sx={{ textTransform: "capitalize" }}>
          {element.type} Properties
        </Typography>
        <Tooltip title="Delete Element">
          <IconButton color="error" onClick={() => onRemove(element.id)}>
            <DeleteIcon />
          </IconButton>
        </Tooltip>
      </Stack>
      <Divider sx={{ mb: 3 }} />

      <Stack spacing={3}>
        <Stack direction="row" spacing={2}>
          <TextField
            label="X"
            type="number"
            value={element.x}
            onChange={(e) => handleChange("x", Number(e.target.value))}
            size="small"
            fullWidth
          />
          <TextField
            label="Y"
            type="number"
            value={element.y}
            onChange={(e) => handleChange("y", Number(e.target.value))}
            size="small"
            fullWidth
          />
        </Stack>

        {(element.type === "rect" || element.type === "circle") && (
          <>
            <Stack direction="row" spacing={2}>
              {element.type === "rect" && (
                <>
                  <TextField
                    label="Width"
                    type="number"
                    value={element.width}
                    onChange={(e) =>
                      handleChange("width", Number(e.target.value))
                    }
                    size="small"
                    fullWidth
                  />
                  <TextField
                    label="Height"
                    type="number"
                    value={element.height}
                    onChange={(e) =>
                      handleChange("height", Number(e.target.value))
                    }
                    size="small"
                    fullWidth
                  />
                </>
              )}
              {element.type === "circle" && (
                <TextField
                  label="Radius"
                  type="number"
                  value={element.radius}
                  onChange={(e) =>
                    handleChange("radius", Number(e.target.value))
                  }
                  size="small"
                  fullWidth
                />
              )}
            </Stack>
            <FormControl fullWidth size="small" sx={{ mt: 2 }}>
              <InputLabel id="fill-style-label">Fill Style</InputLabel>
              <Select
                labelId="fill-style-label"
                value={element.fillStyle || "rough"}
                label="Fill Style"
                onChange={(e) => handleChange("fillStyle", e.target.value)}
              >
                <MenuItem value="rough">Hand-drawn (Rough)</MenuItem>
                <MenuItem value="solid">Solid Fill</MenuItem>
              </Select>
            </FormControl>
          </>
        )}

        {element.type === "circle" && (
          <TextField
            label="Radius"
            type="number"
            value={element.radius}
            onChange={(e) => handleChange("radius", Number(e.target.value))}
            size="small"
            fullWidth
          />
        )}

        {element.type === "text" && (
          <TextField
            label="Text Content"
            value={element.content}
            onChange={(e) => handleChange("content", e.target.value)}
            size="small"
            fullWidth
            multiline
          />
        )}

        {element.type === "path" && (
          <TextField
            label="Path Data (d)"
            value={element.content}
            onChange={(e) => handleChange("content", e.target.value)}
            size="small"
            fullWidth
            multiline
            rows={3}
          />
        )}

        <Box>
          <Typography variant="caption" gutterBottom>
            Fill Color
          </Typography>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 2,
              mt: 1,
            }}
          >
            <input
              type="color"
              value={element.fill}
              onChange={(e) => handleChange("fill", e.target.value)}
              style={{
                width: 40,
                height: 40,
                border: "none",
                borderRadius: 4,
                cursor: "pointer",
              }}
            />
            <Typography variant="body2">{element.fill}</Typography>
          </Box>
        </Box>

        <Box>
          <Typography variant="caption" gutterBottom>
            Stroke Color
          </Typography>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 2,
              mt: 1,
            }}
          >
            <input
              type="color"
              value={element.stroke}
              onChange={(e) => handleChange("stroke", e.target.value)}
              style={{
                width: 40,
                height: 40,
                border: "none",
                borderRadius: 4,
                cursor: "pointer",
              }}
            />
            <Typography variant="body2">{element.stroke}</Typography>
          </Box>
        </Box>

        <Box>
          <Typography variant="caption">
            Roughness: {element.roughness}
          </Typography>
          <Slider
            value={element.roughness}
            min={0}
            max={5}
            step={0.1}
            onChange={(_, val) => handleChange("roughness", val)}
            valueLabelDisplay="auto"
          />
        </Box>

        <Box>
          <Typography variant="caption">
            Stroke Width: {element.strokeWidth}px
          </Typography>
          <Slider
            value={element.strokeWidth}
            min={0}
            max={20}
            step={1}
            onChange={(_, val) => handleChange("strokeWidth", val)}
            valueLabelDisplay="auto"
          />
        </Box>
      </Stack>
    </Box>
  );
};

export default PropertyEditor;
