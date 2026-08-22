import { dateKey, type DayEntry, type JournalData } from "./journal-types";

export const LOCKOUT_HOURS = 18;

export type RoutineState =
  | { kind: "open" }
  | { kind: "locked"; until: Date }
  | { kind: "reopened" }
  | { kind: "held" }
  | { kind: "failed" }
  | { kind: "future" };

function endOfDay(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1, 23, 59, 59, 999);
}

export function routineState(day: DayEntry | undefined, key: string, now: Date): RoutineState {
  const today = dateKey(now);

  if (key > today) return { kind: "future" };

  if (key < today) {
    return day?.coreRoutineMaintained ? { kind: "held" } : { kind: "failed" };
  }

  if (!day?.coreRoutineMaintained) return { kind: "open" };

  if (!day.routineLockedAt) return { kind: "reopened" };
  const lockedAt = new Date(day.routineLockedAt);
  if (Number.isNaN(lockedAt.getTime())) return { kind: "reopened" };

  const elapse = new Date(lockedAt.getTime() + LOCKOUT_HOURS * 3_600_000);
  const cap = endOfDay(key);
  const until = elapse < cap ? elapse : cap;

  return now < until ? { kind: "locked", until } : { kind: "reopened" };
}

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
