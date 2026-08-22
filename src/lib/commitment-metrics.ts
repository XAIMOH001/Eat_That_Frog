import { shiftKey } from "./journal-types";

export function commitmentStreak(keptDays: ReadonlySet<string>, todayKey: string): number {
  let cursor = keptDays.has(todayKey) ? todayKey : shiftKey(todayKey, -1);

  let streak = 0;
  while (keptDays.has(cursor)) {
    streak += 1;
    cursor = shiftKey(cursor, -1);
  }
  return streak;
}

export function bestCommitmentStreak(keptDays: readonly string[]): number {
  const keys = [...new Set(keptDays)].sort();

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

export function commitmentRate(
  keptDays: ReadonlySet<string>,
  fromKey: string,
  toKey: string,
): number | null {
  if (toKey < fromKey) return null;

  let elapsed = 0;
  let kept = 0;
  for (let cursor = fromKey; cursor <= toKey; cursor = shiftKey(cursor, 1)) {
    elapsed += 1;
    if (keptDays.has(cursor)) kept += 1;
  }

  if (elapsed === 0) return null;
  return Math.round((kept / elapsed) * 100);
}

export function recoveryCount(keptDays: readonly string[]): number {
  const keys = [...new Set(keptDays)].sort();

  let runs = 0;
  let prev: string | null = null;
  for (const key of keys) {
    if (!prev || shiftKey(prev, 1) !== key) runs += 1;
    prev = key;
  }
  return Math.max(0, runs - 1);
}
