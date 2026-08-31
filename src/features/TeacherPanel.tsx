import type { ViewSettings } from '../rendering/types';

interface Props { settings:ViewSettings; onChange:(settings:ViewSettings)=>void; }

export function TeacherPanel({settings,onChange}:Props){
  const toggle=(key:keyof Pick<ViewSettings,'showLabels'|'showGrid'|'showPlanes'|'xray'|'wireframe'|'showSolution'>)=>onChange({...settings,[key]:!settings[key]});
  return <div className="teacher-panel">
    <div><span className="eyebrow">Режим учителя</span><b>Управление визуальной опорой</b></div>
    <div className="teacher-toggles">
      <Toggle label="Подписи" checked={settings.showLabels} onClick={()=>toggle('showLabels')}/>
      <Toggle label="Сетка" checked={settings.showGrid} onClick={()=>toggle('showGrid')}/>
      <Toggle label="Плоскости" checked={settings.showPlanes} onClick={()=>toggle('showPlanes')}/>
      <Toggle label="Рентген" checked={settings.xray} onClick={()=>toggle('xray')}/>
      <Toggle label="Каркас" checked={settings.wireframe} onClick={()=>toggle('wireframe')}/>
      <Toggle label="Решение" checked={settings.showSolution} onClick={()=>toggle('showSolution')}/>
    </div>
    <label className="support-control"><span>Опора ученика: {settings.supportLevel}/5</span><input type="range" min="1" max="5" value={settings.supportLevel} onChange={(e)=>onChange({...settings,supportLevel:Number(e.target.value) as ViewSettings['supportLevel']})}/></label>
  </div>;
}

function Toggle({label,checked,onClick}:{label:string;checked:boolean;onClick:()=>void}){
  return <button type="button" className={checked?'active':''} aria-pressed={checked} onClick={onClick}><span>{checked?'●':'○'}</span>{label}</button>;
}
