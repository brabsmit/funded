import { describe, it, expect } from 'vitest';
import { draftState } from '../../src/lib/draft';

const t = (id: string, verification: 'draft' | 'documented' | 'confirmed') => ({ id, name: id, verification } as any);

describe('draftState', () => {
  it('is draft when any track is not confirmed, listing them', () => {
    const s = draftState([t('cip', 'confirmed'), t('mcmm', 'documented'), t('gift', 'draft')]);
    expect(s).toEqual({ isDraft: true, unconfirmed: ['mcmm', 'gift'] });
  });
  it('is not draft when every track is confirmed', () => {
    expect(draftState([t('cip', 'confirmed')])).toEqual({ isDraft: false, unconfirmed: [] });
  });
});
