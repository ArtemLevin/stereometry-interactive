import type { CSSProperties } from 'react';
import type { MasteryState } from '../learning-core/types';
import { masteryLevel, overallScore, skillIds, skillScore } from '../learning-core/mastery';
import { skillLabels } from '../learning-core/modules';

interface Props { mastery: MasteryState; onReset:()=>void; }

export function MasteryPanel({mastery,onReset}:Props){
  const overall=overallScore(mastery);
  return <section className="mastery-layout">
    <article className="paper-card mastery-hero">
      <span className="eyebrow">Карта мастерства</span>
      <div className="mastery-ring" style={{'--score':`${Math.round(overall*100)*3.6}deg`} as CSSProperties}>
        <div><strong>{Math.round(overall*100)}%</strong><span>общий индекс</span></div>
      </div>
      <h2>Освоение основ стереометрии</h2>
      <p>Индекс строится по диагностическим ответам и сглаживается, поэтому отражает устойчивость навыка, а не единичное попадание.</p>
      <button type="button" className="secondary" onClick={onReset}>Сбросить диагностику</button>
    </article>
    <div className="mastery-content">
      <article className="paper-card dependency-card">
        <span className="eyebrow">Карта зависимостей</span>
        <h3>Как строится теория</h3>
        <div className="dependency-map" aria-label="Зависимости аксиом и следствий">
          <div className="dep-row"><span className="dep-node">A1</span><span className="dep-node">A2</span><span className="dep-node">A3</span></div>
          <div className="dep-arrow">↓ &nbsp;&nbsp;&nbsp; ↘ &nbsp;&nbsp;&nbsp; ↓</div>
          <div className="dep-row"><span className="dep-node consequence">C1</span><span className="dep-node consequence">C2</span><span className="dep-node consequence">C3</span></div>
          <div className="dep-arrow">↘ &nbsp;&nbsp; ↓ &nbsp;&nbsp; ↙</div>
          <div className="dep-row"><span className="dep-node next">Пересечения</span><span className="dep-node next">Сечения</span></div>
        </div>
        <p>Нажимая задачи в режиме «Применяю», ученик постепенно укрепляет узлы, которые используются в следующих главах.</p>
      </article>
    <div className="mastery-grid">
      {skillIds.map((id)=>{
        const score=skillScore(mastery,id),level=masteryLevel(score),item=mastery[id];
        return <article className={`paper-card mastery-item level-${level}`} key={id}>
          <div className="mastery-item-head"><span>{id}</span><b>{Math.round(score*100)}%</b></div>
          <h3>{skillLabels[id]}</h3>
          <div className="progress-track"><i style={{width:`${score*100}%`}}/></div>
          <small>{item.attempts===0?'Пока не диагностировалось':`${item.correct} правильных из ${item.attempts}`}</small>
          <div className="level-label">{levelLabel(level)}</div>
        </article>;
      })}
    </div>
    </div>
  </section>;
}

function levelLabel(level:ReturnType<typeof masteryLevel>){
  return {new:'не изучено',learning:'изучается',mastered:'освоено',confident:'уверенно освоено'}[level];
}
