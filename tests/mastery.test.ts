import { describe, expect, it } from 'vitest';
import { emptyMastery, skillScore, updateMastery } from '../src/learning-core/mastery';

describe('mastery model',()=>{
  it('updates only targeted skills',()=>{
    const initial=emptyMastery();
    const updated=updateMastery(initial,['ST-03','ST-06'],true);
    expect(updated['ST-03'].attempts).toBe(1);
    expect(updated['ST-03'].correct).toBe(1);
    expect(updated['ST-04'].attempts).toBe(0);
  });

  it('uses smoothing for early scores',()=>{
    const state=updateMastery(emptyMastery(),['ST-03'],true);
    expect(skillScore(state,'ST-03')).toBeLessThan(1);
    expect(skillScore(state,'ST-03')).toBeGreaterThan(.5);
  });
});
