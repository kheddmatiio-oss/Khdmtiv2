import type { Video, VideoStage } from './types';
import type { Key } from './i18n';
import { today } from './utils';

export const STAGES: VideoStage[] = ['brief', 'editing', 'review', 'revision', 'delivered'];

export const STAGE_LABEL: Record<VideoStage, Key> = {
  brief: 'stage_brief', editing: 'stage_editing', review: 'stage_review',
  revision: 'stage_revision', delivered: 'stage_delivered',
};

/** One hue, deepening as the work advances — grey while nothing has started,
 *  full brand blue once it is delivered. */
export const STAGE_TONE: Record<VideoStage, string> = {
  brief: 'var(--text-faint)',
  editing: 'color-mix(in oklab, var(--accent) 45%, var(--text-faint))',
  review: 'color-mix(in oklab, var(--accent) 68%, var(--text-faint))',
  revision: 'color-mix(in oklab, var(--accent) 86%, var(--text-faint))',
  delivered: 'var(--accent)',
};

/** Videos logged before the pipeline existed were finished work. */
export const stageOf = (v: Video): VideoStage => v.stage ?? 'delivered';

export const nextStage = (s: VideoStage): VideoStage | null => {
  // review normally ends in delivery; "revision" is a detour taken by hand
  if (s === 'review' || s === 'revision') return s === 'review' ? 'delivered' : 'review';
  const i = STAGES.indexOf(s);
  return i < STAGES.length - 1 ? STAGES[i + 1] : null;
};

const DAY = 86400000;
/** Whole days until the deadline; negative when it has passed. */
export const daysLeft = (due?: string) =>
  due ? Math.round((+new Date(due + 'T00:00:00') - +new Date(today() + 'T00:00:00')) / DAY) : null;

export type DueState = { days: number; late: boolean; soon: boolean };
export const dueState = (v: Video): DueState | null => {
  if (stageOf(v) === 'delivered') return null;      // a deadline that was met is not a warning
  const d = daysLeft(v.due);
  return d === null ? null : { days: d, late: d < 0, soon: d >= 0 && d <= 2 };
};

/** Active work first by nearest deadline; finished work newest first. */
export const byUrgency = (a: Video, b: Video) => {
  if (a.due && b.due) return a.due.localeCompare(b.due);
  if (a.due) return -1;
  if (b.due) return 1;
  return (b.createdAt ?? b.date).localeCompare(a.createdAt ?? a.date);
};
