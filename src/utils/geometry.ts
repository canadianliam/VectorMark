import { Annotation, Point, ResizeHandle } from '../types/annotation';

export interface BoundingBox {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  width: number;
  height: number;
}

export function getBoundingBox(ann: Annotation): BoundingBox {
  switch (ann.type) {
    case 'rectangle': {
      const minX = Math.min(ann.x, ann.x + ann.width);
      const maxX = Math.max(ann.x, ann.x + ann.width);
      const minY = Math.min(ann.y, ann.y + ann.height);
      const maxY = Math.max(ann.y, ann.y + ann.height);
      return { minX, minY, maxX, maxY, width: maxX - minX, height: maxY - minY };
    }
    case 'circle': {
      const rx = Math.abs(ann.rx);
      const ry = Math.abs(ann.ry);
      return {
        minX: ann.cx - rx,
        minY: ann.cy - ry,
        maxX: ann.cx + rx,
        maxY: ann.cy + ry,
        width: rx * 2,
        height: ry * 2,
      };
    }
    case 'line':
    case 'arrow': {
      const minX = Math.min(ann.x1, ann.x2);
      const maxX = Math.max(ann.x1, ann.x2);
      const minY = Math.min(ann.y1, ann.y2);
      const maxY = Math.max(ann.y1, ann.y2);
      return { minX, minY, maxX, maxY, width: Math.max(maxX - minX, 10), height: Math.max(maxY - minY, 10) };
    }
    case 'highlighter': {
      if (ann.points.length === 0) {
        return { minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, height: 0 };
      }
      let minX = Infinity;
      let minY = Infinity;
      let maxX = -Infinity;
      let maxY = -Infinity;
      for (const p of ann.points) {
        if (p.x < minX) minX = p.x;
        if (p.y < minY) minY = p.y;
        if (p.x > maxX) maxX = p.x;
        if (p.y > maxY) maxY = p.y;
      }
      return { minX, minY, maxX, maxY, width: maxX - minX, height: maxY - minY };
    }
    case 'text': {
      // Estimate width based on character count and font size
      const approxWidth = Math.max(ann.text.length * (ann.fontSize * 0.6), 20);
      const approxHeight = ann.fontSize * 1.3;
      return {
        minX: ann.x,
        minY: ann.y - ann.fontSize,
        maxX: ann.x + approxWidth,
        maxY: ann.y + (approxHeight - ann.fontSize),
        width: approxWidth,
        height: approxHeight,
      };
    }
  }
}

export function isPointNearLine(
  px: number,
  py: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  threshold: number = 10
): boolean {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lengthSq = dx * dx + dy * dy;
  if (lengthSq === 0) {
    const distSq = (px - x1) * (px - x1) + (py - y1) * (py - y1);
    return Math.sqrt(distSq) <= threshold;
  }
  let t = ((px - x1) * dx + (py - y1) * dy) / lengthSq;
  t = Math.max(0, Math.min(1, t));
  const projX = x1 + t * dx;
  const projY = y1 + t * dy;
  const dist = Math.hypot(px - projX, py - projY);
  return dist <= threshold;
}

export function isPointInsideAnnotation(p: Point, ann: Annotation): boolean {
  const pad = Math.max(ann.strokeWidth, 8);
  switch (ann.type) {
    case 'rectangle': {
      const box = getBoundingBox(ann);
      return (
        p.x >= box.minX - pad &&
        p.x <= box.maxX + pad &&
        p.y >= box.minY - pad &&
        p.y <= box.maxY + pad
      );
    }
    case 'circle': {
      const rx = Math.abs(ann.rx) + pad;
      const ry = Math.abs(ann.ry) + pad;
      if (rx === 0 || ry === 0) return false;
      const dx = (p.x - ann.cx) / rx;
      const dy = (p.y - ann.cy) / ry;
      return dx * dx + dy * dy <= 1.1;
    }
    case 'line':
    case 'arrow': {
      return isPointNearLine(p.x, p.y, ann.x1, ann.y1, ann.x2, ann.y2, pad);
    }
    case 'highlighter': {
      for (let i = 0; i < ann.points.length - 1; i++) {
        if (
          isPointNearLine(
            p.x,
            p.y,
            ann.points[i].x,
            ann.points[i].y,
            ann.points[i + 1].x,
            ann.points[i + 1].y,
            pad + 4
          )
        ) {
          return true;
        }
      }
      return false;
    }
    case 'text': {
      const box = getBoundingBox(ann);
      return (
        p.x >= box.minX - pad &&
        p.x <= box.maxX + pad &&
        p.y >= box.minY - pad &&
        p.y <= box.maxY + pad
      );
    }
  }
}

/**
 * Calculates arrowhead points for canvas rendering.
 */
export function getArrowheadPoints(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  strokeWidth: number
) {
  const angle = Math.atan2(y2 - y1, x2 - x1);
  const headLength = Math.max(strokeWidth * 3.2, 14);
  const headAngle = Math.PI / 6; // 30 degrees

  const leftX = x2 - headLength * Math.cos(angle - headAngle);
  const leftY = y2 - headLength * Math.sin(angle - headAngle);
  const rightX = x2 - headLength * Math.cos(angle + headAngle);
  const rightY = y2 - headLength * Math.sin(angle + headAngle);

  return {
    tip: { x: x2, y: y2 },
    left: { x: leftX, y: leftY },
    right: { x: rightX, y: rightY },
  };
}

export function applyHandleResize(
  ann: Annotation,
  handle: ResizeHandle,
  deltaX: number,
  deltaY: number
): Annotation {
  const copy = JSON.parse(JSON.stringify(ann)) as Annotation;

  if (copy.type === 'rectangle') {
    let { x, y, width, height } = copy;
    switch (handle) {
      case 'nw':
        x += deltaX;
        y += deltaY;
        width -= deltaX;
        height -= deltaY;
        break;
      case 'n':
        y += deltaY;
        height -= deltaY;
        break;
      case 'ne':
        y += deltaY;
        width += deltaX;
        height -= deltaY;
        break;
      case 'e':
        width += deltaX;
        break;
      case 'se':
        width += deltaX;
        height += deltaY;
        break;
      case 's':
        height += deltaY;
        break;
      case 'sw':
        x += deltaX;
        width -= deltaX;
        height += deltaY;
        break;
      case 'w':
        x += deltaX;
        width -= deltaX;
        break;
    }
    copy.x = x;
    copy.y = y;
    copy.width = width;
    copy.height = height;
    return copy;
  }

  if (copy.type === 'circle') {
    let { cx, cy, rx, ry } = copy;
    switch (handle) {
      case 'nw':
        rx = Math.max(5, rx - deltaX / 2);
        ry = Math.max(5, ry - deltaY / 2);
        cx += deltaX / 2;
        cy += deltaY / 2;
        break;
      case 'ne':
        rx = Math.max(5, rx + deltaX / 2);
        ry = Math.max(5, ry - deltaY / 2);
        cx += deltaX / 2;
        cy += deltaY / 2;
        break;
      case 'se':
        rx = Math.max(5, rx + deltaX / 2);
        ry = Math.max(5, ry + deltaY / 2);
        cx += deltaX / 2;
        cy += deltaY / 2;
        break;
      case 'sw':
        rx = Math.max(5, rx - deltaX / 2);
        ry = Math.max(5, ry + deltaY / 2);
        cx += deltaX / 2;
        cy += deltaY / 2;
        break;
      case 'n':
        ry = Math.max(5, ry - deltaY / 2);
        cy += deltaY / 2;
        break;
      case 's':
        ry = Math.max(5, ry + deltaY / 2);
        cy += deltaY / 2;
        break;
      case 'w':
        rx = Math.max(5, rx - deltaX / 2);
        cx += deltaX / 2;
        break;
      case 'e':
        rx = Math.max(5, rx + deltaX / 2);
        cx += deltaX / 2;
        break;
    }
    copy.cx = cx;
    copy.cy = cy;
    copy.rx = rx;
    copy.ry = ry;
    return copy;
  }

  if (copy.type === 'line' || copy.type === 'arrow') {
    if (handle === 'p1') {
      copy.x1 += deltaX;
      copy.y1 += deltaY;
    } else if (handle === 'p2') {
      copy.x2 += deltaX;
      copy.y2 += deltaY;
    }
    return copy;
  }

  return copy;
}
