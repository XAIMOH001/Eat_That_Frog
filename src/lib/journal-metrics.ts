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

export function dayMetrics(day: DayEntry | undefined): DayMetrics {
  const entry = day ?? emptyDay();
  const counts: Record<CategoryId, number> = { focus: 0, admin: 0, rest: 0, wasted: 0 };

  for (const slot of Object.values(entry.hours)) {
    if (slot?.category) counts[slot.category] += 1;
  }

  const logged = CATEGORIES.reduce((sum, c) => sum + counts[c.id], 0);
  const productive = counts.focus + counts.admin;
  const wasted = counts.wasted;

  // Weighted: coverage of the day, share of focused work, routine adherence.
  const coverage = Math.min(logged / 16, 1);
  const focusShare = logged > 0 ? (counts.focus + counts.admin * 0.6) / logged : 0;
  const wastePenalty = logged > 0 ? counts.wasted / logged : 0;
  const raw =
    coverage * 25 + focusShare * 45 - wastePenalty * 15 + (entry.routineMaintained ? 30 : 0);

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
  // If today isn't checked yet, start counting from yesterday.
  if (!data.days[cursor]?.routineMaintained) cursor = shiftKey(cursor, -1);
  while (data.days[cursor]?.routineMaintained) {
    streak += 1;
    cursor = shiftKey(cursor, -1);
  }
  return streak;
}

export function bestStreak(data: JournalData): number {
  const keys = Object.keys(data.days)
    .filter((k) => data.days[k]?.routineMaintained)
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
