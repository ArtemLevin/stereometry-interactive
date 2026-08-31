import type { MasteryState, SkillId } from './types';
import { skillLabels } from './modules';

export const skillIds = Object.keys(skillLabels) as SkillId[];

export function emptyMastery(): MasteryState {
  return Object.fromEntries(skillIds.map((id) => [id, { attempts: 0, correct: 0 }])) as MasteryState;
}

export function updateMastery(state: MasteryState, skills: SkillId[], correct: boolean): MasteryState {
  const next: MasteryState = structuredClone(state);
  for (const skill of skills) {
    next[skill].attempts += 1;
    if (correct) next[skill].correct += 1;
  }
  return next;
}

export function skillScore(state: MasteryState, skill: SkillId): number {
  const item = state[skill];
  if (!item || item.attempts === 0) return 0;
  return (item.correct + 1) / (item.attempts + 2);
}

export function overallScore(state: MasteryState): number {
  return skillIds.reduce((sum, id) => sum + skillScore(state, id), 0) / skillIds.length;
}

export function masteryLevel(score: number): 'new' | 'learning' | 'mastered' | 'confident' {
  if (score <= 0.01) return 'new';
  if (score < 0.68) return 'learning';
  if (score < 0.86) return 'mastered';
  return 'confident';
}
