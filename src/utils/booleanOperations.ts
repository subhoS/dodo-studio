import polygonClipping from 'polygon-clipping';
import type { SvgElement } from '../types/svg';

type Point = [number, number];
type Ring = Point[];
type Polygon = Ring[];
type MultiPolygon = Polygon[];

/**
 * Converts a circle to a polygon approximation.
 */
function circleToPolygon(cx: number, cy: number, rx: number, ry: number, segments: number = 64): Ring {
  const points: Point[] = [];
  for (let i = 0; i < segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    points.push([
      cx + rx * Math.cos(angle),
      cy + ry * Math.sin(angle)
    ]);
  }
  // Close the ring
  points.push([points[0][0], points[0][1]]);
  return points;
}

/**
 * Converts a rectangle to a polygon.
 */
function rectToPolygon(x: number, y: number, w: number, h: number): Ring {
  return [
    [x, y],
    [x + w, y],
    [x + w, y + h],
    [x, y + h],
    [x, y]
  ];
}

/**
 * Converts any compatible SvgElement to a MultiPolygon structure.
 */
export function elementToPolygon(el: SvgElement): MultiPolygon | null {
  let ring: Ring = [];

  switch (el.type) {
    case 'rect':
      ring = rectToPolygon(el.x, el.y, el.width || 0, el.height || 0);
      break;
    case 'circle':
      ring = circleToPolygon(
        el.x + (el.width || 0) / 2,
        el.y + (el.height || 0) / 2,
        (el.width || 0) / 2,
        (el.height || 0) / 2
      );
      break;
    case 'pencil':
      if (el.points && el.points.length > 2) {
        ring = el.points.map(p => [p.x, p.y] as Point);
        // Ensure its closed
        if (ring[0][0] !== ring[ring.length - 1][0] || ring[0][1] !== ring[ring.length - 1][1]) {
          ring.push([...ring[0]]);
        }
      } else {
        return null;
      }
      break;
    case 'path':
      if (el.pathData) {
        // IMPORTANT: Re-apply current x/y offset to the normalized pathData
        return el.pathData.map(poly => 
          poly.map(ring => 
            ring.map(([px, py]) => [px + el.x, py + el.y] as Point)
          )
        ) as MultiPolygon;
      } else if (el.points && el.points.length > 2) {
        ring = el.points.map(p => [p.x, p.y] as Point);
        if (ring[0][0] !== ring[ring.length - 1][0] || ring[0][1] !== ring[ring.length - 1][1]) {
          ring.push([...ring[0]]);
        }
      } else {
        return null;
      }
      break;
    default:
      return null;
  }

  return [[ring]];
}

/**
 * Formats a MultiPolygon back into an SVG path 'd' attribute.
 */
export function multiPolygonToPath(multiPoly: MultiPolygon): string {
  return multiPoly
    .map(poly => poly
      .map(ring => {
        const commands = ring.map((pt, i) => `${i === 0 ? 'M' : 'L'} ${pt[0]} ${pt[1]}`);
        return commands.join(' ') + ' Z';
      })
      .join(' ')
    )
    .join(' ');
}

/**
 * Calculates the bounding box for a MultiPolygon.
 */
export function getMultiPolygonBounds(multiPoly: MultiPolygon): { x: number; y: number; width: number; height: number } {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  let hasPoints = false;

  for (const poly of multiPoly) {
    for (const ring of poly) {
      for (const [x, y] of ring) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
        hasPoints = true;
      }
    }
  }

  if (!hasPoints) return { x: 0, y: 0, width: 0, height: 0 };
  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY
  };
}

/**
 * Normalizes a MultiPolygon to its own (0,0) coordinate system.
 */
export function normalizeMultiPolygon(multiPoly: MultiPolygon, minX: number, minY: number): MultiPolygon {
  return multiPoly.map(poly => poly.map(ring => ring.map(([x, y]) => [x - minX, y - minY] as Point)));
}

/**
 * Performs a boolean operation on a set of elements and returns the resulting path, raw data, and bounds.
 */
export function performBooleanOp(
  elements: SvgElement[], 
  type: 'union' | 'intersect' | 'exclude'
): { path: string; x: number; y: number; width: number; height: number; raw: MultiPolygon } | null {
  const polys = elements
    .map(elementToPolygon)
    .filter((p): p is MultiPolygon => p !== null);

  if (polys.length < 2) return null;

  let result: MultiPolygon;

  switch (type) {
    case 'union':
      result = polygonClipping.union(polys[0], ...polys.slice(1));
      break;
    case 'intersect':
      result = polygonClipping.intersection(polys[0], ...polys.slice(1));
      break;
    case 'exclude':
      result = polygonClipping.xor(polys[0], ...polys.slice(1));
      break;
    default:
      return null;
  }

  const bounds = getMultiPolygonBounds(result);
  const normalizedResult = normalizeMultiPolygon(result, bounds.x, bounds.y);

  return {
    path: multiPolygonToPath(normalizedResult),
    ...bounds,
    raw: normalizedResult
  };
}
