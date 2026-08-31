import type { Exercise } from './types';

export const exerciseBank: Exercise[] = [
  { id:'pc-1', type:'plane-count', prompt:'Сколько плоскостей проходит через одну заданную точку A?', answer:'∞', explanation:'Одной точки недостаточно для фиксации плоскости.', skills:['ST-06','ST-09'] },
  { id:'pc-2', type:'plane-count', prompt:'Сколько плоскостей проходит через две различные точки A и B?', answer:'∞', explanation:'Через прямую AB можно вращать бесконечно много плоскостей.', skills:['ST-03','ST-06'] },
  { id:'pc-3', type:'plane-count', prompt:'A, B, C лежат на одной прямой. Сколько плоскостей проходит через все три точки?', answer:'∞', explanation:'Три коллинеарные точки фактически задают только одну прямую.', skills:['ST-03','ST-06'] },
  { id:'pc-4', type:'plane-count', prompt:'A, B, C не лежат на одной прямой. Сколько плоскостей проходит через них?', answer:1, explanation:'Это в точности аксиома 1.', skills:['ST-03'] },
  { id:'pc-5', type:'plane-count', prompt:'Дана прямая a и точка M ∉ a. Сколько плоскостей содержат и a, и M?', answer:1, explanation:'Следствие 1.', skills:['ST-06','ST-08'] },
  { id:'pc-6', type:'plane-count', prompt:'Даны две скрещивающиеся прямые a и b. Сколько плоскостей содержат обе?', answer:0, explanation:'Скрещивающиеся прямые по определению не лежат в одной плоскости.', skills:['ST-06','ST-09'] },
  { id:'pc-7', type:'plane-count', prompt:'Даны две пересекающиеся прямые a и b. Сколько плоскостей содержат обе?', answer:1, explanation:'Следствие 2.', skills:['ST-06'] },
  { id:'pc-8', type:'plane-count', prompt:'Даны две параллельные прямые a и b. Сколько плоскостей содержат обе?', answer:1, explanation:'Следствие 3.', skills:['ST-06'] },

  { id:'ts-1', type:'tri-state', prompt:'Оцените утверждение.', statement:'A, B ∈ α ⇒ AB ⊂ α.', answer:'true', explanation:'Две точки прямой AB лежат в α, значит по аксиоме 2 вся AB лежит в α.', skills:['ST-02','ST-04'] },
  { id:'ts-2', type:'tri-state', prompt:'Оцените утверждение.', statement:'A ∈ α и B ∈ β ⇒ AB ⊂ α.', answer:'insufficient', explanation:'Нет данных, что B принадлежит α.', skills:['ST-01','ST-02'] },
  { id:'ts-3', type:'tri-state', prompt:'Оцените утверждение.', statement:'Если α и β различны и имеют общую точку, то α ∩ β — прямая.', answer:'true', explanation:'Это аксиома 3.', skills:['ST-05','ST-07'] },
  { id:'ts-4', type:'tri-state', prompt:'Оцените утверждение.', statement:'Через любые три точки проходит ровно одна плоскость.', answer:'false', explanation:'Для трёх коллинеарных точек плоскостей бесконечно много.', skills:['ST-03'] },
  { id:'ts-5', type:'tri-state', prompt:'Оцените утверждение.', statement:'Две прямые, не имеющие общих точек, обязательно параллельны.', answer:'false', explanation:'В пространстве существуют скрещивающиеся прямые.', skills:['ST-09'] },

  { id:'err-1', type:'find-error', prompt:'Найдите первый необоснованный переход.', lines:[
    'A ∈ α',
    'B ∈ α',
    'Следовательно, любая прямая через A лежит в α.',
    'Значит, AB ⊂ α.'
  ], errorIndex:2, explanation:'Аксиома 2 требует две точки конкретной прямой в плоскости. Из одной точки A нельзя сделать вывод о любой прямой через неё.', skills:['ST-02','ST-04','ST-08'] },
  { id:'err-2', type:'find-error', prompt:'Найдите первый необоснованный переход.', lines:[
    'α и β имеют общую точку O.',
    'По аксиоме 3 α ∩ β = l.',
    'Точка M ∈ α.',
    'Следовательно, M ∈ l.'
  ], errorIndex:3, explanation:'Для принадлежности l нужно знать, что M принадлежит обеим плоскостям, а известно только M ∈ α.', skills:['ST-05','ST-07','ST-08'] },

  { id:'choice-1', type:'choice', prompt:'Тетраэдр SABC. M ∈ AB, N ∈ AC. Найдите (SMN) ∩ (ABC).', choices:['SM','SN','MN','AB'], answerIndex:2, explanation:'M и N — две общие точки обеих плоскостей, поэтому линия пересечения — MN.', skills:['ST-05','ST-07'], scene:'tetra-intersection' },
  { id:'choice-2', type:'choice', prompt:'Куб пересечён плоскостью через точки M, N, K, отмеченные на рёбрах. Сколько вершин имеет показанное сечение?', choices:['3','4','5','6'], answerIndex:2, explanation:'Для выбранного положения секущая плоскость пересекает пять рёбер куба, поэтому сечение — пятиугольник.', skills:['ST-07','ST-09','ST-10'], scene:'cube-section' },
];

export function shuffledExercises(seed = Date.now()): Exercise[] {
  let x = seed >>> 0;
  const random = () => {
    x = (1664525 * x + 1013904223) >>> 0;
    return x / 2 ** 32;
  };
  return [...exerciseBank].sort(() => random() - 0.5);
}
