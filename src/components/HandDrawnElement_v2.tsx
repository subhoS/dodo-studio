import React, { useMemo } from "react";
import rough from "roughjs";
import type { SvgElement } from "../types/svg";

import { getElementBounds } from "../utils/geometry";

interface HandDrawnElementProps {
  element: SvgElement;
  isSelected?: boolean;
  isEditing?: boolean;
  isHovered?: boolean;
  theme?: "light" | "dark";
}

export const HandDrawnElement_v2: React.FC<HandDrawnElementProps> = ({
  element,
  isSelected,
  isEditing,
  isHovered,
  theme = "dark",
}) => {
  if (!element.visible || (element.type === "text" && isEditing)) return null;

  const generator = useMemo(() => rough.generator(), []);

  const bounds = getElementBounds(element);
  const centerX = bounds.x + bounds.width / 2;
  const centerY = bounds.y + bounds.height / 2;

  const paths = useMemo(() => {
    if (!generator || element.type === "text") return [];
    const strokeLineDash = element.strokeStyle === "dashed" ? [8, 8] : element.strokeStyle === "dotted" ? [2, 4] : undefined;
    const options: any = {
      fill: element.fill === "transparent" ? undefined : element.fill,
      stroke: element.stroke,
      strokeWidth: element.strokeWidth,
      roughness: element.strokeStyle === "solid" ? 0 : (element.roughness || 0.5),
      bowing: element.bowing ?? 1,
      seed: element.seed,
      strokeLineDash,
      fillStyle: "hachure",
    };

    if (element.fillStyle === "solid") return [];

    try {
      let shapes: any[] = [];
      switch (element.type) {
        case "rect":
          if (element.cornerRadius && element.cornerRadius > 0) {
            const r = Math.min(element.cornerRadius, (element.width || 100) / 2, (element.height || 100) / 2);
            const x = element.x, y = element.y, w = element.width || 100, h = element.height || 100;
            const path = `M ${x + r},${y} L ${x + w - r},${y} Q ${x + w},${y} ${x + w},${y + r} L ${x + w},${y + h - r} Q ${x + w},${y + h} ${x + w - r},${y + h} L ${x + r},${y + h} Q ${x},${y + h} ${x},${y + h - r} L ${x},${y + r} Q ${x},${y} ${x + r},${y} Z`;
            shapes.push(generator.path(path, options));
          } else shapes.push(generator.rectangle(element.x, element.y, element.width || 100, element.height || 100, options));
          break;
        case "circle":
          shapes.push(generator.ellipse(element.x + (element.width || 100) / 2, element.y + (element.height || 100) / 2, element.width || 100, element.height || 100, options));
          break;
        case "pencil":
          if (element.points && element.points.length > 1) shapes.push(generator.curve(element.points.map(p => [p.x, p.y]), { ...options, strokeWidth: (element.strokeWidth || 2) + 0.5 }));
          break;
        case "line":
          shapes.push(generator.line(element.x, element.y, element.x2 || element.x, element.y2 || element.y, options));
          break;
        case "arrow":
          const ax1 = element.x, ay1 = element.y, ax2 = element.x2 || element.x, ay2 = element.y2 || element.y;
          shapes.push(generator.line(ax1, ay1, ax2, ay2, options));
          const angle = Math.atan2(ay2 - ay1, ax2 - ax1), headL = Math.max(10, (element.strokeWidth||2)*5), headA = Math.PI / 6;
          shapes.push(generator.line(ax2, ay2, ax2 - headL * Math.cos(angle - headA), ay2 - headL * Math.sin(angle - headA), options));
          shapes.push(generator.line(ax2, ay2, ax2 - headL * Math.cos(angle + headA), ay2 - headL * Math.sin(angle + headA), options));
          break;
        case "path":
          if (element.content) shapes.push(generator.path(element.content, options));
          break;
      }
      return shapes.flatMap(shape => generator.toPaths(shape).map(p => ({ ...p, strokeDasharray: options.strokeLineDash?.join(" ") })));
    } catch (e) { return []; }
  }, [element, generator]);

  if (element.type === "text") {
    const fs = element.fontSize || 24;
    return (
      <g 
        transform={`rotate(${element.rotation || 0}, ${centerX}, ${centerY})`}
        style={{ pointerEvents: "all", cursor: "pointer" }}
      >
        {/* Transparent hit area */}
        <rect 
          x={bounds.x} 
          y={bounds.y} 
          width={bounds.width} 
          height={bounds.height} 
          fill="transparent" 
        />
        <text 
          x={element.x} 
          y={element.y} 
          dominantBaseline="hanging"
          style={{ 
            fontFamily: element.fontFamily || "Inter, sans-serif", 
            fontSize: `${fs}px`, 
            fontWeight: 800, 
            fill: element.stroke, 
            opacity: element.opacity ?? 1, 
            userSelect: "none", 
            whiteSpace: "pre-wrap"
          }}
        >
          {element.content || (isSelected ? "Type here..." : "")}
        </text>
      </g>
    );
  }

  if (element.type === "section") {
    return (
      <g style={{ pointerEvents: "all", cursor: isSelected ? "move" : "pointer" }}>
        <rect 
          x={element.x} y={element.y} width={element.width || 0} height={element.height || 0} rx={12} 
          fill={theme === "dark" ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)"} 
          stroke={isSelected ? "#22d3ee" : (theme === "dark" ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.1)")} 
          strokeWidth={isSelected ? 2 : 1.5}
          strokeDasharray={isSelected ? undefined : "6 4"}
        />
        <g transform={`translate(${element.x}, ${element.y - 24})`}>
           <text 
             x={0} y={16} fill={isSelected ? "#22d3ee" : (theme === "dark" ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)")} 
             style={{ fontSize: "12px", fontWeight: 700, userSelect: "none", pointerEvents: "none" }}
           >
             {element.name}
           </text>
        </g>
      </g>
    );
  }

  return (
    <g transform={`rotate(${element.rotation || 0}, ${centerX}, ${centerY})`} style={{ pointerEvents: "all", cursor: isSelected ? "move" : "pointer", opacity: element.opacity ?? 1 }}>
      <defs>
        <filter id="selection-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>
      {/* HOVER GLOW / GHOST OUTLINE */}
      {isHovered && !isSelected && (
        <g style={{ opacity: 0.4 }}>
          {element.type === "rect" && <rect x={element.x - 2} y={element.y - 2} width={(element.width || 0) + 4} height={(element.height || 0) + 4} rx={(element.cornerRadius || 0) + 2} fill="none" stroke="#4f8bff" strokeWidth="2" />}
          {element.type === "circle" && <ellipse cx={element.x + (element.width || 0) / 2} cy={element.y + (element.height || 0) / 2} rx={(element.width || 0) / 2 + 2} ry={(element.height || 0) / 2 + 2} fill="none" stroke="#4f8bff" strokeWidth="2" />}
          {(element.type === "line" || element.type === "arrow") && <line x1={element.x} y1={element.y} x2={element.x2} y2={element.y2} stroke="#4f8bff" strokeWidth={(element.strokeWidth || 2) + 4} strokeLinecap="round" />}
        </g>
      )}
      <g style={{ filter: isSelected ? "url(#selection-glow)" : "none" }}>
        {element.fillStyle === "solid" ? (
          <>
            {element.type === "rect" && <rect x={element.x} y={element.y} width={element.width} height={element.height} fill={element.fill} stroke={element.stroke} strokeWidth={element.strokeWidth} rx={element.cornerRadius} ry={element.cornerRadius} />}
            {element.type === "circle" && <ellipse cx={element.x + (element.width || 0) / 2} cy={element.y + (element.height || 0) / 2} rx={(element.width || 0) / 2} ry={(element.height || 0) / 2} fill={element.fill} stroke={element.stroke} strokeWidth={element.strokeWidth} />}
            {element.type === "line" && <line x1={element.x} y1={element.y} x2={element.x2} y2={element.y2} stroke={element.stroke} strokeWidth={element.strokeWidth} />}
            {element.type === "arrow" && (
              <g>
                <line x1={element.x} y1={element.y} x2={element.x2} y2={element.y2} stroke={element.stroke} strokeWidth={element.strokeWidth} />
                {(() => {
                  const x1 = element.x, y1 = element.y, x2 = element.x2 || 0, y2 = element.y2 || 0;
                  const angle = Math.atan2(y2 - y1, x2 - x1), headL = 15, headA = Math.PI / 6;
                  return (
                    <>
                      <line x1={x2} y1={y2} x2={x2 - headL * Math.cos(angle - headA)} y2={y2 - headL * Math.sin(angle - headA)} stroke={element.stroke} strokeWidth={element.strokeWidth} />
                      <line x1={x2} y1={y2} x2={x2 - headL * Math.cos(angle + headA)} y2={y2 - headL * Math.sin(angle + headA)} stroke={element.stroke} strokeWidth={element.strokeWidth} />
                    </>
                  );
                })()}
              </g>
            )}
            {element.type === "pencil" && element.points && (
              <polyline points={element.points.map(p => `${p.x},${p.y}`).join(" ")} fill="none" stroke={element.stroke} strokeWidth={element.strokeWidth} />
            )}
            {element.type === "image" && element.url && (
              <image 
                href={element.url} 
                x={element.x} 
                y={element.y} 
                width={element.width} 
                height={element.height} 
                preserveAspectRatio="xMidYMid meet"
              />
            )}
            {element.type === "svg" && element.svgContent && (
              <g 
                transform={`translate(${element.x},${element.y}) scale(${(element.width||100)/100}, ${(element.height||100)/100})`}
                dangerouslySetInnerHTML={{ __html: element.svgContent }} 
              />
            )}
            {element.type === "path" && element.content && (
              <path d={element.content} fill={element.fill} stroke={element.stroke} strokeWidth={element.strokeWidth} />
            )}
            {/* Sections are handled outside this block now */}
          </>
        ) : (
          <>
            {element.type === "image" && element.url && (
              <image 
                href={element.url} 
                x={element.x} 
                y={element.y} 
                width={element.width} 
                height={element.height} 
                preserveAspectRatio="xMidYMid meet"
              />
            )}
            {element.type === "svg" && element.svgContent && (
              <g 
                transform={`translate(${element.x},${element.y}) scale(${(element.width||100)/100}, ${(element.height||100)/100})`}
                dangerouslySetInnerHTML={{ __html: element.svgContent }} 
              />
            )}
            {paths.map((p: any, i: number) => <path key={`${element.id}-${i}`} d={p.d} fill={p.fill || "none"} stroke={p.stroke} strokeWidth={p.strokeWidth} strokeDasharray={p.strokeDasharray} />)}
          </>
        )}
      </g>
    </g>
  );
};
export default HandDrawnElement_v2;
