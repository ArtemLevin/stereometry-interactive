import {
  add, cube, distance, isCollinear, lerp, lineThrough, linesParallel, linesSkew,
  normalize, planeFrom3Points, pointOnLine, scale, sectionOfConvexPolyhedron,
  sub, tetrahedron, vec,
  type Line3, type Plane3, type Vec3,
} from '../geometry-core';
import type { LearningModule } from '../learning-core/types';
import type { PointOverrides, SceneModel, ScenePlane } from './types';

const palette = {
  ink: '#17343b', sea: '#2f7180', blue: '#3b82a0', green: '#4f8a79',
  orange: '#bd7a44', red: '#a85454', violet: '#735b91', sand: '#b69a6c',
};

const emptyScene = (): SceneModel => ({ points: [], lines: [], planes: [], polygons: [], polyhedra: [] });
const pick = (overrides: PointOverrides, id: string, fallback: Vec3): Vec3 => overrides[id] ?? fallback;

function fanPlanesAroundLine(line: Line3, count = 9): ScenePlane[] {
  const d = normalize(line.direction);
  const seed = Math.abs(d.y) < .8 ? vec(0, 1, 0) : vec(0, 0, 1);
  const u = normalize({
    x: d.y * seed.z - d.z * seed.y,
    y: d.z * seed.x - d.x * seed.z,
    z: d.x * seed.y - d.y * seed.x,
  });
  const v = normalize({
    x: d.y * u.z - d.z * u.y,
    y: d.z * u.x - d.x * u.z,
    z: d.x * u.y - d.y * u.x,
  });

  return Array.from({ length: count }, (_, i) => {
    const angle = (Math.PI * i) / count;
    const normal = add(scale(u, Math.cos(angle)), scale(v, Math.sin(angle)));
    return {
      id: `fan-${i}`,
      plane: { id: `fan-${i}`, point: line.point, normal },
      size: 4.5,
      color: palette.blue,
      opacity: 0.08,
      helper: true,
    };
  });
}

export interface LearningSceneResult {
  scene: SceneModel;
  conditionMet: boolean;
  planeCount: 0 | 1 | '∞';
  status: string;
}

export function buildLearningScene(module: LearningModule, overrides: PointOverrides, counterexample: boolean): LearningSceneResult {
  switch (module.id) {
    case 'axiom-1': return buildAxiom1(overrides, counterexample);
    case 'axiom-2': return buildAxiom2(overrides, counterexample);
    case 'axiom-3': return buildAxiom3(counterexample);
    case 'consequence-1': return buildConsequence1(overrides, counterexample);
    case 'consequence-2': return buildConsequence2(counterexample);
    case 'consequence-3': return buildConsequence3(counterexample);
    default: throw new Error(`No scene builder for ${module.id}`);
  }
}

function buildAxiom1(overrides: PointOverrides, counterexample: boolean): LearningSceneResult {
  const scene = emptyScene();
  const A = vec(-1.45, -0.45, 0);
  const B = vec(1.45, -0.45, 0);
  const C = counterexample ? vec(0.1, -0.45, 0) : pick(overrides, 'C', vec(0.05, 1.1, .55));
  const line = lineThrough(A, B, 'AB');
  const collinear = isCollinear(A, B, C, 0.07);

  scene.points.push(
    { id:'A', label:'A', position:A, color:palette.orange },
    { id:'B', label:'B', position:B, color:palette.orange },
    { id:'C', label:'C', position:C, color: collinear ? palette.red : palette.orange, draggable:true },
  );
  scene.lines.push({ id:'AB', label:'AB', line, extent:2.1, color:palette.ink });

  if (collinear) {
    scene.planes.push(...fanPlanesAroundLine(line));
    scene.message = 'C лежит на AB: через эту прямую проходит бесконечно много плоскостей.';
    return { scene, conditionMet:false, planeCount:'∞', status:'Условие неколлинеарности нарушено' };
  }

  const plane = planeFrom3Points(A, B, C, 'α');
  scene.planes.push({ id:'α', label:'α', plane, size:4.3, color:palette.blue, opacity:.26 });
  scene.polygons.push({ id:'ABC', points:[A,B,C], color:palette.blue, opacity:.12 });
  scene.message = 'A, B, C неколлинеарны: плоскость α определяется однозначно.';
  return { scene, conditionMet:true, planeCount:1, status:'Условие аксиомы выполнено' };
}

function buildAxiom2(overrides: PointOverrides, counterexample: boolean): LearningSceneResult {
  const scene = emptyScene();
  const plane: Plane3 = { id:'α', point:vec(0,0,0), normal:vec(0,0,1) };
  const A = pick(overrides, 'A', vec(-1.15,-.35,0));
  const B = counterexample ? vec(.9,.35,.8) : pick(overrides, 'B', vec(1.1,.35,0));
  const line = lineThrough(A,B,'a');
  const condition = Math.abs(A.z) < .08 && Math.abs(B.z) < .08;

  scene.planes.push({ id:'α', label:'α', plane, size:4.7, color:palette.blue, opacity:.24 });
  scene.points.push(
    { id:'A', label:'A', position:A, color:palette.orange, draggable:true, constraint:{type:'on-plane', plane} },
    { id:'B', label:'B', position:B, color:condition?palette.orange:palette.red, draggable:true, constraint:counterexample?{type:'free'}:{type:'on-plane', plane} },
  );
  scene.lines.push({ id:'a', label:'a', line, extent:2.5, color:condition?palette.ink:palette.red, emphasis:true });
  scene.message = condition ? 'Обе точки прямой находятся в α — вся прямая a лежит в α.' : 'B выведена из α: аксиому 2 к этой прямой применить нельзя.';
  return { scene, conditionMet:condition, planeCount:1, status:condition?'Условие аксиомы выполнено':'Не хватает второй точки прямой в плоскости' };
}

function buildAxiom3(counterexample: boolean): LearningSceneResult {
  const scene = emptyScene();
  const alpha: Plane3 = { id:'α', point:vec(0,0,0), normal:vec(0,0,1) };
  const beta: Plane3 = counterexample
    ? { id:'β', point:vec(0,0,1.25), normal:vec(0,0,1) }
    : { id:'β', point:vec(0,0,0), normal:normalize(vec(0,.8,1)) };

  scene.planes.push(
    { id:'α', label:'α', plane:alpha, size:4.8, color:palette.blue, opacity:.24 },
    { id:'β', label:'β', plane:beta, size:4.8, color:palette.green, opacity:.24 },
  );

  if (counterexample) {
    scene.message = 'Плоскости стали параллельными и не имеют общей точки.';
    return { scene, conditionMet:false, planeCount:0, status:'Условие общей точки нарушено' };
  }

  const l: Line3 = { id:'l', point:vec(0,0,0), direction:vec(1,0,0) };
  scene.lines.push({ id:'l', label:'l = α ∩ β', line:l, extent:2.7, color:palette.red, emphasis:true });
  scene.points.push({ id:'O', label:'O', position:vec(0,0,0), color:palette.orange, emphasis:true });
  scene.message = 'Различные плоскости имеют общую точку и пересекаются по прямой l.';
  return { scene, conditionMet:true, planeCount:1, status:'Условие аксиомы выполнено' };
}

function buildConsequence1(overrides: PointOverrides, counterexample: boolean): LearningSceneResult {
  const scene = emptyScene();
  const A = vec(-1.25,-.35,0), B = vec(1.25,-.35,0);
  const line = lineThrough(A,B,'a');
  const M = counterexample ? lerp(A,B,.58) : pick(overrides,'M',vec(.15,1.05,.75));
  const onLine = pointOnLine(M,line,.08);
  scene.lines.push({ id:'a', label:'a', line, extent:2.4, color:palette.ink });
  scene.points.push(
    { id:'A', label:'A', position:A, color:palette.green },
    { id:'B', label:'B', position:B, color:palette.green },
    { id:'M', label:'M', position:M, color:onLine?palette.red:palette.orange, draggable:true },
  );
  if (onLine) {
    scene.planes.push(...fanPlanesAroundLine(line));
    scene.message='M попала на a: условие следствия нарушено, плоскость перестала быть единственной.';
    return { scene, conditionMet:false, planeCount:'∞', status:'M ∈ a — единственность потеряна' };
  }
  const plane=planeFrom3Points(A,B,M,'α');
  scene.planes.push({id:'α',label:'α',plane,size:4.5,color:palette.blue,opacity:.25});
  scene.message='a и M вне неё однозначно задают плоскость α.';
  return { scene, conditionMet:true, planeCount:1, status:'Условие следствия выполнено' };
}

function buildConsequence2(counterexample: boolean): LearningSceneResult {
  const scene=emptyScene();
  const a=lineThrough(vec(-1,0,0),vec(1,0,0),'a');
  const b=counterexample
    ? lineThrough(vec(0,-1,1),vec(0,1,1),'b')
    : lineThrough(vec(0,-1,0),vec(0,1,0),'b');
  scene.lines.push(
    {id:'a',label:'a',line:a,extent:2.5,color:palette.ink,emphasis:true},
    {id:'b',label:'b',line:b,extent:2.5,color:counterexample?palette.red:palette.green,emphasis:true},
  );
  if(counterexample){
    scene.points.push({id:'A',label:'',position:vec(0,0,0),color:palette.sand});
    scene.message=linesSkew(a,b)?'a и b стали скрещивающимися: общей плоскости не существует.':'Условие пересечения нарушено.';
    return {scene,conditionMet:false,planeCount:0,status:'Прямые скрещиваются'};
  }
  const plane:Plane3={id:'α',point:vec(0,0,0),normal:vec(0,0,1)};
  scene.planes.push({id:'α',label:'α',plane,size:4.7,color:palette.blue,opacity:.24});
  scene.points.push({id:'O',label:'O',position:vec(0,0,0),color:palette.orange,emphasis:true});
  scene.message='Пересекающиеся a и b однозначно фиксируют плоскость α.';
  return {scene,conditionMet:true,planeCount:1,status:'a ∩ b = O'};
}

function buildConsequence3(counterexample: boolean): LearningSceneResult {
  const scene=emptyScene();
  const a=lineThrough(vec(-1.4,-.65,0),vec(1.4,-.65,0),'a');
  const b=counterexample
    ? lineThrough(vec(-1.2,.75,.7),vec(1.25,.2,-.25),'b')
    : lineThrough(vec(-1.4,.65,0),vec(1.4,.65,0),'b');
  const parallel=linesParallel(a,b);
  scene.lines.push(
    {id:'a',label:'a',line:a,extent:2.3,color:palette.ink},
    {id:'b',label:'b',line:b,extent:2.3,color:parallel?palette.green:palette.red},
  );
  scene.points.push({id:'M',label:'M',position:b.point,color:palette.orange});
  if(!parallel){
    scene.message='Направление b изменено: условие параллельности нарушено.';
    return {scene,conditionMet:false,planeCount:linesSkew(a,b)?0:1,status:'a ∦ b'};
  }
  const plane:Plane3={id:'α',point:vec(0,0,0),normal:vec(0,0,1)};
  scene.planes.push({id:'α',label:'α',plane,size:4.8,color:palette.blue,opacity:.24});
  scene.message='Параллельные a и b лежат в единственной плоскости α.';
  return {scene,conditionMet:true,planeCount:1,status:'a ∥ b'};
}

export function buildTetraIntersectionScene(showSolution: boolean): SceneModel {
  const scene=emptyScene();
  const poly=tetrahedron(2.8,'SABC');
  const [A,B,C,S]=poly.vertices;
  const M=lerp(A,B,.54), N=lerp(A,C,.58);
  scene.polyhedra.push({id:'tetra',polyhedron:poly,labels:['A','B','C','S'],color:palette.ink,faceOpacity:.035});
  scene.points.push(
    {id:'M',label:'M',position:M,color:palette.orange,emphasis:true},
    {id:'N',label:'N',position:N,color:palette.orange,emphasis:true},
  );
  const plane=planeFrom3Points(S,M,N,'SMN');
  scene.planes.push({id:'SMN',label:'(SMN)',plane,size:3.8,color:palette.violet,opacity:.16});
  if(showSolution){
    scene.lines.push({id:'MN',label:'MN',line:lineThrough(M,N,'MN'),extent:1.6,color:palette.red,emphasis:true});
  }
  return scene;
}

export function cubeSectionData() {
  const poly=cube(2.6,'cube');
  const v=poly.vertices;
  const M=lerp(v[0],v[1],.36);
  const N=lerp(v[2],v[3],.42);
  const K=lerp(v[5],v[6],.58);
  const plane=planeFrom3Points(M,N,K,'section-plane');
  const section=sectionOfConvexPolyhedron(poly,plane);
  return {poly,M,N,K,plane,section};
}

export function buildCubeSectionScene(showSolution:boolean):SceneModel{
  const scene=emptyScene();
  const {poly,M,N,K,plane,section}=cubeSectionData();
  scene.polyhedra.push({id:'cube',polyhedron:poly,labels:['A','B','C','D','A₁','B₁','C₁','D₁'],color:palette.ink,faceOpacity:.025});
  scene.points.push(
    {id:'M',label:'M',position:M,color:palette.orange,emphasis:true},
    {id:'N',label:'N',position:N,color:palette.orange,emphasis:true},
    {id:'K',label:'K',position:K,color:palette.orange,emphasis:true},
  );
  if(showSolution){
    scene.planes.push({id:'section-plane',label:'γ',plane,size:4.2,color:palette.violet,opacity:.11});
    scene.polygons.push({id:'section',label:'сечение',points:section,color:palette.red,opacity:.30,emphasis:true});
  }
  return scene;
}

export function counterexampleLabel(moduleId:string):string{
  const labels:Record<string,string>={
    'axiom-1':'Сделать A, B, C коллинеарными',
    'axiom-2':'Вывести B из плоскости α',
    'axiom-3':'Развести плоскости параллельно',
    'consequence-1':'Переместить M на a',
    'consequence-2':'Сделать прямые скрещивающимися',
    'consequence-3':'Нарушить параллельность',
  };
  return labels[moduleId]??'Нарушить условие';
}
