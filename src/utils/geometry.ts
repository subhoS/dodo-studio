import type { SvgElement } from "../types/svg";

// Shared canvas for measuring text exactly
let measurementCanvas: HTMLCanvasElement | null = null;
const getMeasurementContext = () => {
  if (typeof document === "undefined") return null;
  if (!measurementCanvas) {
    measurementCanvas = document.createElement("canvas");
  }
  return measurementCanvas.getContext("2d");
};

export const getTextBounds = (content: string, fontSize: number, fontFamily: string = "Inter, sans-serif") => {
  const ctx = getMeasurementContext();
  if (!ctx) {
    const lines = content.split("\n");
    const longestLine = lines.reduce((max, line) => Math.max(max, line.length), 0);
    return { width: longestLine * (fontSize * 0.6), height: lines.length * fontSize * 1.2 };
  }

  ctx.font = `${fontSize}px ${fontFamily}`;
  const lines = content.split("\n");
  let maxWidth = 0;
  for (const line of lines) {
    const metrics = ctx.measureText(line);
    maxWidth = Math.max(maxWidth, metrics.width);
  }

  return {
    width: Math.max(20, maxWidth),
    height: lines.length * fontSize * 1.2
  };
};

export interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export const getElementBounds = (element: SvgElement): Bounds => {
  let minX = element.x,
    minY = element.y,
    width = element.width || 0,
    height = element.height || 0;

  if (element.type === "line" || element.type === "arrow") {
    minX = Math.min(element.x, element.x2 || element.x);
    minY = Math.min(element.y, element.y2 || element.y);
    width = Math.max(2, Math.abs((element.x2 || element.x) - element.x));
    height = Math.max(2, Math.abs((element.y2 || element.y) - element.y));
  } else if (element.type === "pencil" && element.points && element.points.length > 0) {
    minX = element.points[0].x;
    let maxX = element.points[0].x;
    minY = element.points[0].y;
    let maxY = element.points[0].y;
    for (let i = 1; i < element.points.length; i++) {
       const p = element.points[i];
       if (p.x < minX) minX = p.x;
       if (p.x > maxX) maxX = p.x;
       if (p.y < minY) minY = p.y;
       if (p.y > maxY) maxY = p.y;
    }
    width = Math.max(2, maxX - minX);
    height = Math.max(2, maxY - minY);
  } else if (element.type === "text") {
    const fs = element.fontSize || 24;
    const { width: tw, height: th } = getTextBounds(element.content || "", fs);
    minX = element.x;
    minY = element.y;
    width = tw;
    height = th;
  } else if (element.type === "path") {
    // Uses element.x, element.y, element.width, element.height directly
    minX = element.x;
    minY = element.y;
    width = element.width || 2;
    height = element.height || 2;
  }

  if (element.rotation) {
    const cx = element.x + (element.width || 0) / 2;
    const cy = element.y + (element.height || 0) / 2;
    const rad = (element.rotation * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);

    const pts = [
      { x: minX, y: minY },
      { x: minX + width, y: minY },
      { x: minX, y: minY + height },
      { x: minX + width, y: minY + height }
    ];

    let rMinX = Infinity, rMaxX = -Infinity, rMinY = Infinity, rMaxY = -Infinity;
    for (const p of pts) {
      const rx = cos * (p.x - cx) - sin * (p.y - cy) + cx;
      const ry = sin * (p.x - cx) + cos * (p.y - cy) + cy;
      if (rx < rMinX) rMinX = rx;
      if (rx > rMaxX) rMaxX = rx;
      if (ry < rMinY) rMinY = ry;
      if (ry > rMaxY) rMaxY = ry;
    }
    minX = rMinX;
    minY = rMinY;
    width = Math.max(2, rMaxX - rMinX);
    height = Math.max(2, rMaxY - rMinY);
  }

  return { x: minX, y: minY, width, height };
};

export const isElementInBox = (element: SvgElement, box: Bounds): boolean => {
  const elBounds = getElementBounds(element);
  const minX = Math.min(box.x, box.x + box.width);
  const minY = Math.min(box.y, box.y + box.height);
  const maxX = Math.max(box.x, box.x + box.width);
  const maxY = Math.max(box.y, box.y + box.height);

  return (
    elBounds.x < maxX &&
    elBounds.x + elBounds.width > minX &&
    elBounds.y < maxY &&
    elBounds.y + elBounds.height > minY
  );
};

export const getSqSegDist = (p: { x: number; y: number }, p1: { x: number; y: number }, p2: { x: number; y: number }) => {
  let x = p1.x, y = p1.y, dx = p2.x - x, dy = p2.y - y;
  if (dx !== 0 || dy !== 0) {
    let t = ((p.x - x) * dx + (p.y - y) * dy) / (dx * dx + dy * dy);
    if (t > 1) { x = p2.x; y = p2.y; }
    else if (t > 0) { x += dx * t; y += dy * t; }
  }
  dx = p.x - x; dy = p.y - y;
  return dx * dx + dy * dy;
};

export const simplifyPath = (points: { x: number; y: number }[], tolerance: number = 1): { x: number; y: number }[] => {
  if (points.length < 3) return points;
  
  const sqTolerance = tolerance * tolerance;
  
  const simplifyStep = (pts: { x: number; y: number }[], first: number, last: number, sqTol: number, simplified: { x: number; y: number }[]) => {
    let maxSqDist = sqTol, index = -1;
    for (let i = first + 1; i < last; i++) {
      const sqDist = getSqSegDist(pts[i], pts[first], pts[last]);
      if (sqDist > maxSqDist) { index = i; maxSqDist = sqDist; }
    }
    if (index !== -1) {
      simplifyStep(pts, first, index, sqTol, simplified);
      simplified.push(pts[index]);
      simplifyStep(pts, index, last, sqTol, simplified);
    }
  };

  const simplified = [points[0]];
  simplifyStep(points, 0, points.length - 1, sqTolerance, simplified);
  simplified.push(points[points.length - 1]);
  return simplified;
};

export const isSegmentIntersectingCircle = (p1: { x: number; y: number }, p2: { x: number; y: number }, center: { x: number; y: number }, radius: number) => {
  return getSqSegDist(center, p1, p2) <= radius * radius;
};
