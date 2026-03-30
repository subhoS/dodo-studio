import { useRef, useCallback } from "react";
import { isElementInBox } from "../../utils/geometry";
import type { SvgElement } from "../../types/svg";

interface UseCanvasEraserProps {
  elements: SvgElement[];
  eraserSize: number;
  eraserMode: "object" | "freeform";
  eraseFromPencil: (id: string, centers: { x: number; y: number }[], radius: number) => void;
  onRemoveElements: (ids: string[]) => void;
}

export function useCanvasEraser({
  elements,
  eraserSize,
  eraserMode,
  eraseFromPencil,
  onRemoveElements,
}: UseCanvasEraserProps) {
  const lastEraserPosRef = useRef<{ x: number; y: number } | null>(null);

  const resetEraser = useCallback(() => {
    lastEraserPosRef.current = null;
  }, []);

  const handleEraserDrag = useCallback((pos: { x: number; y: number }) => {
    const eraserRect = { 
      x: pos.x - eraserSize, 
      y: pos.y - eraserSize, 
      width: eraserSize * 2, 
      height: eraserSize * 2 
    };

    // INTERPOLATE SWIPE POINTS FOR SMOOTHNESS
    const swipePoints: { x: number; y: number }[] = [pos];
    if (lastEraserPosRef.current) {
      const last = lastEraserPosRef.current;
      const dist = Math.sqrt((pos.x - last.x) ** 2 + (pos.y - last.y) ** 2);
      const steps = Math.ceil(dist / 4); // Step every 4px
      for (let i = 1; i < steps; i++) {
        swipePoints.push({
          x: last.x + (pos.x - last.x) * (i / steps),
          y: last.y + (pos.y - last.y) * (i / steps)
        });
      }
    }
    lastEraserPosRef.current = pos;

    if (eraserMode === "freeform") {
      const toDeleteObjects: string[] = [];
      elements.forEach(el => {
        if (!el.visible || el.locked) return;
        
        if (el.type === "pencil") {
          // High-precision segment-based erase
          eraseFromPencil(el.id, swipePoints, eraserSize);
        } else {
          // FALLBACK TO BOX CHECK FOR OTHER SHAPES IN FREEFORM MODE
          if (isElementInBox(el, eraserRect)) toDeleteObjects.push(el.id);
        }
      });
      if (toDeleteObjects.length > 0) onRemoveElements(toDeleteObjects);
    } else {
      const toDelete = elements
        .filter(el => el.visible && !el.locked && isElementInBox(el, eraserRect))
        .map(el => el.id);
      if (toDelete.length > 0) onRemoveElements(toDelete);
    }
  }, [elements, eraserSize, eraserMode, eraseFromPencil, onRemoveElements]);

  return { handleEraserDrag, resetEraser };
}
