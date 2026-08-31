import type { ConvexPolyhedron, Line3, Plane3, PointConstraint, Vec3 } from '../geometry-core';

export interface ScenePoint {
  id: string;
  label: string;
  position: Vec3;
  color?: string;
  draggable?: boolean;
  constraint?: PointConstraint;
  emphasis?: boolean;
}

export interface SceneLine {
  id: string;
  label?: string;
  line: Line3;
  extent?: number;
  color?: string;
  dashed?: boolean;
  emphasis?: boolean;
}

export interface ScenePlane {
  id: string;
  label?: string;
  plane: Plane3;
  size?: number;
  color?: string;
  opacity?: number;
  helper?: boolean;
}

export interface ScenePolygon {
  id: string;
  label?: string;
  points: Vec3[];
  color?: string;
  opacity?: number;
  emphasis?: boolean;
}

export interface ScenePolyhedron {
  id: string;
  polyhedron: ConvexPolyhedron;
  labels?: string[];
  color?: string;
  faceOpacity?: number;
}

export interface SceneModel {
  points: ScenePoint[];
  lines: SceneLine[];
  planes: ScenePlane[];
  polygons: ScenePolygon[];
  polyhedra: ScenePolyhedron[];
  message?: string;
}

export interface ViewSettings {
  showLabels: boolean;
  showGrid: boolean;
  showPlanes: boolean;
  xray: boolean;
  wireframe: boolean;
  showSolution: boolean;
  supportLevel: 1 | 2 | 3 | 4 | 5;
}

export type PointOverrides = Record<string, Vec3>;
