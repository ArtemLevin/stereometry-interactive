import { useMemo, useState } from 'react';
import type { LearningModule } from '../learning-core/types';
import { proofs, validateNextProofStep } from '../learning-core/proofs';

interface Props { module: LearningModule; }

export function ProofPanel({module}:Props){
  const definition=proofs[module.id];
  const [completed,setCompleted]=useState<string[]>([]);
  const [feedback,setFeedback]=useState('Выберите логически допустимый следующий шаг.');
  const [why,setWhy]=useState<string|null>(null);

  const completedSteps=useMemo(()=>definition?.steps.filter((s)=>completed.includes(s.id))??[],[definition,completed]);

  if(!definition){
    return <section className="empty-state paper-card">
      <span className="eyebrow">Доказательство</span>
      <h2>{module.kind==='axiom'?'Аксиома принимается без доказательства':'Для этого утверждения доказательство не задано'}</h2>
      <p>{module.kind==='axiom'?'Переключитесь в «Исследование»: там можно экспериментально увидеть, почему условия аксиомы существенны.':'Выберите одно из трёх следствий в меню слева.'}</p>
    </section>;
  }

  const choose=(id:string)=>{
    const validation=validateNextProofStep(definition,completed,id);
    setFeedback(validation.message);
    if(validation.valid){setCompleted((prev)=>[...prev,id]);setWhy(id);}
  };
  const complete=completed.length===definition.steps.length;

  return <section className="proof-layout">
    <article className="paper-card proof-board">
      <div className="scene-head compact-head">
        <div><span className="eyebrow">Конструктор доказательства</span><h2>{module.title}</h2></div>
        <div className={`condition-pill ${complete?'ok':''}`}>{complete?'✓ Доказано':`${completed.length}/${definition.steps.length} шагов`}</div>
      </div>
      <div className="proof-givens">
        <div><span>Дано</span>{definition.givens.map((g)=><b key={g}>{g}</b>)}</div>
        <div><span>Цель</span><b>{definition.goal}</b></div>
      </div>
      <div className="proof-chain">
        {completedSteps.map((step,index)=><button key={step.id} type="button" className="proof-node complete" onClick={()=>setWhy(step.id)}>
          <span>{index+1}</span><b>{step.label}</b><small>Почему?</small>
        </button>)}
        {!complete && <div className="proof-node placeholder"><span>?</span><b>Выберите следующий вывод</b></div>}
      </div>
      <div className={`proof-feedback ${complete?'success':''}`}>{complete?'Доказательство собрано корректно. Теперь попробуйте восстановить его с нуля без подсказок.':feedback}</div>
      <button type="button" className="secondary" onClick={()=>{setCompleted([]);setFeedback('Выберите логически допустимый следующий шаг.');setWhy(null);}}>Начать заново</button>
    </article>

    <aside className="paper-card proof-palette">
      <span className="eyebrow">Доступные карточки</span>
      <h3>Какой шаг следует сейчас?</h3>
      <div className="proof-options">
        {definition.steps.map((step)=><button key={step.id} type="button" disabled={completed.includes(step.id)} onClick={()=>choose(step.id)}>
          {step.label}
        </button>)}
      </div>
      <div className="why-panel">
        <span className="eyebrow">Почему?</span>
        {why ? <>
          <b>{definition.steps.find((s)=>s.id===why)?.label}</b>
          <p>{definition.steps.find((s)=>s.id===why)?.explanation}</p>
        </> : <p>Нажмите на уже доказанный шаг, чтобы увидеть его обоснование.</p>}
      </div>
    </aside>
  </section>;
}
