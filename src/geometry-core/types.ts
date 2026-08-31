export type EntityId = string;

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export interface Point3 {
  id: EntityId;
  position: Vec3;
}

export interface Line3 {
  id: EntityId;
  point: Vec3;
  direction: Vec3;
}

export interface Plane3 {
  id: EntityId;
  point: Vec3;
  normal: Vec3;
}

export interface Segment3 {
  a: Vec3;
  b: Vec3;
}

export interface ConvexPolyhedron {
  id: EntityId;
  vertices: Vec3[];
  edges: Array<[number, number]>;
  faces: number[][];
}

export type PointConstraint =
  | { type: 'free' }
  | { type: 'on-line'; line: Line3 }
  | { type: 'on-plane'; plane: Plane3 }
  | { type: 'on-segment'; segment: Segment3 };
