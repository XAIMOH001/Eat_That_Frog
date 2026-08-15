import {
  CATEGORIES,
  emptyDay,
  shiftKey,
  type CategoryId,
  type DayEntry,
  type JournalData,
} from "./journal-types";

export type DayMetrics = {
  counts: Record<CategoryId, number>;
  logged: number;
  productive: number;
  wasted: number;
  rest: number;
  focus: number;
  disciplineScore: number;
};

const ROUTINE_POINTS = 40;
const FROG_POINTS = 40;
const HOUR_POINTS = 20;

export function dayMetrics(day: DayEntry | undefined): DayMetrics {
  const entry = day ?? emptyDay();
  const counts: Record<CategoryId, number> = { focus: 0, admin: 0, rest: 0, wasted: 0 };

  for (const slot of Object.values(entry.hours)) {
    if (slot?.category) counts[slot.category] += 1;
  }

  const logged = CATEGORIES.reduce((sum, c) => sum + counts[c.id], 0);
  const productive = counts.focus + counts.admin;
  const wasted = counts.wasted;

  const working = counts.focus + counts.admin + counts.wasted;
  const coverage = Math.min(working / 8, 1);
  const focusShare = working > 0 ? (counts.focus + counts.admin * 0.6) / working : 0;
  const wastePenalty = working > 0 ? counts.wasted / working : 0;
  const hourRaw = coverage * 25 + focusShare * 45 - wastePenalty * 15;

  const hourScore = Math.min(Math.max((hourRaw - 20) / 45, 0), 1) * HOUR_POINTS;

  const raw =
    (entry.coreRoutineMaintained ? ROUTINE_POINTS : 0) +
    (entry.frog.completed ? FROG_POINTS : 0) +
    hourScore;

  return {
    counts,
    logged,
    productive,
    wasted,
    rest: counts.rest,
    focus: counts.focus,
    disciplineScore: Math.max(0, Math.min(100, Math.round(raw))),
  };
}

export function routineStreak(data: JournalData, fromKey: string): number {
  let streak = 0;
  let cursor = fromKey;
  if (!data.days[cursor]?.coreRoutineMaintained) cursor = shiftKey(cursor, -1);
  while (data.days[cursor]?.coreRoutineMaintained) {
    streak += 1;
    cursor = shiftKey(cursor, -1);
  }
  return streak;
}

export function bestStreak(data: JournalData): number {
  const keys = Object.keys(data.days)
    .filter((k) => data.days[k]?.coreRoutineMaintained)
    .sort();
  let best = 0;
  let run = 0;
  let prev: string | null = null;
  for (const key of keys) {
    run = prev && shiftKey(prev, 1) === key ? run + 1 : 1;
    best = Math.max(best, run);
    prev = key;
  }
  return best;
}
