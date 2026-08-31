import type { PointConstraint, Vec3 } from './types';
import { projectPointToLine, projectPointToPlane, projectPointToSegment } from './math';

export function applyPointConstraint(position: Vec3, constraint?: PointConstraint): Vec3 {
  if (!constraint || constraint.type === 'free') return position;
  switch (constraint.type) {
    case 'on-line': return projectPointToLine(position, constraint.line);
    case 'on-plane': return projectPointToPlane(position, constraint.plane);
    case 'on-segment': return projectPointToSegment(position, constraint.segment);
  }
}
