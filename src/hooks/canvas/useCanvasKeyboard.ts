import { useEffect } from "react";
import type { SvgElement } from "../../types/svg";

interface UseCanvasKeyboardProps {
  editingTextId: string | null;
  selectedIds: string[];
  elements: SvgElement[];
  onSelect: (ids: string[] | null) => void;
  onRemoveElements: (ids: string[]) => void;
  onDuplicate: (ids: string[]) => void;
  onBringToFront: (ids: string[]) => void;
  onSendToBack: (ids: string[]) => void;
  onUndo: () => void;
  onRedo: () => void;
  onGroup: (ids: string[]) => void;
  onUngroup: (ids: string[]) => void;
  onSetActiveTool: (tool: string) => void;
}

export function useCanvasKeyboard({
  editingTextId,
  selectedIds,
  elements,
  onSelect,
  onRemoveElements,
  onDuplicate,
  onBringToFront,
  onSendToBack,
  onUndo,
  onRedo,
  onGroup,
  onUngroup,
  onSetActiveTool,
}: UseCanvasKeyboardProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip ALL canvas keyboard shortcuts when the user is typing in any input field,
      // textarea, select box, or any contentEditable (layer rename, project name, etc.)
      const focused = document.activeElement;
      const focusedTag = focused?.tagName.toLowerCase();
      if (focusedTag === "input" || focusedTag === "textarea" || focusedTag === "select") return;
      if ((focused as HTMLElement)?.isContentEditable) return;
      if (editingTextId) return;

      const isCtrl = (e.metaKey || e.ctrlKey) && !e.altKey;
      
      if (e.key.toLowerCase() === "a" && isCtrl) { e.preventDefault(); onSelect(elements.map(el => el.id)); return; }
      if (e.key.toLowerCase() === "d" && isCtrl) { e.preventDefault(); onDuplicate(selectedIds); return; }
      if (e.key.toLowerCase() === "f" && isCtrl) { e.preventDefault(); onBringToFront(selectedIds); return; }
      if (e.key.toLowerCase() === "b" && isCtrl) { e.preventDefault(); onSendToBack(selectedIds); return; }
      if (e.key.toLowerCase() === "z" && isCtrl) { e.preventDefault(); if (e.shiftKey) onRedo(); else onUndo(); return; }
      if (e.key.toLowerCase() === "y" && isCtrl) { e.preventDefault(); onRedo(); return; }
      if (e.key.toLowerCase() === "g" && isCtrl) {
        e.preventDefault();
        if (e.shiftKey) onUngroup(selectedIds);
        else onGroup(selectedIds);
        return;
      }

      if (!isCtrl) {
        switch (e.key.toLowerCase()) {
          case "v": onSetActiveTool("selection"); break;
          case "r": onSetActiveTool("rect"); break;
          case "o": onSetActiveTool("circle"); break;
          case "l": onSetActiveTool("line"); break;
          case "a": onSetActiveTool("arrow"); break;
          case "t": onSetActiveTool("text"); break;
          case "p": onSetActiveTool("pencil"); break;
          case "e": onSetActiveTool("eraser"); break;
          case "backspace":
          case "delete": if (selectedIds.length > 0) onRemoveElements(selectedIds); break;
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    editingTextId, selectedIds, elements, onSetActiveTool, onRemoveElements, 
    onSelect, onDuplicate, onBringToFront, onSendToBack, onUndo, onRedo, 
    onGroup, onUngroup
  ]);
}
