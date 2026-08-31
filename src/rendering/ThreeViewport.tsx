import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { applyPointConstraint, add, normalize, scale, sub, type Vec3 } from '../geometry-core';
import type { SceneModel, ScenePoint, ViewSettings } from './types';

interface Props {
  model: SceneModel;
  settings: ViewSettings;
  onPointMove?: (id: string, position: Vec3) => void;
  onSelectPoint?: (id: string) => void;
  selectedPointIds?: string[];
  compact?: boolean;
}

type CameraPreset = 'iso' | 'top' | 'front' | 'side';

function toThree(v: Vec3): THREE.Vector3 { return new THREE.Vector3(v.x, v.y, v.z); }
function fromThree(v: THREE.Vector3): Vec3 { return { x:v.x, y:v.y, z:v.z }; }

function disposeObject(object: THREE.Object3D) {
  object.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (mesh.geometry) mesh.geometry.dispose();
    const material = (mesh as { material?: THREE.Material | THREE.Material[] }).material;
    if (Array.isArray(material)) material.forEach((m) => m.dispose());
    else material?.dispose();
    const sprite = child as THREE.Sprite;
    const spriteMaterial = sprite.material as THREE.SpriteMaterial | undefined;
    spriteMaterial?.map?.dispose();
  });
}

function makeLabel(text: string, color = '#17343b'): THREE.Sprite {
  const canvas = document.createElement('canvas');
  const scaleFactor = 2;
  canvas.width = 320 * scaleFactor;
  canvas.height = 92 * scaleFactor;
  const context = canvas.getContext('2d')!;
  context.scale(scaleFactor, scaleFactor);
  context.font = '700 28px system-ui, sans-serif';
  const width = Math.min(300, context.measureText(text).width + 30);
  context.fillStyle = 'rgba(255,253,248,.9)';
  context.beginPath();
  context.roundRect(0, 10, width, 44, 10);
  context.fill();
  context.fillStyle = color;
  context.fillText(text, 14, 41);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const material = new THREE.SpriteMaterial({ map:texture, transparent:true, depthTest:false });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(width / 115, .7, 1);
  sprite.renderOrder = 50;
  return sprite;
}

function planeMesh(plane: { point:Vec3; normal:Vec3 }, size: number, color: string, opacity: number, settings: ViewSettings) {
  const geometry = new THREE.PlaneGeometry(size, size, 1, 1);
  const material = new THREE.MeshPhongMaterial({
    color,
    side:THREE.DoubleSide,
    transparent:true,
    opacity: settings.xray ? Math.min(opacity, .12) : opacity,
    depthWrite: !settings.xray,
    wireframe: settings.wireframe,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.copy(toThree(plane.point));
  const n = toThree(normalize(plane.normal));
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,1), n);
  return mesh;
}

function polygonMesh(points: Vec3[], color: string, opacity: number, settings: ViewSettings) {
  const geometry = new THREE.BufferGeometry();
  if (points.length < 3) return new THREE.Mesh(geometry, new THREE.MeshBasicMaterial());
  const positions:number[]=[];
  for(let i=1;i<points.length-1;i++){
    for(const p of [points[0],points[i],points[i+1]]) positions.push(p.x,p.y,p.z);
  }
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions,3));
  geometry.computeVertexNormals();
  const material = new THREE.MeshPhongMaterial({
    color, side:THREE.DoubleSide, transparent:true,
    opacity: settings.xray ? Math.min(opacity,.16) : opacity,
    depthWrite:!settings.xray,
  });
  return new THREE.Mesh(geometry,material);
}

function lineObject(a:Vec3,b:Vec3,color:string,dashed=false,emphasis=false){
  const geometry=new THREE.BufferGeometry().setFromPoints([toThree(a),toThree(b)]);
  const material=dashed
    ? new THREE.LineDashedMaterial({color,dashSize:.16,gapSize:.10,linewidth:1})
    : new THREE.LineBasicMaterial({color,linewidth:emphasis?3:1});
  const line=new THREE.Line(geometry,material);
  if(dashed) line.computeLineDistances();
  return line;
}

function polyhedronFaceGeometry(vertices:Vec3[],faces:number[][]){
  const positions:number[]=[];
  for(const face of faces){
    for(let i=1;i<face.length-1;i++){
      for(const index of [face[0],face[i],face[i+1]]){
        const p=vertices[index]; positions.push(p.x,p.y,p.z);
      }
    }
  }
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  geometry.computeVertexNormals();
  return geometry;
}

export function ThreeViewport({ model, settings, onPointMove, onSelectPoint, selectedPointIds = [], compact=false }:Props){
  const hostRef=useRef<HTMLDivElement>(null);
  const engineRef=useRef<{camera:THREE.Camera;controls:OrbitControls;renderer:THREE.WebGLRenderer;scene:THREE.Scene}|null>(null);
  const [projection,setProjection]=useState<'perspective'|'orthographic'>('perspective');
  const [preset,setPreset]=useState<CameraPreset>('iso');

  useEffect(()=>{
    const host=hostRef.current;
    if(!host) return;

    const scene=new THREE.Scene();
    scene.background=new THREE.Color('#fbfaf6');
    const renderer=new THREE.WebGLRenderer({antialias:true,alpha:false});
    renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));
    renderer.outputColorSpace=THREE.SRGBColorSpace;
    renderer.shadowMap.enabled=false;
    host.replaceChildren(renderer.domElement);

    const makeCamera=()=>{
      if(projection==='orthographic'){
        return new THREE.OrthographicCamera(-4,4,3,-3,.05,100);
      }
      return new THREE.PerspectiveCamera(43,1,.05,100);
    };
    const camera=makeCamera();
    const setCameraPreset=(value:CameraPreset)=>{
      const positions:Record<CameraPreset,[number,number,number]>={
        iso:[5.6,4.5,6.4], top:[0,.01,8], front:[0,-8,.01], side:[8,0,.01],
      };
      camera.position.set(...positions[value]);
      camera.lookAt(0,0,0);
    };
    setCameraPreset(preset);

    const controls=new OrbitControls(camera,renderer.domElement);
    controls.enableDamping=true;
    controls.dampingFactor=.07;
    controls.minDistance=2.2;
    controls.maxDistance=18;
    controls.target.set(0,0,0);

    scene.add(new THREE.HemisphereLight(0xffffff,0xc9c3b4,2.2));
    const directional=new THREE.DirectionalLight(0xffffff,2.7);
    directional.position.set(4,7,6); scene.add(directional);

    const modelGroup=new THREE.Group(); scene.add(modelGroup);
    if(settings.showGrid){
      const grid=new THREE.GridHelper(8,16,0xb8c8c5,0xdbe3e1);
      grid.rotation.x=Math.PI/2;
      (grid.material as THREE.Material).transparent=true;
      (grid.material as THREE.Material).opacity=.48;
      scene.add(grid);
    }

    const clickable:THREE.Object3D[]=[];
    const pointByMesh=new Map<string,ScenePoint>();

    if(settings.showPlanes){
      for(const item of model.planes){
        const mesh=planeMesh(item.plane,item.size??4.4,item.color??'#3b82a0',item.opacity??.2,settings);
        mesh.renderOrder=item.helper?0:1;
        modelGroup.add(mesh);
        if(settings.showLabels && item.label){
          const label=makeLabel(item.label);
          const p=add(item.plane.point,scale(normalize(item.plane.normal),.07));
          label.position.copy(toThree(add(p,vecOffset(.9,.9,.2)))); modelGroup.add(label);
        }
      }
    }

    for(const polygon of model.polygons){
      const mesh=polygonMesh(polygon.points,polygon.color??'#a85454',polygon.opacity??.22,settings);
      mesh.renderOrder=3; modelGroup.add(mesh);
      const borderPoints=[...polygon.points,polygon.points[0]];
      for(let i=0;i<borderPoints.length-1;i++) modelGroup.add(lineObject(borderPoints[i],borderPoints[i+1],polygon.color??'#a85454',false,true));
    }

    for(const item of model.polyhedra){
      const poly=item.polyhedron;
      const faceMaterial=new THREE.MeshPhongMaterial({
        color:item.color??'#60777c',transparent:true,opacity:settings.xray ? .015 : (item.faceOpacity ?? .04),
        side:THREE.DoubleSide,depthWrite:false,wireframe:settings.wireframe,
      });
      const faces=new THREE.Mesh(polyhedronFaceGeometry(poly.vertices,poly.faces),faceMaterial);
      modelGroup.add(faces);
      for(const [ia,ib] of poly.edges) modelGroup.add(lineObject(poly.vertices[ia],poly.vertices[ib],item.color??'#17343b',false,false));
      if(settings.showLabels && item.labels){
        poly.vertices.forEach((p,i)=>{
          const label=item.labels?.[i]; if(!label)return;
          const sprite=makeLabel(label); sprite.position.copy(toThree(add(p,vecOffset(.14,.14,.14)))); sprite.scale.multiplyScalar(.72); modelGroup.add(sprite);
        });
      }
    }

    for(const item of model.lines){
      const d=normalize(item.line.direction), extent=item.extent??2.5;
      const a=sub(item.line.point,scale(d,extent));
      const b=add(item.line.point,scale(d,extent));
      modelGroup.add(lineObject(a,b,item.color??'#17343b',item.dashed,item.emphasis));
      if(settings.showLabels && item.label){
        const sprite=makeLabel(item.label); sprite.position.copy(toThree(add(item.line.point,scale(d,extent*.72)))); sprite.scale.multiplyScalar(.75); modelGroup.add(sprite);
      }
    }

    for(const item of model.points){
      const selected=selectedPointIds.includes(item.id);
      const geometry=new THREE.SphereGeometry(selected ? .105 : .085,24,16);
      const material=new THREE.MeshPhongMaterial({color:selected?'#7a4f93':(item.color??'#bd7a44'),depthTest:!settings.xray});
      const mesh=new THREE.Mesh(geometry,material);
      mesh.position.copy(toThree(item.position));
      mesh.userData={pointId:item.id,draggable:item.draggable};
      modelGroup.add(mesh);
      clickable.push(mesh); pointByMesh.set(item.id,item);
      if(settings.showLabels && item.label){
        const sprite=makeLabel(item.label); sprite.position.copy(toThree(add(item.position,vecOffset(.14,.16,.12)))); sprite.scale.multiplyScalar(.7); modelGroup.add(sprite);
      }
    }

    const resize=()=>{
      const width=Math.max(280,host.clientWidth),height=Math.max(compact?330:430,host.clientHeight||0);
      renderer.setSize(width,height,false);
      if(camera instanceof THREE.PerspectiveCamera){camera.aspect=width/height;camera.updateProjectionMatrix();}
      else if(camera instanceof THREE.OrthographicCamera){
        const aspect=width/height, span=3.2;
        camera.left=-span*aspect;camera.right=span*aspect;camera.top=span;camera.bottom=-span;camera.updateProjectionMatrix();
      }
    };
    const observer=new ResizeObserver(resize); observer.observe(host); resize();

    const raycaster=new THREE.Raycaster();
    const pointer=new THREE.Vector2();
    let dragged:{item:ScenePoint;plane:THREE.Plane}|null=null;
    const pointerToNdc=(event:PointerEvent)=>{
      const rect=renderer.domElement.getBoundingClientRect();
      pointer.x=((event.clientX-rect.left)/rect.width)*2-1;
      pointer.y=-((event.clientY-rect.top)/rect.height)*2+1;
    };
    const onPointerDown=(event:PointerEvent)=>{
      pointerToNdc(event);raycaster.setFromCamera(pointer,camera);
      const hit=raycaster.intersectObjects(clickable,false)[0];
      if(!hit)return;
      const id=hit.object.userData.pointId as string;
      onSelectPoint?.(id);
      const item=pointByMesh.get(id);
      if(!item?.draggable || !onPointMove)return;
      const cameraDirection=new THREE.Vector3(); camera.getWorldDirection(cameraDirection);
      dragged={item,plane:new THREE.Plane().setFromNormalAndCoplanarPoint(cameraDirection,hit.object.position)};
      controls.enabled=false;
      renderer.domElement.setPointerCapture(event.pointerId);
    };
    const onPointerMove=(event:PointerEvent)=>{
      if(!dragged || !onPointMove)return;
      pointerToNdc(event);raycaster.setFromCamera(pointer,camera);
      const hit=new THREE.Vector3();
      if(raycaster.ray.intersectPlane(dragged.plane,hit)){
        const constrained=applyPointConstraint(fromThree(hit),dragged.item.constraint);
        onPointMove(dragged.item.id,constrained);
      }
    };
    const stopDrag=(event:PointerEvent)=>{
      if(dragged){dragged=null;controls.enabled=true;try{renderer.domElement.releasePointerCapture(event.pointerId);}catch{}}
    };
    renderer.domElement.addEventListener('pointerdown',onPointerDown);
    renderer.domElement.addEventListener('pointermove',onPointerMove);
    renderer.domElement.addEventListener('pointerup',stopDrag);
    renderer.domElement.addEventListener('pointercancel',stopDrag);

    let frame=0;
    const animate=()=>{controls.update();renderer.render(scene,camera);frame=requestAnimationFrame(animate);};animate();
    engineRef.current={camera,controls,renderer,scene};

    return()=>{
      cancelAnimationFrame(frame);observer.disconnect();controls.dispose();
      renderer.domElement.removeEventListener('pointerdown',onPointerDown);
      renderer.domElement.removeEventListener('pointermove',onPointerMove);
      renderer.domElement.removeEventListener('pointerup',stopDrag);
      renderer.domElement.removeEventListener('pointercancel',stopDrag);
      disposeObject(scene);renderer.dispose();engineRef.current=null;host.replaceChildren();
    };
  },[model,settings,projection,preset,onPointMove,onSelectPoint,selectedPointIds,compact]);

  return <div className={`three-shell ${compact?'compact':''}`}>
    <div className="viewport-toolbar" aria-label="Управление камерой">
      <button type="button" className={preset==='iso'?'active':''} onClick={()=>setPreset('iso')}>Изометрия</button>
      <button type="button" className={preset==='top'?'active':''} onClick={()=>setPreset('top')}>Сверху</button>
      <button type="button" className={preset==='front'?'active':''} onClick={()=>setPreset('front')}>Спереди</button>
      <button type="button" className={preset==='side'?'active':''} onClick={()=>setPreset('side')}>Сбоку</button>
      <button type="button" onClick={()=>setProjection((p)=>p==='perspective'?'orthographic':'perspective')}>{projection==='perspective'?'Перспектива':'Ортографика'}</button>
    </div>
    <div ref={hostRef} className="three-host" />
    {model.message && <div className="viewport-message">{model.message}</div>}
  </div>;
}

function vecOffset(x:number,y:number,z:number):Vec3{return{x,y,z};}
