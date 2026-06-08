/**
 * SLERP (Spherical Linear Interpolation) for flavor vectors.
 * Operates on normalized 300D vectors projected to 2D via PCA.
 */

export interface Vec2 { x: number; y: number; }

/** Linear interpolation between two 2D points */
export function lerp(a: Vec2, b: Vec2, t: number): Vec2 {
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
}

/** SLERP on 2D projected points (approximation: great-circle on unit circle) */
export function slerp2d(a: Vec2, b: Vec2, t: number): Vec2 {
  // Input validation: check for finite numbers
  if (!Number.isFinite(a.x) || !Number.isFinite(a.y) ||
      !Number.isFinite(b.x) || !Number.isFinite(b.y) ||
      !Number.isFinite(t)) {
    return lerp(a, b, t);
  }

  const normA = Math.sqrt(a.x * a.x + a.y * a.y);
  const normB = Math.sqrt(b.x * b.x + b.y * b.y);
  if (normA === 0 || normB === 0) return lerp(a, b, t);

  // Normalize to unit circle
  const ax = a.x / normA, ay = a.y / normA;
  const bx = b.x / normB, by = b.y / normB;

  // Dot product → angle
  const dot = ax * bx + ay * by;
  const omega = Math.acos(Math.min(1, Math.max(-1, dot)));
  // Guard for near-identical or antipodal points (omega ≈ 0 or omega ≈ π)
  if (omega < 1e-6 || Math.abs(Math.PI - omega) < 1e-6) return lerp(a, b, t);

  const sinOmega = Math.sin(omega);
  const w1 = Math.sin((1 - t) * omega) / sinOmega;
  const w2 = Math.sin(t * omega) / sinOmega;

  // Interpolate on unit sphere, then scale by interpolated magnitude
  const mag = normA * (1 - t) + normB * t;
  return {
    x: (w1 * ax + w2 * bx) * mag,
    y: (w1 * ay + w2 * by) * mag,
  };
}

/** Euclidean distance between two 2D points */
export function dist(a: Vec2, b: Vec2): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

/** Find K nearest neighbors to a point from a list of ingredients */
export function nearestK(
  point: Vec2,
  items: Array<{ name: string; nameEn: string; pos: Vec2; category: string }>,
  k: number,
  exclude: string[] = [],
) {
  // Input validation
  if (!items || !Array.isArray(items)) return [];
  if (k <= 0) return [];

  return items
    .filter(i => !exclude.includes(i.name))
    .map(i => ({ ...i, distance: dist(point, i.pos) }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, k);
}

/** Generate smooth arc points for SVG path (quadratic bezier approximation) */
export function arcPath(a: Vec2, b: Vec2, steps = 50): Vec2[] {
  return Array.from({ length: steps + 1 }, (_, i) => slerp2d(a, b, i / steps));
}
