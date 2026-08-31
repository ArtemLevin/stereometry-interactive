import { describe, expect, it } from 'vitest';
import {
  cube, isCollinear, lineThrough, linesParallel, linesSkew, planeFrom3Points,
  planePlaneIntersection, pointOnLine, pointOnPlane, sectionOfConvexPolyhedron, vec,
} from '../src/geometry-core';

describe('geometry core',()=>{
  it('distinguishes collinear and non-collinear triples',()=>{
    expect(isCollinear(vec(0,0,0),vec(1,0,0),vec(3,0,0))).toBe(true);
    expect(isCollinear(vec(0,0,0),vec(1,0,0),vec(0,1,0))).toBe(false);
  });

  it('builds a plane from three points',()=>{
    const plane=planeFrom3Points(vec(0,0,0),vec(1,0,0),vec(0,1,0));
    expect(pointOnPlane(vec(.3,.7,0),plane)).toBe(true);
    expect(pointOnPlane(vec(0,0,1),plane)).toBe(false);
  });

  it('detects parallel and skew lines',()=>{
    const a=lineThrough(vec(0,0,0),vec(1,0,0));
    const parallel=lineThrough(vec(0,1,0),vec(1,1,0));
    const skew=lineThrough(vec(0,1,1),vec(0,2,1));
    expect(linesParallel(a,parallel)).toBe(true);
    expect(linesSkew(a,skew)).toBe(true);
  });

  it('finds plane-plane intersection',()=>{
    const alpha=planeFrom3Points(vec(0,0,0),vec(1,0,0),vec(0,1,0));
    const beta=planeFrom3Points(vec(0,0,0),vec(1,0,0),vec(0,0,1));
    const line=planePlaneIntersection(alpha,beta);
    expect(line).not.toBeNull();
    expect(pointOnLine(vec(2,0,0),line!)).toBe(true);
  });

  it('computes a convex section of a cube',()=>{
    const poly=cube(2);
    const plane=planeFrom3Points(vec(-1,-.2,-1),vec(1,.2,-1),vec(1,.2,1));
    const section=sectionOfConvexPolyhedron(poly,plane);
    expect(section.length).toBeGreaterThanOrEqual(4);
    section.forEach((p)=>expect(pointOnPlane(p,plane,1e-5)).toBe(true));
  });
});
