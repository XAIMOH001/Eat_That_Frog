import { dateKey, type DayEntry, type JournalData } from "./journal-types";

/**
 * Read-only window applied once the routine toggle is set, capped at the end of that calendar
 * day — past days are read-only regardless, so the 18 hours only ever bite within the same day
 * (set it at 01:00 and it reopens at 19:00; set it at 08:00 and it stays shut).
 */
export const LOCKOUT_HOURS = 18;

export type RoutineState =
  /** Today, not yet set. The only state in which the toggle accepts input. */
  | { kind: "open" }
  /** Set, and inside the lockout window. */
  | { kind: "locked"; until: Date }
  /** Today, set earlier, lockout elapsed — editable again until midnight. */
  | { kind: "reopened" }
  /** A past day that was set. Historical record. */
  | { kind: "held" }
  /** A past day that was never set: permanently failed, breaks the streak. */
  | { kind: "failed" }
  /** A future day. Nothing to log yet. */
  | { kind: "future" };

function endOfDay(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1, 23, 59, 59, 999);
}

/**
 * Resolve the toggle's state for `key` as of `now`. Pure and clock-injected so it is testable
 * and safe across a server boundary — nothing here reads the ambient clock.
 */
export function routineState(day: DayEntry | undefined, key: string, now: Date): RoutineState {
  const today = dateKey(now);

  if (key > today) return { kind: "future" };

  if (key < today) {
    return day?.coreRoutineMaintained ? { kind: "held" } : { kind: "failed" };
  }

  // Today.
  if (!day?.coreRoutineMaintained) return { kind: "open" };

  if (!day.routineLockedAt) return { kind: "reopened" };
  const lockedAt = new Date(day.routineLockedAt);
  if (Number.isNaN(lockedAt.getTime())) return { kind: "reopened" };

  const elapse = new Date(lockedAt.getTime() + LOCKOUT_HOURS * 3_600_000);
  const cap = endOfDay(key);
  const until = elapse < cap ? elapse : cap;

  return now < until ? { kind: "locked", until } : { kind: "reopened" };
}

/** Whether the toggle should accept input. */
export function isRoutineEditable(state: RoutineState): boolean {
  return state.kind === "open" || state.kind === "reopened";
}

export function routineStateLabel(state: RoutineState): string {
  switch (state.kind) {
    case "open":
      return "Not yet logged";
    case "locked":
      return `Logged — locked until ${state.until.toLocaleTimeString(undefined, {
        hour: "2-digit",
        minute: "2-digit",
      })}`;
    case "reopened":
      return "Logged for today";
    case "held":
      return "Held";
    case "failed":
      return "Missed";
    case "future":
      return "Not yet";
  }
}

/**
 * Consecutive days held, counting back from today.
 *
 * Grace rule: an unlogged *today* does not zero the counter — it still reads the run through
 * yesterday, because zeroing a live streak before the day has ended is punitive for a day the
 * user can still save. Once the date rolls over, that day is permanently failed and breaks the
 * run like any other miss.
 */
export function routineStreak(data: JournalData, now: Date): number {
  let cursor = dateKey(now);
  if (!data.days[cursor]?.coreRoutineMaintained) cursor = shift(cursor, -1);

  let streak = 0;
  while (data.days[cursor]?.coreRoutineMaintained) {
    streak += 1;
    cursor = shift(cursor, -1);
  }
  return streak;
}

function shift(key: string, days: number): string {
  const [y, m, d] = key.split("-").map(Number);
  const date = new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1);
  date.setDate(date.getDate() + days);
  return dateKey(date);
}
