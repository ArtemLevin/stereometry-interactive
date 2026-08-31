import type { ConvexPolyhedron, Line3, Plane3, Segment3, Vec3 } from './types';

export const EPS = 1e-7;

export const vec = (x: number, y: number, z: number): Vec3 => ({ x, y, z });
export const add = (a: Vec3, b: Vec3): Vec3 => vec(a.x + b.x, a.y + b.y, a.z + b.z);
export const sub = (a: Vec3, b: Vec3): Vec3 => vec(a.x - b.x, a.y - b.y, a.z - b.z);
export const scale = (a: Vec3, k: number): Vec3 => vec(a.x * k, a.y * k, a.z * k);
export const dot = (a: Vec3, b: Vec3): number => a.x * b.x + a.y * b.y + a.z * b.z;
export const cross = (a: Vec3, b: Vec3): Vec3 => vec(
  a.y * b.z - a.z * b.y,
  a.z * b.x - a.x * b.z,
  a.x * b.y - a.y * b.x,
);
export const length = (a: Vec3): number => Math.hypot(a.x, a.y, a.z);
export const distance = (a: Vec3, b: Vec3): number => length(sub(a, b));
export const normalize = (a: Vec3): Vec3 => {
  const l = length(a);
  if (l < EPS) throw new Error('Cannot normalize a zero vector');
  return scale(a, 1 / l);
};
export const lerp = (a: Vec3, b: Vec3, t: number): Vec3 => add(a, scale(sub(b, a), t));
export const almostEqual = (a: number, b: number, eps = EPS): boolean => Math.abs(a - b) <= eps;
export const samePoint = (a: Vec3, b: Vec3, eps = EPS): boolean => distance(a, b) <= eps;

export function lineThrough(a: Vec3, b: Vec3, id = 'line'): Line3 {
  if (samePoint(a, b)) throw new Error('A line requires two distinct points');
  return { id, point: a, direction: normalize(sub(b, a)) };
}

export function planeFrom3Points(a: Vec3, b: Vec3, c: Vec3, id = 'plane'): Plane3 {
  const normal = cross(sub(b, a), sub(c, a));
  if (length(normal) < EPS) throw new Error('Three collinear points do not determine a unique plane');
  return { id, point: a, normal: normalize(normal) };
}

export function isCollinear(a: Vec3, b: Vec3, c: Vec3, eps = EPS): boolean {
  return length(cross(sub(b, a), sub(c, a))) <= eps;
}

export function pointOnLine(p: Vec3, line: Line3, eps = 1e-6): boolean {
  return length(cross(sub(p, line.point), line.direction)) <= eps;
}

export function signedDistanceToPlane(p: Vec3, plane: Plane3): number {
  return dot(sub(p, plane.point), normalize(plane.normal));
}

export function pointOnPlane(p: Vec3, plane: Plane3, eps = 1e-6): boolean {
  return Math.abs(signedDistanceToPlane(p, plane)) <= eps;
}

export function linesParallel(a: Line3, b: Line3, eps = 1e-6): boolean {
  return length(cross(a.direction, b.direction)) <= eps;
}

export function linesCoincident(a: Line3, b: Line3, eps = 1e-6): boolean {
  return linesParallel(a, b, eps) && pointOnLine(b.point, a, eps);
}

export function linesCoplanar(a: Line3, b: Line3, eps = 1e-6): boolean {
  return Math.abs(dot(sub(b.point, a.point), cross(a.direction, b.direction))) <= eps;
}

export function linesIntersect(a: Line3, b: Line3, eps = 1e-6): boolean {
  if (linesParallel(a, b, eps)) return linesCoincident(a, b, eps);
  return linesCoplanar(a, b, eps);
}

export function linesSkew(a: Line3, b: Line3, eps = 1e-6): boolean {
  return !linesParallel(a, b, eps) && !linesCoplanar(a, b, eps);
}

export function linePlaneIntersection(line: Line3, plane: Plane3): Vec3 | null {
  const denominator = dot(plane.normal, line.direction);
  if (Math.abs(denominator) < EPS) return null;
  const t = dot(plane.normal, sub(plane.point, line.point)) / denominator;
  return add(line.point, scale(line.direction, t));
}

export function planePlaneIntersection(a: Plane3, b: Plane3, id = 'intersection'): Line3 | null {
  const direction = cross(a.normal, b.normal);
  const denom = dot(direction, direction);
  if (denom < EPS) return null;

  const d1 = dot(a.normal, a.point);
  const d2 = dot(b.normal, b.point);
  const term1 = scale(cross(b.normal, direction), d1);
  const term2 = scale(cross(direction, a.normal), d2);
  const point = scale(add(term1, term2), 1 / denom);
  return { id, point, direction: normalize(direction) };
}

export function projectPointToLine(p: Vec3, line: Line3): Vec3 {
  const d = normalize(line.direction);
  return add(line.point, scale(d, dot(sub(p, line.point), d)));
}

export function projectPointToPlane(p: Vec3, plane: Plane3): Vec3 {
  const n = normalize(plane.normal);
  return sub(p, scale(n, signedDistanceToPlane(p, plane)));
}

export function projectPointToSegment(p: Vec3, segment: Segment3): Vec3 {
  const ab = sub(segment.b, segment.a);
  const denominator = dot(ab, ab);
  if (denominator < EPS) return segment.a;
  const t = Math.max(0, Math.min(1, dot(sub(p, segment.a), ab) / denominator));
  return add(segment.a, scale(ab, t));
}

export function segmentPlaneIntersection(segment: Segment3, plane: Plane3): Vec3 | null {
  const da = signedDistanceToPlane(segment.a, plane);
  const db = signedDistanceToPlane(segment.b, plane);

  if (Math.abs(da) < EPS && Math.abs(db) < EPS) return null;
  if (da * db > EPS) return null;
  if (Math.abs(da - db) < EPS) return null;

  const t = da / (da - db);
  if (t < -EPS || t > 1 + EPS) return null;
  return lerp(segment.a, segment.b, Math.max(0, Math.min(1, t)));
}

function uniquePoints(points: Vec3[], eps = 1e-6): Vec3[] {
  const result: Vec3[] = [];
  for (const p of points) {
    if (!result.some((q) => samePoint(p, q, eps))) result.push(p);
  }
  return result;
}

export function sectionOfConvexPolyhedron(polyhedron: ConvexPolyhedron, plane: Plane3): Vec3[] {
  const points: Vec3[] = [];
  for (const [ia, ib] of polyhedron.edges) {
    const a = polyhedron.vertices[ia];
    const b = polyhedron.vertices[ib];
    if (pointOnPlane(a, plane)) points.push(a);
    if (pointOnPlane(b, plane)) points.push(b);
    const hit = segmentPlaneIntersection({ a, b }, plane);
    if (hit) points.push(hit);
  }

  const unique = uniquePoints(points);
  if (unique.length < 3) return unique;

  const centroid = scale(unique.reduce((sum, p) => add(sum, p), vec(0, 0, 0)), 1 / unique.length);
  const n = normalize(plane.normal);
  const seed = Math.abs(n.x) < 0.8 ? vec(1, 0, 0) : vec(0, 1, 0);
  const u = normalize(cross(n, seed));
  const w = normalize(cross(n, u));

  return [...unique].sort((p, q) => {
    const ap = sub(p, centroid);
    const aq = sub(q, centroid);
    const angleP = Math.atan2(dot(ap, w), dot(ap, u));
    const angleQ = Math.atan2(dot(aq, w), dot(aq, u));
    return angleP - angleQ;
  });
}

export function cube(size = 2, id = 'cube'): ConvexPolyhedron {
  const s = size / 2;
  const vertices = [
    vec(-s, -s, -s), vec(s, -s, -s), vec(s, s, -s), vec(-s, s, -s),
    vec(-s, -s, s), vec(s, -s, s), vec(s, s, s), vec(-s, s, s),
  ];
  const edges: Array<[number, number]> = [
    [0,1],[1,2],[2,3],[3,0], [4,5],[5,6],[6,7],[7,4], [0,4],[1,5],[2,6],[3,7],
  ];
  const faces = [
    [0,1,2,3],[4,5,6,7],[0,1,5,4],[1,2,6,5],[2,3,7,6],[3,0,4,7],
  ];
  return { id, vertices, edges, faces };
}

export function tetrahedron(size = 2.4, id = 'tetrahedron'): ConvexPolyhedron {
  const s = size / 2;
  const vertices = [vec(-s,-s,-s*.6), vec(s,-s,-s*.6), vec(0,s,-s*.6), vec(0,0,s)];
  const edges: Array<[number, number]> = [[0,1],[1,2],[2,0],[0,3],[1,3],[2,3]];
  const faces = [[0,1,2],[0,1,3],[1,2,3],[2,0,3]];
  return { id, vertices, edges, faces };
}
