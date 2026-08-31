import { useMemo, useState } from 'react';
import type { Exercise, MasteryState, PlaneCountAnswer, SkillId, TriStateAnswer } from '../learning-core/types';
import { shuffledExercises } from '../learning-core/exercises';
import { buildCubeSectionScene, buildTetraIntersectionScene, cubeSectionData } from '../rendering/sceneBuilders';
import { ThreeViewport } from '../rendering/ThreeViewport';
import type { ViewSettings } from '../rendering/types';

interface Props {
  settings: ViewSettings;
  mastery: MasteryState;
  onResult: (skills:SkillId[],correct:boolean)=>void;
}

type AnswerValue=PlaneCountAnswer|TriStateAnswer|number;

export function PracticePanel({settings,onResult}:Props){
  const exercises=useMemo(()=>shuffledExercises(260831),[]);
  const [index,setIndex]=useState(0);
  const [answered,setAnswered]=useState(false);
  const [correct,setCorrect]=useState(false);
  const [selected,setSelected]=useState<AnswerValue|null>(null);
  const [showSolution,setShowSolution]=useState(false);
  const exercise=exercises[index%exercises.length];

  const submit=(value:AnswerValue)=>{
    if(answered)return;
    setSelected(value);
    const ok=isCorrect(exercise,value);
    setCorrect(ok);setAnswered(true);onResult(exercise.skills,ok);
    if(exercise.type==='choice'&&exercise.scene)setShowSolution(true);
  };
  const next=()=>{setIndex((i)=>(i+1)%exercises.length);setAnswered(false);setCorrect(false);setSelected(null);setShowSolution(false);};

  return <section className="practice-layout">
    <article className="paper-card practice-card">
      <div className="practice-progress"><span>Диагностическая серия</span><b>{index+1} / {exercises.length}</b></div>
      <span className="eyebrow">{exerciseTypeLabel(exercise)}</span>
      <h2>{exercise.prompt}</h2>
      {exercise.type==='tri-state'&&<div className="math-statement">{exercise.statement}</div>}
      {exercise.type==='find-error'&&<div className="error-lines">
        {exercise.lines.map((line,i)=><button type="button" key={line} className={answered&&i===exercise.errorIndex?'is-error':''} onClick={()=>submit(i)}><span>{i+1}</span>{line}</button>)}
      </div>}
      {exercise.type==='choice'&&exercise.scene&&<ThreeViewport compact model={exercise.scene==='cube-section'?buildCubeSectionScene(showSolution):buildTetraIntersectionScene(showSolution)} settings={{...settings,showSolution}}/>}
      <AnswerButtons exercise={exercise} disabled={answered} onAnswer={submit}/>

      {answered&&<div className={`answer-feedback ${correct?'correct':'wrong'}`}>
        <b>{correct?'Верно':'Есть ошибка'}</b>
        <p>{exercise.explanation}</p>
        {exercise.id==='choice-2'&&<small>Вычисленное сечение содержит {cubeSectionData().section.length} вершин.</small>}
      </div>}
      {answered&&<button type="button" className="primary wide" onClick={next}>Следующее задание →</button>}
    </article>

    <aside className="paper-card diagnostic-note">
      <span className="eyebrow">Что диагностируется</span>
      <h3>Навыки задачи</h3>
      <div className="skill-tags">{exercise.skills.map((id)=><span key={id}>{id}</span>)}</div>
      <p>Результат сразу записывается в карту мастерства. Она использует сглаженный показатель, поэтому один случайный ответ не превращается в «100% освоено».</p>
      <div className="support-scale">
        <span>Текущий уровень опоры</span>
        <strong>{settings.supportLevel}/5</strong>
        <small>1 — максимум подсказок, 5 — экзаменационный вид.</small>
      </div>
    </aside>
  </section>;
}

function isCorrect(exercise:Exercise,value:AnswerValue):boolean{
  if(exercise.type==='plane-count')return exercise.answer===value;
  if(exercise.type==='tri-state')return exercise.answer===value;
  if(exercise.type==='find-error')return exercise.errorIndex===value;
  return exercise.answerIndex===value;
}

function exerciseTypeLabel(exercise:Exercise){
  if(exercise.type==='plane-count')return '0 / 1 / ∞ плоскостей';
  if(exercise.type==='tri-state')return 'Правда / ложь / недостаточно данных';
  if(exercise.type==='find-error')return 'Найдите ошибку';
  return exercise.scene==='cube-section'?'Сечения':'Пересечение плоскостей';
}

function AnswerButtons({exercise,disabled,onAnswer}:{exercise:Exercise;disabled:boolean;onAnswer:(value:AnswerValue)=>void}){
  if(exercise.type==='find-error')return null;
  if(exercise.type==='plane-count')return <div className="answer-grid three"><button disabled={disabled} onClick={()=>onAnswer(0)}>0</button><button disabled={disabled} onClick={()=>onAnswer(1)}>1</button><button disabled={disabled} onClick={()=>onAnswer('∞')}>∞</button></div>;
  if(exercise.type==='tri-state')return <div className="answer-grid three"><button disabled={disabled} onClick={()=>onAnswer('true')}>Правда</button><button disabled={disabled} onClick={()=>onAnswer('false')}>Ложь</button><button disabled={disabled} onClick={()=>onAnswer('insufficient')}>Недостаточно данных</button></div>;
  return <div className="answer-grid">{exercise.choices.map((choice,i)=><button key={choice} disabled={disabled} onClick={()=>onAnswer(i)}>{choice}</button>)}</div>;
}
