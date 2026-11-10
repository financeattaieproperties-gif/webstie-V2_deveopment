import type { NormalizedPoint, NormalizedRect } from '../../shared/visual-config';

export interface ImageRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Calculates letterboxing / pillarboxing for an image rendered with CSS object-fit: contain.
 */
export function getContainedImageRect(
  containerWidth: number,
  containerHeight: number,
  naturalWidth: number,
  naturalHeight: number
): ImageRect {
  if (containerWidth <= 0 || containerHeight <= 0 || naturalWidth <= 0 || naturalHeight <= 0) {
    return { x: 0, y: 0, width: containerWidth, height: containerHeight };
  }

  const containerAspect = containerWidth / containerHeight;
  const imageAspect = naturalWidth / naturalHeight;

  let width = containerWidth;
  let height = containerHeight;
  let x = 0;
  let y = 0;

  if (containerAspect > imageAspect) {
    // Pillarboxed (bars on left and right)
    height = containerHeight;
    width = containerHeight * imageAspect;
    x = (containerWidth - width) / 2;
  } else {
    // Letterboxed (bars on top and bottom)
    width = containerWidth;
    height = containerWidth / imageAspect;
    y = (containerHeight - height) / 2;
  }

  return { x, y, width, height };
}

/**
 * Converts a client pointer coordinate into a normalized [0, 1] coordinate inside the image frame.
 * Returns null if the pointer is outside the active image content frame (e.g. in the letterbox).
 */
export function toNormalizedPoint(
  clientX: number,
  clientY: number,
  imageRect: ImageRect
): NormalizedPoint | null {
  if (imageRect.width <= 0 || imageRect.height <= 0) return null;

  const relX = clientX - imageRect.x;
  const relY = clientY - imageRect.y;

  const nx = relX / imageRect.width;
  const ny = relY / imageRect.height;

  if (nx < 0 || nx > 1 || ny < 0 || ny > 1) {
    return null;
  }

  return {
    x: Number(Math.max(0, Math.min(1, nx)).toFixed(4)),
    y: Number(Math.max(0, Math.min(1, ny)).toFixed(4)),
  };
}

/**
 * Converts an array of normalized points into an SVG polygon points string.
 */
export function toSvgPolygonPoints(
  points: NormalizedPoint[],
  renderWidth = 100,
  renderHeight = 100
): string {
  return points
    .map((p) => `${(p.x * renderWidth).toFixed(2)},${(p.y * renderHeight).toFixed(2)}`)
    .join(' ');
}

/**
 * Standard ray-casting algorithm to test if a normalized point is inside a polygon.
 */
export function pointInPolygon(
  point: NormalizedPoint,
  polygon: NormalizedPoint[]
): boolean {
  if (!polygon || polygon.length < 3) return false;

  let inside = false;
  const { x, y } = point;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x;
    const yi = polygon[i].y;
    const xj = polygon[j].x;
    const yj = polygon[j].y;

    const intersect =
      yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;

    if (intersect) inside = !inside;
  }

  return inside;
}

/**
 * Computes bounding box of a normalized polygon.
 */
export function getPolygonBoundingBox(polygon: NormalizedPoint[]): NormalizedRect {
  if (!polygon || polygon.length === 0) {
    return { x: 0, y: 0, width: 0, height: 0 };
  }

  let minX = 1;
  let maxX = 0;
  let minY = 1;
  let maxY = 0;

  for (const pt of polygon) {
    if (pt.x < minX) minX = pt.x;
    if (pt.x > maxX) maxX = pt.x;
    if (pt.y < minY) minY = pt.y;
    if (pt.y > maxY) maxY = pt.y;
  }

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

/**
 * Computes the centroid center of a normalized polygon.
 */
export function getPolygonCenter(polygon: NormalizedPoint[]): NormalizedPoint {
  if (!polygon || polygon.length === 0) return { x: 0.5, y: 0.5 };

  let sumX = 0;
  let sumY = 0;

  for (const pt of polygon) {
    sumX += pt.x;
    sumY += pt.y;
  }

  return {
    x: Number((sumX / polygon.length).toFixed(4)),
    y: Number((sumY / polygon.length).toFixed(4)),
  };
}
