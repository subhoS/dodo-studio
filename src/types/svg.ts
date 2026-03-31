export type ShapeType =
  | "rect"
  | "circle"
  | "pencil"
  | "line"
  | "arrow"
  | "text"
  | "path"
  | "image"
  | "svg"
  | "star"
  | "polygon"
  | "section";

export interface SvgElement {
  id: string;
  type: ShapeType;
  x: number;
  y: number;
  width?: number;
  height?: number;
  radius?: number; // legacy
  x2?: number;
  y2?: number;
  fill: string;
  fillStyle?: "rough" | "solid" | "hachure";
  stroke: string;
  strokeWidth: number;
  roughness: number;
  seed: number;
  visible: boolean;
  name: string;
  points?: { x: number; y: number }[];
  content?: string;
  svgContent?: string; // for imported SVG raw string
  url?: string; // for imported images (data URL)
  opacity?: number;
  strokeStyle?: "solid" | "dashed" | "dotted";
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: string | number;
  fontStyle?: string;
  textDecoration?: string;
  textTransform?: "none" | "uppercase" | "lowercase" | "capitalize";
  lineHeight?: number;
  letterSpacing?: number;
  rotation?: number;
  cornerRadius?: number;
  bowing?: number;
  sides?: number; // for polygons
  innerRadiusRatio?: number; // for stars (0 to 1)
  locked?: boolean;
  parentId?: string;
  blendMode?: string;
  dropShadow?: {
    enabled: boolean;
    color: string;
    blur: number;
    offsetX: number;
    offsetY: number;
  };
  initialWidth?: number;
  initialHeight?: number;
  pathData?: number[][][][]; // MultiPolygon format: [Polygons[Rings[Points[x, y]]]]
}

export interface CanvasSize {
  width: number;
  height: number;
  label?: string;
}

export interface Project {
  id: string;
  name: string;
  elements: SvgElement[];
  mode: "moodboard" | "designer";
  artboardSize: CanvasSize;
  lastModified: number;
  thumbnail?: string;
}
