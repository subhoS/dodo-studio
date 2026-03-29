import type { SvgElement } from "../types/svg";

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
  } else if (element.type === "pencil" && element.points) {
    const xs = element.points.map((p) => p.x),
      ys = element.points.map((p) => p.y);
    minX = Math.min(...xs);
    minY = Math.min(...ys);
    width = Math.max(2, Math.max(...xs) - minX);
    height = Math.max(2, Math.max(...ys) - minY);
  } else if (element.type === "text") {
    const fs = element.fontSize || 24;
    // Improved text bounds estimation
    // 0.6 is a rough average character width ratio for Inter/Sans-serif
    // This could be further improved by using a canvas context to measure text if needed.
    const lines = (element.content || "").split("\n");
    const longestLine = lines.reduce((max, line) => (line.length > max ? line.length : max), 0);
    const ew = Math.max(20, longestLine * (fs * 0.6));
    const eh = lines.length * fs * 1.2;
    
    minX = element.x;
    minY = element.y; // dominantBaseline="hanging" means y is the top
    width = ew;
    height = eh;
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

export const simplifyPath = (points: { x: number; y: number }[], tolerance: number = 1): { x: number; y: number }[] => {
  if (points.length < 3) return points;
  
  const sqTolerance = tolerance * tolerance;
  
  const getSqSegDist = (p: { x: number; y: number }, p1: { x: number; y: number }, p2: { x: number; y: number }) => {
    let x = p1.x, y = p1.y, dx = p2.x - x, dy = p2.y - y;
    if (dx !== 0 || dy !== 0) {
      let t = ((p.x - x) * dx + (p.y - y) * dy) / (dx * dx + dy * dy);
      if (t > 1) { x = p2.x; y = p2.y; }
      else if (t > 0) { x += dx * t; y += dy * t; }
    }
    dx = p.x - x; dy = p.y - y;
    return dx * dx + dy * dy;
  };

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
