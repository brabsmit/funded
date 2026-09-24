import type { NeedT, TrackT, StageT, MilestoneT } from '../schema/records';

export type StageState = 'done' | 'current' | 'later';

export function stagesFor(need: NeedT, track: TrackT): Array<StageT & { state: StageState }> {
  const idx = track.stages.findIndex(s => s.id === need.current_stage_id);
  if (idx === -1) throw new Error(`need ${need.id}: current_stage_id "${need.current_stage_id}" is not a stage of track "${track.id}"`);
  return track.stages.map((s, i) => ({ ...s, state: i < idx ? 'done' : i === idx ? 'current' : 'later' }));
}

export function nextMilestone(need: NeedT): MilestoneT | undefined {
  return need.milestones.find(m => m.status === 'next');
}

export function decidersFor(need: NeedT, track: TrackT): { current: StageT; next?: StageT } {
  const idx = track.stages.findIndex(s => s.id === need.current_stage_id);
  if (idx === -1) throw new Error(`need ${need.id}: current_stage_id "${need.current_stage_id}" is not a stage of track "${track.id}"`);
  return { current: track.stages[idx], next: track.stages[idx + 1] };
}
