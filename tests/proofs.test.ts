import { describe, expect, it } from 'vitest';
import { proofs, validateNextProofStep } from '../src/learning-core/proofs';

describe('proof engine',()=>{
  it('rejects a step whose dependencies are not satisfied',()=>{
    const proof=proofs['consequence-1'];
    const result=validateNextProofStep(proof,[],'c1-s3');
    expect(result.valid).toBe(false);
  });

  it('accepts a valid proof sequence',()=>{
    const proof=proofs['consequence-2'];
    const completed:string[]=[];
    for(const step of proof.steps){
      const result=validateNextProofStep(proof,completed,step.id);
      expect(result.valid).toBe(true);
      completed.push(step.id);
    }
  });
});
