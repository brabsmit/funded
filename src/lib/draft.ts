import type { TrackT } from '../schema/records';

export function draftState(tracks: Pick<TrackT, 'id' | 'verification'>[]): { isDraft: boolean; unconfirmed: string[] } {
  const unconfirmed = tracks.filter(t => t.verification !== 'confirmed').map(t => t.id);
  return { isDraft: unconfirmed.length > 0, unconfirmed };
}
