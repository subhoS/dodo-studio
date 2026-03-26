import React, { useMemo } from "react";
import rough from "roughjs";

interface ElementProps {
  element: any;
  isSelected: boolean;
  onSelect: (id: string | null) => void;
}

const HandDrawnElement_v2: React.FC<ElementProps> = (props) => {
  const { element, isSelected, onSelect } = props;
  if (!element.visible) return null;

  // Use rough.generator for direct path generation
  const generator = useMemo(() => {
    return rough.generator();
  }, []);

  const getElementBounds = () => {
    let minX = element.x;
    let minY = element.y;
    let width = element.width || 0;
    let height = element.height || 0;

    if (element.type === "circle") {
      // For ellipse, roughjs takes center, width, height.
      // We want element.x, y to be top-left of bounding box.
      // So, minX and minY are already top-left. Width and height are diameter.
      // No change needed here for bounds calculation, as it's for the bounding box.
    } else if (element.type === "line" || element.type === "arrow") {
      minX = Math.min(element.x, element.x2 || element.x);
      minY = Math.min(element.y, element.y2 || element.y);
      width = Math.abs((element.x2 || element.x) - element.x);
      height = Math.abs((element.y2 || element.y) - element.y);
    } else if (element.type === "pencil" && element.points) {
      const xs = element.points.map((p: any) => p.x);
      const ys = element.points.map((p: any) => p.y);
      minX = Math.min(...xs);
      minY = Math.min(...ys);
      width = Math.max(...xs) - minX;
      height = Math.max(...ys) - minY;
    } else if (element.type === "text") {
      const fontSize = element.fontSize || 24;
      width = (element.content?.length || 10) * (fontSize * 0.6);
      height = fontSize * 1.4;
    }
    return { x: minX, y: minY, width, height };
  };

  const bounds = getElementBounds();
  const centerX = bounds.x + bounds.width / 2;
  const centerY = bounds.y + bounds.height / 2;

  // Compute paths for rough fill, but allow solid fill as an alternative
  const paths = useMemo(() => {
    if (!generator) return [];
    let shapes: any[] = [];

    const strokeLineDash =
      element.strokeStyle === "dashed"
        ? [8, 8]
        : element.strokeStyle === "dotted"
          ? [2, 4]
          : undefined;
    const options: any = {
      fill: element.fill === "transparent" ? undefined : element.fill,
      stroke: element.stroke,
      strokeWidth: element.strokeWidth,
      roughness: element.strokeStyle === "solid" ? element.roughness : 0,
      bowing: element.bowing !== undefined ? element.bowing : 1,
      seed: element.seed,
      strokeLineDash,
      fillStyle: "hachure",
    };

    // If fillStyle is 'solid', skip roughjs and use SVG primitives
    if (element.fillStyle === "solid") {
      return [
        {
          type: element.type,
          d: null, // Not used for solid
          fill: element.fill,
          stroke: element.stroke,
          strokeWidth: element.strokeWidth,
          strokeDasharray: strokeLineDash?.join(" "),
        },
      ];
    }

    try {
      switch (element.type) {
        case "rect":
          if (element.cornerRadius && element.cornerRadius > 0) {
            const r = Math.min(
              element.cornerRadius,
              (element.width || 100) / 2,
              (element.height || 100) / 2,
            );
            const x = element.x;
            const y = element.y;
            const w = element.width || 100;
            const h = element.height || 100;
            const path = `M ${x + r},${y} L ${x + w - r},${y} Q ${x + w},${y} ${x + w},${y + r} L ${x + w},${y + h - r} Q ${x + w},${y + h} ${x + w - r},${y + h} L ${x + r},${y + h} Q ${x},${y + h} ${x},${y + h - r} L ${x},${y + r} Q ${x},${y} ${x + r},${y} Z`;
            shapes.push(generator.path(path, options));
          } else {
            shapes.push(
              generator.rectangle(
                element.x,
                element.y,
                element.width || 100,
                element.height || 100,
                options,
              ),
            );
          }
          break;
        case "circle":
          shapes.push(
            generator.ellipse(
              element.x + (element.width || 100) / 2,
              element.y + (element.height || 100) / 2,
              element.width || 100,
              element.height || 100,
              options,
            ),
          );
          break;
        case "pencil":
          if (!element.points || element.points.length < 2) return [];
          const pencilCoords = element.points.map(
            (p: any) => [p.x, p.y] as [number, number],
          );
          shapes.push(
            generator.curve(pencilCoords, {
              ...options,
              strokeWidth: (element.strokeWidth || 2) + 0.5,
              roughness:
                element.strokeStyle === "solid" ? element.roughness || 0.5 : 0,
            }),
          );
          break;
        case "line":
          shapes.push(
            generator.line(
              element.x,
              element.y,
              element.x2 || element.x,
              element.y2 || element.y,
              options,
            ),
          );
          break;
        case "arrow":
          const x1 = element.x,
            y1 = element.y;
          const x2 = element.x2 || element.x,
            y2 = element.y2 || element.y;
          shapes.push(generator.line(x1, y1, x2, y2, options));
          const angle = Math.atan2(y2 - y1, x2 - x1);
          const headLength = 15,
            headAngle = Math.PI / 6;
          shapes.push(
            generator.line(
              x2,
              y2,
              x2 - headLength * Math.cos(angle - headAngle),
              y2 - headLength * Math.sin(angle - headAngle),
              options,
            ),
          );
          shapes.push(
            generator.line(
              x2,
              y2,
              x2 - headLength * Math.cos(angle + headAngle),
              y2 - headLength * Math.sin(angle + headAngle),
              options,
            ),
          );
          break;
        default:
          return [];
      }

      return shapes.flatMap((shape) =>
        generator.toPaths(shape).map((p) => ({
          ...p,
          strokeDasharray: options.strokeLineDash?.join(" "),
        })),
      );
    } catch (err) {
      console.error("Error generating rough path:", err);
      return [];
    }
  }, [element, generator]);

  if (element.type === "text") {
    return (
      <g
        transform={`rotate(${element.rotation || 0}, ${centerX}, ${centerY})`}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(element.id);
        }}
      >
        {isSelected &&
          (() => {
            const fontSize = element.fontSize || 24;
            const estimatedWidth =
              (element.content?.length || 10) * (fontSize * 0.6);
            return (
              <rect
                x={element.x - 5}
                y={element.y - fontSize * 0.8}
                width={estimatedWidth + 10}
                height={fontSize * 1.4}
                fill="none"
                stroke="#4f8bff"
                strokeWidth="1"
                strokeDasharray="4 4"
                style={{ pointerEvents: "none" }}
              />
            );
          })()}
        {/* Text Hit Area */}
        <rect
          x={element.x - 5}
          y={element.y - (element.fontSize || 24) * 0.8}
          width={
            (element.content?.length || 10) * ((element.fontSize || 24) * 0.6) +
            10
          }
          height={(element.fontSize || 24) * 1.4}
          fill="transparent"
          style={{ cursor: "pointer" }}
        />
        <text
          x={element.x}
          y={element.y}
          style={{
            fontFamily: element.fontFamily || "Inter, sans-serif",
            fontSize: `${element.fontSize || 24}px`,
            fontWeight: 700,
            fill: element.stroke,
            opacity: element.opacity ?? 1,
            userSelect: "none",
            pointerEvents: "all",
          }}
        >
          {element.content}
        </text>
      </g>
    );
  }

  // If solid fill, render only a single SVG shape, no roughjs, no extra paths
  if (element.fillStyle === "solid") {
    return (
      <g
        transform={`rotate(${element.rotation || 0}, ${centerX}, ${centerY})`}
        style={{
          pointerEvents: "all",
          cursor: isSelected ? "move" : "pointer",
          opacity: element.opacity ?? 1,
        }}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(element.id);
        }}
      >
        {isSelected && (
          <rect
            x={bounds.x - 10}
            y={bounds.y - 10}
            width={bounds.width + 20}
            height={bounds.height + 20}
            fill="none"
            stroke="#4f8bff"
            strokeWidth="1"
            strokeDasharray="4 4"
            style={{ pointerEvents: "none" }}
          />
        )}
        <rect
          x={bounds.x - 5}
          y={bounds.y - 5}
          width={bounds.width + 10}
          height={bounds.height + 10}
          fill="transparent"
          style={{
            pointerEvents: "all",
            cursor: isSelected ? "move" : "pointer",
          }}
        />
        {element.type === "rect" ? (
          <rect
            x={element.x}
            y={element.y}
            width={element.width}
            height={element.height}
            fill={element.fill}
            stroke={element.stroke}
            strokeWidth={element.strokeWidth}
            rx={element.cornerRadius}
            ry={element.cornerRadius}
          />
        ) : element.type === "circle" ? (
          <ellipse
            cx={element.x + (element.width || 0) / 2}
            cy={element.y + (element.height || 0) / 2}
            rx={(element.width || 0) / 2}
            ry={(element.height || 0) / 2}
            fill={element.fill}
            stroke={element.stroke}
            strokeWidth={element.strokeWidth}
          />
        ) : null}
      </g>
    );
  }

  // Otherwise, render roughjs paths as before
  return (
    <g
      transform={`rotate(${element.rotation || 0}, ${centerX}, ${centerY})`}
      style={{
        pointerEvents: "all",
        cursor: isSelected ? "move" : "pointer",
        opacity: element.opacity ?? 1,
      }}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(element.id);
      }}
    >
      {isSelected && (
        <rect
          x={bounds.x - 10}
          y={bounds.y - 10}
          width={bounds.width + 20}
          height={bounds.height + 20}
          fill="none"
          stroke="#4f8bff"
          strokeWidth="1"
          strokeDasharray="4 4"
          style={{ pointerEvents: "none" }}
        />
      )}
      <rect
        x={bounds.x - 5}
        y={bounds.y - 5}
        width={bounds.width + 10}
        height={bounds.height + 10}
        fill="transparent"
        style={{
          pointerEvents: "all",
          cursor: isSelected ? "move" : "pointer",
        }}
      />
      <g>
        {/* Invisible Hit Area for Pencil, Line, and Arrow */}
        {(element.type === "pencil" ||
          element.type === "line" ||
          element.type === "arrow") && (
          <path
            d={paths.map((p: any) => p.d).join(" ")}
            fill="none"
            stroke="transparent"
            strokeWidth={20}
            style={{ pointerEvents: "all" }}
          />
        )}
        {paths.length > 0 ? (
          paths.map((p: any, i: number) => (
            <path
              key={`${element.id}-${i}`}
              d={p.d}
              fill={p.fill || "none"}
              stroke={p.stroke}
              strokeWidth={p.strokeWidth}
              strokeDasharray={p.strokeDasharray}
            />
          ))
        ) : /* Simple Fallback if generator fails */
        element.type === "rect" ? (
          <rect
            x={element.x}
            y={element.y}
            width={element.width}
            height={element.height}
            fill={element.fill}
            stroke={element.stroke}
            strokeWidth={element.strokeWidth}
            rx={element.cornerRadius}
            ry={element.cornerRadius}
          />
        ) : element.type === "circle" ? (
          <ellipse
            cx={element.x + (element.width || 0) / 2}
            cy={element.y + (element.height || 0) / 2}
            rx={(element.width || 0) / 2}
            ry={(element.height || 0) / 2}
            fill={element.fill}
            stroke={element.stroke}
            strokeWidth={element.strokeWidth}
          />
        ) : null}
      </g>
    </g>
  );
};

export default HandDrawnElement_v2;
