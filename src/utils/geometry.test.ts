import { describe, it, expect } from 'vitest';
import { getElementBounds, isElementInBox, simplifyPath } from './geometry';
import type { SvgElement } from '../types/svg';

describe('geometry utilities', () => {
  describe('getElementBounds', () => {
    it('calculates bounds for a basic rectangle', () => {
      const rect: SvgElement = {
        id: '1', type: 'rect', x: 10, y: 10, width: 100, height: 50,
        name: 'rect', stroke: 'black', fill: 'none', strokeWidth: 1, roughness: 1, seed: 1, visible: true, locked: false
      };
      
      const bounds = getElementBounds(rect);
      expect(bounds).toEqual({ x: 10, y: 10, width: 100, height: 50 });
    });

    it('calculates bounds for an element with rotation (45deg)', () => {
      const rect: SvgElement = {
        id: '2', type: 'rect', x: 0, y: 0, width: 100, height: 100, rotation: 45,
        name: 'rotated', stroke: 'black', fill: 'none', strokeWidth: 1, roughness: 1, seed: 1, visible: true, locked: false
      };
      
      const bounds = getElementBounds(rect);
      // At 45 degrees, a 100x100 square centered at 50,50 
      // width and height will both be ~141.42 (100 * sqrt(2))
      // minX and minY will be ~ 50 - 70.71 = -20.71
      expect(bounds.width).toBeCloseTo(141.42, 1);
      expect(bounds.height).toBeCloseTo(141.42, 1);
      expect(bounds.x).toBeCloseTo(-20.71, 1);
      expect(bounds.y).toBeCloseTo(-20.71, 1);
    });

    it('calculates bounds for line elements with x2/y2 correctly', () => {
      const line: SvgElement = {
        id: '3', type: 'line', x: 10, y: 10, x2: 50, y2: 30,
        name: 'line', stroke: 'black', fill: 'none', strokeWidth: 1, roughness: 1, seed: 1, visible: true, locked: false
      };
      const bounds = getElementBounds(line);
      expect(bounds).toEqual({ x: 10, y: 10, width: 40, height: 20 });
    });

    it('calculates bounds for pencil paths based on the points array', () => {
      const pencil: SvgElement = {
        id: '4', type: 'pencil', x: 0, y: 0, 
        points: [{x: 10, y: 20}, {x: 40, y: 50}, {x: 5, y: 100}],
        name: 'pencil', stroke: 'black', fill: 'none', strokeWidth: 1, roughness: 1, seed: 1, visible: true, locked: false
      };
      const bounds = getElementBounds(pencil);
      expect(bounds).toEqual({ x: 5, y: 20, width: 35, height: 80 });
    });
  });

  describe('isElementInBox (marquee selection)', () => {
    it('returns true if element bounds partially intersect the selection box', () => {
      const element: SvgElement = {
        id: '5', type: 'rect', x: 50, y: 50, width: 20, height: 20,
        name: 'rect', stroke: 'black', fill: 'none', strokeWidth: 1, roughness: 1, seed: 1, visible: true, locked: false
      };
      
      const selectionBox = { x: 0, y: 0, width: 60, height: 60 };
      expect(isElementInBox(element, selectionBox)).toBe(true);
    });

    it('returns false if element bounds do not intersect the selection box', () => {
      const element: SvgElement = {
        id: '6', type: 'rect', x: 100, y: 100, width: 20, height: 20,
        name: 'rect', stroke: 'black', fill: 'none', strokeWidth: 1, roughness: 1, seed: 1, visible: true, locked: false
      };
      
      const selectionBox = { x: 0, y: 0, width: 50, height: 50 };
      expect(isElementInBox(element, selectionBox)).toBe(false);
    });
  });

  describe('simplifyPath', () => {
    it('simplifies a straight line made of many points into fewer points', () => {
      // collinear points
      const points = [
        { x: 0, y: 0 },
        { x: 10, y: 10 },
        { x: 20, y: 20 },
        { x: 30, y: 30 },
      ];
      // Tolerance of 1 should eliminate the inner collinear points
      const simplified = simplifyPath(points, 2);
      expect(simplified.length).toBeLessThan(points.length);
      expect(simplified[0]).toEqual({ x: 0, y: 0 });
      expect(simplified[simplified.length - 1]).toEqual({ x: 30, y: 30 });
    });
  });
});
