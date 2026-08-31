import { useCallback, useMemo, useState } from 'react';
import type { LearningModule } from '../learning-core/types';
import type { Vec3 } from '../geometry-core';
import { buildLearningScene, counterexampleLabel } from '../rendering/sceneBuilders';
import { ThreeViewport } from '../rendering/ThreeViewport';
import type { PointOverrides, ViewSettings } from '../rendering/types';

interface Props {
  module: LearningModule;
  settings: ViewSettings;
}

export function ExplorePanel({ module, settings }: Props) {
  const [counterexample,setCounterexample]=useState(false);
  const [overrides,setOverrides]=useState<PointOverrides>({});
  const [step,setStep]=useState(module.steps.length-1);

  const result=useMemo(()=>buildLearningScene(module,overrides,counterexample),[module,overrides,counterexample]);
  const movePoint=useCallback((id:string,position:Vec3)=>{
    setCounterexample(false);
    setOverrides((prev)=>({...prev,[id]:position}));
  },[]);

  const reset=()=>{setCounterexample(false);setOverrides({});setStep(module.steps.length-1);};

  return <section className="mode-grid explore-mode">
    <div className="visual-column">
      <div className="scene-head">
        <div>
          <span className="eyebrow">{module.kind==='axiom'?'Аксиома':'Следствие'} {module.number}</span>
          <h2>{module.title}</h2>
          <p>{module.short}</p>
        </div>
        <div className={`condition-pill ${result.conditionMet?'ok':'bad'}`}>
          <span>{result.conditionMet?'●':'○'}</span>{result.status}
        </div>
      </div>

      <ThreeViewport model={result.scene} settings={settings} onPointMove={movePoint}/>

      <div className="experiment-bar">
        <button type="button" className={counterexample?'danger active':''} onClick={()=>setCounterexample((v)=>!v)}>
          {counterexample?'Вернуть условие':counterexampleLabel(module.id)}
        </button>
        <button type="button" onClick={reset}>Сбросить эксперимент</button>
        <div className="plane-counter"><span>Число плоскостей</span><strong>{result.planeCount}</strong></div>
      </div>
    </div>

    <aside className="learning-column">
      <article className="paper-card theory-card">
        <span className="eyebrow">Формулировка</span>
        <div className="statement">{module.statement}</div>
        <p>{module.explanation}</p>
        <div className="observation"><b>Исследуйте:</b> {module.observation}</div>
        <div className="note"><b>Ключ:</b> {module.note}</div>
      </article>

      <article className="paper-card">
        <div className="card-heading-row">
          <div><span className="eyebrow">Логика</span><h3>Пошаговое раскрытие</h3></div>
          <div className="step-controls">
            <button type="button" disabled={step===0} onClick={()=>setStep((s)=>Math.max(0,s-1))}>←</button>
            <button type="button" disabled={step===module.steps.length-1} onClick={()=>setStep((s)=>Math.min(module.steps.length-1,s+1))}>→</button>
          </div>
        </div>
        <div className="step-list">
          {module.steps.map((item,index)=><div key={item.title} className={`learning-step ${index===step?'active':index<step?'done':''}`}>
            <span className="step-number">{index+1}</span>
            <div><b>{item.title}</b><p>{item.text}</p></div>
          </div>)}
        </div>
      </article>
    </aside>
  </section>;
}
