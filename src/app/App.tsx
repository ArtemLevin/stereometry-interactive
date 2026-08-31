import { useEffect, useMemo, useState } from 'react';
import { learningModules, moduleById } from '../learning-core/modules';
import { emptyMastery, overallScore, updateMastery } from '../learning-core/mastery';
import type { MasteryState, SkillId } from '../learning-core/types';
import type { ViewSettings } from '../rendering/types';
import { ExplorePanel } from '../features/ExplorePanel';
import { ProofPanel } from '../features/ProofPanel';
import { PracticePanel } from '../features/PracticePanel';
import { SandboxPanel } from '../features/SandboxPanel';
import { MasteryPanel } from '../features/MasteryPanel';
import { TeacherPanel } from '../features/TeacherPanel';

type Mode='explore'|'prove'|'practice'|'sandbox'|'mastery';

const defaultSettings:ViewSettings={
  showLabels:true,showGrid:true,showPlanes:true,xray:false,wireframe:false,showSolution:false,supportLevel:2,
};

function loadMastery():MasteryState{
  try{
    const raw=localStorage.getItem('stereometry-mastery-v1');
    if(raw)return {...emptyMastery(),...JSON.parse(raw)} as MasteryState;
  }catch{/* localStorage may be disabled */}
  return emptyMastery();
}

export function App(){
  const [selectedModuleId,setSelectedModuleId]=useState('axiom-1');
  const [mode,setMode]=useState<Mode>('explore');
  const [teacherMode,setTeacherMode]=useState(false);
  const [settings,setSettings]=useState<ViewSettings>(defaultSettings);
  const [mastery,setMastery]=useState<MasteryState>(loadMastery);
  const module=useMemo(()=>moduleById(selectedModuleId),[selectedModuleId]);
  const overall=overallScore(mastery);
  const score=Math.round(overall*100);
  const adaptiveLevel=Math.max(1,Math.min(5,1+Math.floor(overall*5))) as ViewSettings['supportLevel'];
  const effectiveSettings:ViewSettings=teacherMode?settings:{
    ...settings,
    supportLevel:adaptiveLevel,
    showLabels:adaptiveLevel<4,
    showGrid:adaptiveLevel<4,
    showPlanes:adaptiveLevel<5,
  };

  useEffect(()=>{
    try{localStorage.setItem('stereometry-mastery-v1',JSON.stringify(mastery));}catch{/* optional persistence */}
  },[mastery]);

  const recordResult=(skills:SkillId[],correct:boolean)=>setMastery((prev)=>updateMastery(prev,skills,correct));
  const selectModule=(id:string)=>{setSelectedModuleId(id);if(mode==='mastery'||mode==='sandbox')setMode('explore');};

  return <div className="app-shell">
    <header className="topbar">
      <div className="brand">
        <div className="brand-mark">Σ</div>
        <div><strong>Интерактивная стереометрия</strong><span>Лаборатория аксиом, доказательств и сечений</span></div>
      </div>
      <div className="top-actions">
        <div className="top-progress"><span>Мастерство</span><b>{score}%</b></div>
        <button type="button" className={teacherMode?'teacher-active':''} onClick={()=>setTeacherMode((v)=>!v)}>⌁ Режим учителя</button>
      </div>
    </header>

    {teacherMode&&<TeacherPanel settings={settings} onChange={setSettings}/>} 

    <div className="workspace">
      <aside className="course-nav">
        <div className="nav-intro"><span className="eyebrow">Глава 1</span><h1>Аксиомы стереометрии</h1><p>От пространственного эксперимента к доказательству.</p></div>
        <ModuleGroup title="Аксиомы" kind="axiom" active={selectedModuleId} onSelect={selectModule}/>
        <ModuleGroup title="Следствия" kind="consequence" active={selectedModuleId} onSelect={selectModule}/>
        <div className="course-path">
          <span>Следующие главы</span>
          <div className="path-node ready">Пересечение плоскостей</div>
          <div className="path-node ready">Многогранники</div>
          <div className="path-node ready">Сечения</div>
          <div className="path-node locked">Параллельность</div>
          <div className="path-node locked">Перпендикулярность</div>
        </div>
      </aside>

      <main className="content-area">
        <nav className="mode-tabs" aria-label="Режим обучения">
          <ModeButton id="explore" label="Исследую" icon="◉" mode={mode} setMode={setMode}/>
          <ModeButton id="prove" label="Доказываю" icon="◇" mode={mode} setMode={setMode}/>
          <ModeButton id="practice" label="Применяю" icon="✓" mode={mode} setMode={setMode}/>
          <ModeButton id="sandbox" label="Песочница" icon="＋" mode={mode} setMode={setMode}/>
          <ModeButton id="mastery" label="Мастерство" icon="◎" mode={mode} setMode={setMode}/>
        </nav>

        {mode==='explore'&&<ExplorePanel key={`explore-${module.id}`} module={module} settings={effectiveSettings}/>} 
        {mode==='prove'&&<ProofPanel key={`proof-${module.id}`} module={module}/>} 
        {mode==='practice'&&<PracticePanel settings={effectiveSettings} mastery={mastery} onResult={recordResult}/>} 
        {mode==='sandbox'&&<SandboxPanel settings={effectiveSettings}/>} 
        {mode==='mastery'&&<MasteryPanel mastery={mastery} onReset={()=>setMastery(emptyMastery())}/>} 
      </main>
    </div>

    <footer className="app-footer"><span>Исследуйте → сформулируйте → сломайте условие → докажите → примените</span><span>Стереометрия · интерактивный курс</span></footer>
  </div>;
}

function ModuleGroup({title,kind,active,onSelect}:{title:string;kind:'axiom'|'consequence';active:string;onSelect:(id:string)=>void}){
  const items=learningModules.filter((item)=>item.kind===kind);
  return <section className="module-group"><span className="group-title">{title}</span>{items.map((item)=><button type="button" key={item.id} className={active===item.id?'active':''} onClick={()=>onSelect(item.id)}>
    <span className="module-number">{kind==='axiom'?'A':'C'}{item.number}</span>
    <span><b>{item.title}</b><small>{item.short}</small></span>
  </button>)}</section>;
}

function ModeButton({id,label,icon,mode,setMode}:{id:Mode;label:string;icon:string;mode:Mode;setMode:(m:Mode)=>void}){
  return <button type="button" className={mode===id?'active':''} onClick={()=>setMode(id)}><span>{icon}</span>{label}</button>;
}
