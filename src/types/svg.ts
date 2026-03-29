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
  rotation?: number;
  cornerRadius?: number;
  bowing?: number;
  locked?: boolean;
  parentId?: string;
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
