import type { SvgElement } from "../types/svg";

/**
 * Utility to parse an SVG string and convert its graphical children into
 * an array of native SvgElement objects.
 */
export function explodeSvgString(svgString: string, baseElement: SvgElement): SvgElement[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgString, "image/svg+xml");
  const svgRoot = doc.querySelector("svg");
  if (!svgRoot) return [];

  const elements: SvgElement[] = [];
  const viewBox = svgRoot.getAttribute("viewBox")?.split(/[ ,]+/).map(Number) || [0, 0, 100, 100];
  const vbW = viewBox[2] || 100;
  const vbH = viewBox[3] || 100;

  const scaleX = (baseElement.width || 100) / vbW;
  const scaleY = (baseElement.height || 100) / vbH;

  function parseElement(node: Element, inheritedProps: any) {
    if (!(node instanceof SVGElement)) return;

    const fill = node.getAttribute("fill") || inheritedProps.fill || baseElement.fill;
    const stroke = node.getAttribute("stroke") || inheritedProps.stroke || baseElement.stroke;
    const strokeWidth = parseFloat(node.getAttribute("stroke-width") || "1") * inheritedProps.strokeWidth;
    const opacity = parseFloat(node.getAttribute("opacity") || "1") * inheritedProps.opacity;

    const transform = node.getAttribute("transform") || "";
    // Basic transform parsing (translate only for now to keep it stable)
    let tx = 0, ty = 0;
    const translateMatch = transform.match(/translate\(([^,)]+)[, ]*([^)]*)\)/);
    if (translateMatch) {
      tx = parseFloat(translateMatch[1]);
      ty = parseFloat(translateMatch[2] || "0");
    }

    const currentProps = { fill, stroke, strokeWidth, opacity, tx: inheritedProps.tx + tx, ty: inheritedProps.ty + ty };

    const type = node.tagName.toLowerCase();
    let newEl: Partial<SvgElement> | null = null;

    if (type === "path") {
      newEl = {
        type: "path",
        content: node.getAttribute("d") || "",
        x: (inheritedProps.tx + tx - viewBox[0]) * scaleX + baseElement.x,
        y: (inheritedProps.ty + ty - viewBox[1]) * scaleY + baseElement.y,
        width: vbW * scaleX,
        height: vbH * scaleY,
        initialWidth: vbW,
        initialHeight: vbH,
      };
    } else if (type === "rect") {
      const rx = parseFloat(node.getAttribute("x") || "0");
      const ry = parseFloat(node.getAttribute("y") || "0");
      const rw = parseFloat(node.getAttribute("width") || "0");
      const rh = parseFloat(node.getAttribute("height") || "0");
      newEl = {
        type: "rect",
        x: (rx + inheritedProps.tx + tx - viewBox[0]) * scaleX + baseElement.x,
        y: (ry + inheritedProps.ty + ty - viewBox[1]) * scaleY + baseElement.y,
        width: rw * scaleX,
        height: rh * scaleY,
      };
    } else if (type === "circle" || type === "ellipse") {
      const cx = parseFloat(node.getAttribute("cx") || "0");
      const cy = parseFloat(node.getAttribute("cy") || "0");
      const rx = parseFloat(node.getAttribute("rx") || node.getAttribute("r") || "0");
      const ry = parseFloat(node.getAttribute("ry") || node.getAttribute("r") || "0");
      newEl = {
        type: "circle",
        x: (cx - rx + inheritedProps.tx + tx - viewBox[0]) * scaleX + baseElement.x,
        y: (cy - ry + inheritedProps.ty + ty - viewBox[1]) * scaleY + baseElement.y,
        width: rx * 2 * scaleX,
        height: ry * 2 * scaleY,
      };
    }

    if (newEl) {
      elements.push({
        ...baseElement,
        ...newEl,
        id: `exploded-${crypto.randomUUID()}`,
        name: `Part of ${baseElement.name}`,
        fill: fill === "none" ? "transparent" : fill,
        stroke: stroke === "none" ? "transparent" : stroke,
        strokeWidth: strokeWidth || 1,
        opacity: opacity,
        parentId: undefined, // Reset parent for exploded parts
      } as SvgElement);
    }

    // Recurse into children (like <g>)
    Array.from(node.children).forEach(child => parseElement(child, currentProps));
  }

  Array.from(svgRoot.children).forEach(child => parseElement(child, { 
    fill: "", stroke: "", strokeWidth: 1, opacity: 1, tx: 0, ty: 0 
  }));

  return elements;
}
