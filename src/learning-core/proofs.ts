import type { ProofDefinition } from './types';

export const proofs: Record<string, ProofDefinition> = {
  'consequence-1': {
    moduleId: 'consequence-1',
    givens: ['Дана прямая a', 'M ∉ a'],
    goal: 'Доказать: через a и M проходит единственная плоскость',
    steps: [
      { id: 'c1-s1', label: 'Выберем A, B ∈ a, A ≠ B', explanation: 'На любой прямой можно выбрать две различные точки.', dependsOn: [] },
      { id: 'c1-s2', label: 'A, B, M неколлинеарны', explanation: 'M не лежит на прямой AB = a.', dependsOn: ['c1-s1'] },
      { id: 'c1-s3', label: 'Через A, B, M проходит единственная α', explanation: 'Применяем аксиому 1.', dependsOn: ['c1-s2'] },
      { id: 'c1-s4', label: 'a ⊂ α', explanation: 'A и B принадлежат и a, и α; применяем аксиому 2.', dependsOn: ['c1-s3'] },
      { id: 'c1-s5', label: 'Плоскость α единственна для a и M', explanation: 'Любая такая плоскость содержит A, B, M, а через эти точки плоскость единственна.', dependsOn: ['c1-s4'] },
    ],
  },
  'consequence-2': {
    moduleId: 'consequence-2',
    givens: ['a ∩ b = O'],
    goal: 'Доказать: через a и b проходит единственная плоскость',
    steps: [
      { id: 'c2-s1', label: 'Выберем A ∈ a и B ∈ b, A,B ≠ O', explanation: 'Берём по одной дополнительной точке на каждой прямой.', dependsOn: [] },
      { id: 'c2-s2', label: 'A, O, B неколлинеарны', explanation: 'Если бы они лежали на одной прямой, a и b совпали бы.', dependsOn: ['c2-s1'] },
      { id: 'c2-s3', label: 'A, O, B задают единственную α', explanation: 'Аксиома 1.', dependsOn: ['c2-s2'] },
      { id: 'c2-s4', label: 'a ⊂ α и b ⊂ α', explanation: 'Для каждой прямой известны две её точки в α; аксиома 2.', dependsOn: ['c2-s3'] },
      { id: 'c2-s5', label: 'Другая плоскость невозможна', explanation: 'Она также содержала бы A, O, B и совпала бы с α.', dependsOn: ['c2-s4'] },
    ],
  },
  'consequence-3': {
    moduleId: 'consequence-3',
    givens: ['a ∥ b'],
    goal: 'Доказать: через a и b проходит единственная плоскость',
    steps: [
      { id: 'c3-s1', label: 'a и b лежат в некоторой плоскости', explanation: 'Это входит в определение параллельных прямых.', dependsOn: [] },
      { id: 'c3-s2', label: 'Выберем M ∈ b', explanation: 'Точка M не принадлежит a, иначе прямые пересекались бы.', dependsOn: ['c3-s1'] },
      { id: 'c3-s3', label: 'a и M задают единственную α', explanation: 'Используем следствие 1.', dependsOn: ['c3-s2'] },
      { id: 'c3-s4', label: 'b ⊂ α', explanation: 'Поскольку α — плоскость, содержащая обе параллельные прямые.', dependsOn: ['c3-s3'] },
      { id: 'c3-s5', label: 'Плоскость для a и b единственна', explanation: 'Любая такая плоскость содержит a и M, значит совпадает с α.', dependsOn: ['c3-s4'] },
    ],
  },
};

export interface ProofValidation {
  valid: boolean;
  message: string;
}

export function validateNextProofStep(definition: ProofDefinition, completed: string[], candidateId: string): ProofValidation {
  const candidate = definition.steps.find((step) => step.id === candidateId);
  if (!candidate) return { valid: false, message: 'Неизвестный шаг доказательства.' };
  if (completed.includes(candidateId)) return { valid: false, message: 'Этот шаг уже использован.' };
  const missing = candidate.dependsOn.filter((id) => !completed.includes(id));
  if (missing.length > 0) {
    return { valid: false, message: 'Переход пока не обоснован: сначала нужен предыдущий логический шаг.' };
  }
  return { valid: true, message: candidate.explanation };
}
