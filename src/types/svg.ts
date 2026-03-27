export type ShapeType =
  | "rect"
  | "circle"
  | "pencil"
  | "line"
  | "arrow"
  | "text"
  | "path";

export interface SvgElement {
  id: string;
  type: ShapeType;
  x: number;
  y: number;
  width?: number;
  height?: number;
  radius?: number;
  x2?: number;
  y2?: number;
  fill: string;
  fillStyle?: "rough" | "solid";
  stroke: string;
  strokeWidth: number;
  roughness: number;
  seed: number;
  visible: boolean;
  name: string;
  points?: { x: number; y: number }[];
  content?: string;
  opacity?: number;
  strokeStyle?: "solid" | "dashed" | "dotted";
  fontSize?: number;
  fontFamily?: string;
  rotation?: number;
  cornerRadius?: number;
  bowing?: number;
}
