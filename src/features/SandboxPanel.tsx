import { useCallback, useMemo, useState } from 'react';
import { isCollinear, lineThrough, planeFrom3Points, vec, type Vec3 } from '../geometry-core';
import { ThreeViewport } from '../rendering/ThreeViewport';
import type { SceneModel, ViewSettings } from '../rendering/types';

interface Props { settings: ViewSettings; }

type SandboxLine={id:string;a:string;b:string};
type SandboxPlane={id:string;a:string;b:string;c:string};

export function SandboxPanel({settings}:Props){
  const [points,setPoints]=useState<Record<string,Vec3>>({A:vec(-1.2,-.6,0),B:vec(1,-.5,.2),C:vec(.1,1,.6)});
  const [lines,setLines]=useState<SandboxLine[]>([]);
  const [planes,setPlanes]=useState<SandboxPlane[]>([]);
  const [selected,setSelected]=useState<string[]>([]);
  const [message,setMessage]=useState('Выберите точки на сцене и создайте из них прямую или плоскость.');

  const scene=useMemo<SceneModel>(()=>{
    const model:SceneModel={points:[],lines:[],planes:[],polygons:[],polyhedra:[],message};
    for(const [id,position] of Object.entries(points))model.points.push({id,label:id,position,color:'#bd7a44',draggable:true,emphasis:selected.includes(id)});
    for(const item of lines){
      const a=points[item.a],b=points[item.b];
      if(a&&b)model.lines.push({id:item.id,label:item.id,line:lineThrough(a,b,item.id),extent:2.2,color:'#17343b'});
    }
    for(const item of planes){
      const a=points[item.a],b=points[item.b],c=points[item.c];
      if(a&&b&&c&&!isCollinear(a,b,c))model.planes.push({id:item.id,label:item.id,plane:planeFrom3Points(a,b,c,item.id),size:4.3,color:'#3b82a0',opacity:.2});
    }
    return model;
  },[points,lines,planes,selected,message]);

  const move=useCallback((id:string,position:Vec3)=>setPoints((prev)=>({...prev,[id]:position})),[]);
  const select=useCallback((id:string)=>setSelected((prev)=>prev.includes(id)?prev.filter((x)=>x!==id):[...prev,id].slice(-3)),[]);
  const addPoint=()=>{
    const alphabet='DEFGHIJKLMNOPQRSTUVWXYZ';
    const id=[...alphabet].find((letter)=>!points[letter])??`P${Object.keys(points).length+1}`;
    const n=Object.keys(points).length;
    setPoints((prev)=>({...prev,[id]:vec(((n*1.17)%3)-1.5,((n*.83)%2.4)-1.2,((n*.57)%2)-1)}));
    setMessage(`Добавлена свободная точка ${id}. Её можно перетаскивать.`);
  };
  const addLine=()=>{
    if(selected.length<2){setMessage('Для прямой выберите две различные точки.');return;}
    const [a,b]=selected.slice(-2);const id=`${a}${b}`;
    if(!lines.some((l)=>l.id===id))setLines((prev)=>[...prev,{id,a,b}]);
    setMessage(`Построена прямая ${id} через ${a} и ${b}.`);
  };
  const addPlane=()=>{
    if(selected.length<3){setMessage('Для плоскости выберите три точки.');return;}
    const [a,b,c]=selected.slice(-3);
    if(isCollinear(points[a],points[b],points[c])){setMessage(`${a}, ${b}, ${c} коллинеарны: единственная плоскость не определяется.`);return;}
    const id=`(${a}${b}${c})`;
    if(!planes.some((p)=>p.id===id))setPlanes((prev)=>[...prev,{id,a,b,c}]);
    setMessage(`Построена плоскость ${id}.`);
  };
  const clear=()=>{setPoints({A:vec(-1.2,-.6,0),B:vec(1,-.5,.2),C:vec(.1,1,.6)});setLines([]);setPlanes([]);setSelected([]);setMessage('Песочница очищена.');};

  return <section className="sandbox-layout">
    <div className="paper-card sandbox-canvas">
      <div className="scene-head compact-head"><div><span className="eyebrow">Свободная 3D-песочница</span><h2>Конструктор геометрических объектов</h2></div></div>
      <ThreeViewport model={scene} settings={settings} onPointMove={move} onSelectPoint={select} selectedPointIds={selected}/>
    </div>
    <aside className="paper-card sandbox-tools">
      <span className="eyebrow">Инструменты</span>
      <h3>Построения</h3>
      <div className="tool-stack">
        <button type="button" onClick={addPoint}>＋ Точка</button>
        <button type="button" onClick={addLine}>— Прямая через 2 точки</button>
        <button type="button" onClick={addPlane}>▱ Плоскость через 3 точки</button>
        <button type="button" className="danger" onClick={clear}>Очистить</button>
      </div>
      <div className="selection-box"><span>Выбрано</span><div>{selected.length?selected.map((id)=><b key={id}>{id}</b>):<small>Нажмите на точки в 3D-сцене</small>}</div></div>
      <div className="sandbox-stats"><span>Точки <b>{Object.keys(points).length}</b></span><span>Прямые <b>{lines.length}</b></span><span>Плоскости <b>{planes.length}</b></span></div>
      <p className="muted">Точки можно перетаскивать. Построенные прямые и плоскости автоматически перестраиваются вслед за ними.</p>
    </aside>
  </section>;
}
