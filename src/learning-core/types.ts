export type ModuleKind = 'axiom' | 'consequence';
export type SkillId =
  | 'ST-01' | 'ST-02' | 'ST-03' | 'ST-04' | 'ST-05'
  | 'ST-06' | 'ST-07' | 'ST-08' | 'ST-09' | 'ST-10';

export interface LearningStep {
  title: string;
  text: string;
}

export interface LearningModule {
  id: string;
  kind: ModuleKind;
  number: number;
  title: string;
  short: string;
  statement: string;
  explanation: string;
  observation: string;
  note: string;
  steps: LearningStep[];
  skills: SkillId[];
  prerequisites: string[];
}

export interface ProofStep {
  id: string;
  label: string;
  explanation: string;
  dependsOn: string[];
}

export interface ProofDefinition {
  moduleId: string;
  givens: string[];
  goal: string;
  steps: ProofStep[];
}

export type PlaneCountAnswer = 0 | 1 | '∞';
export type TriStateAnswer = 'true' | 'false' | 'insufficient';

export interface PlaneCountExercise {
  id: string;
  type: 'plane-count';
  prompt: string;
  answer: PlaneCountAnswer;
  explanation: string;
  skills: SkillId[];
}

export interface TriStateExercise {
  id: string;
  type: 'tri-state';
  prompt: string;
  statement: string;
  answer: TriStateAnswer;
  explanation: string;
  skills: SkillId[];
}

export interface ErrorExercise {
  id: string;
  type: 'find-error';
  prompt: string;
  lines: string[];
  errorIndex: number;
  explanation: string;
  skills: SkillId[];
}

export interface ChoiceExercise {
  id: string;
  type: 'choice';
  prompt: string;
  choices: string[];
  answerIndex: number;
  explanation: string;
  skills: SkillId[];
  scene?: 'tetra-intersection' | 'cube-section';
}

export type Exercise = PlaneCountExercise | TriStateExercise | ErrorExercise | ChoiceExercise;

export interface SkillProgress {
  attempts: number;
  correct: number;
}

export type MasteryState = Record<SkillId, SkillProgress>;
