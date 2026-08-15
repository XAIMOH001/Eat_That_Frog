import {
  CATEGORIES,
  a1Task,
  emptyDay,
  shiftKey,
  type CategoryId,
  type DayEntry,
  type JournalData,
  type PlannedTask,
} from "./journal-types";

export type DayMetrics = {
  counts: Record<CategoryId, number>;
  logged: number;
  productive: number;
  wasted: number;
  rest: number;
  focus: number;
  /** Hours whose category is productive AND which are tagged to a planned task. */
  plannedHours: number;
  sFrog: number;
  sPlan: number;
  sFocus: number;
  disciplineScore: number;
};

const W_FROG = 0.4;
const W_PLAN = 0.3;
const W_FOCUS = 0.3;

/** Admin is necessary maintenance — roughly 60% of the leverage of deep frog work. */
const ADMIN_WEIGHT = 0.6;

export function dayMetrics(data: JournalData, key: string, day: DayEntry | undefined): DayMetrics {
  const entry = day ?? emptyDay();
  const counts: Record<CategoryId, number> = { focus: 0, admin: 0, rest: 0, wasted: 0 };

  let plannedHours = 0;
  for (const slot of Object.values(entry.hours)) {
    if (!slot?.category) continue;
    counts[slot.category] += 1;
    // Only productive time counts toward the plan: an hour tagged to a task but logged as
    // Wasted or Rest is not execution of that task.
    if (slot.taskId && (slot.category === "focus" || slot.category === "admin")) plannedHours += 1;
  }

  const logged = CATEGORIES.reduce((sum, c) => sum + counts[c.id], 0);
  const productive = counts.focus + counts.admin;
  const wasted = counts.wasted;

  // S_Frog — binary. The A1 task is the frog.
  const frog = a1Task(data, key);
  const sFrog = frog?.completed ? 100 : 0;

  // S_Plan — what share of productive time went to work you actually planned. Zero productive
  // hours means nothing was executed, so there is nothing to have planned: 0, not 100.
  const sPlan = productive > 0 ? (plannedHours / productive) * 100 : 0;

  // S_Focus — quality of working time. Rest is deliberately absent from the denominator: it is
  // the one category that must never cost points, so it cannot appear in a ratio at all.
  const working = counts.focus + counts.admin + counts.wasted;
  const sFocus = working > 0 ? ((counts.focus + counts.admin * ADMIN_WEIGHT) / working) * 100 : 0;

  const raw = sFrog * W_FROG + sPlan * W_PLAN + sFocus * W_FOCUS;

  return {
    counts,
    logged,
    productive,
    wasted,
    rest: counts.rest,
    focus: counts.focus,
    plannedHours,
    sFrog,
    sPlan: Math.round(sPlan),
    sFocus: Math.round(sFocus),
    disciplineScore: Math.max(0, Math.min(100, Math.round(raw))),
  };
}

/** Recompute every task's actualHours from the hour logs. The log is the source of truth. */
export function recomputeActualHours(data: JournalData): JournalData {
  const totals: Record<string, number> = {};

  for (const day of Object.values(data.days)) {
    for (const slot of Object.values(day.hours)) {
      if (!slot?.taskId) continue;
      if (slot.category !== "focus" && slot.category !== "admin") continue;
      totals[slot.taskId] = (totals[slot.taskId] ?? 0) + 1;
    }
  }

  const tasks: Record<string, PlannedTask> = {};
  let changed = false;
  for (const [id, task] of Object.entries(data.tasks)) {
    const actual = totals[id] ?? 0;
    if (task.actualHours !== actual) changed = true;
    tasks[id] = actual === task.actualHours ? task : { ...task, actualHours: actual };
  }

  return changed ? { ...data, tasks } : data;
}

/* ---------------------------------------------------------------- ranges --- */

/** Inclusive window of `days` keys ending at `endKey`, oldest first. */
export function rangeKeys(endKey: string, days: number): string[] {
  const out: string[] = [];
  for (let i = days - 1; i >= 0; i--) out.push(shiftKey(endKey, -i));
  return out;
}

export type DayBar = {
  key: string;
  productive: number;
  wasted: number;
  rest: number;
  total: number;
};

/** Per-day productive/wasted/rest totals across the window. */
export function dailySeries(data: JournalData, endKey: string, days: number): DayBar[] {
  return rangeKeys(endKey, days).map((key) => {
    const day = data.days[key];
    let productive = 0;
    let wasted = 0;
    let rest = 0;
    for (const slot of Object.values(day?.hours ?? {})) {
      if (slot?.category === "focus" || slot?.category === "admin") productive += 1;
      else if (slot?.category === "wasted") wasted += 1;
      else if (slot?.category === "rest") rest += 1;
    }
    return { key, productive, wasted, rest, total: productive + wasted + rest };
  });
}

/** Category counts summed across the window — feeds the donut's range toggle. */
export function rangeCounts(
  data: JournalData,
  endKey: string,
  days: number,
): Record<CategoryId, number> {
  const counts: Record<CategoryId, number> = { focus: 0, admin: 0, rest: 0, wasted: 0 };
  for (const key of rangeKeys(endKey, days)) {
    for (const slot of Object.values(data.days[key]?.hours ?? {})) {
      if (slot?.category) counts[slot.category] += 1;
    }
  }
  return counts;
}

export type FrogRate = { planned: number; eaten: number; pct: number };

/**
 * Share of A1 frogs eaten in the window. Days with no frog named are not counted
 * against you — you can only fail to eat a frog you actually set.
 */
export function frogRate(data: JournalData, endKey: string, days: number): FrogRate {
  const window = new Set(rangeKeys(endKey, days));
  let planned = 0;
  let eaten = 0;
  for (const task of Object.values(data.tasks)) {
    if (task.priority !== "A1" || !window.has(task.targetDate)) continue;
    planned += 1;
    if (task.completed) eaten += 1;
  }
  return { planned, eaten, pct: planned > 0 ? Math.round((eaten / planned) * 100) : 0 };
}

export type HeatCell = {
  key: string;
  day: number;
  held: boolean;
  logged: boolean;
  future: boolean;
};

/**
 * Calendar grid for the month containing `anchorKey`, padded to whole weeks starting Monday.
 * Cells outside the month are omitted (null) so the grid keeps its shape without inventing days.
 */
export function monthGrid(
  data: JournalData,
  anchorKey: string,
  todayKey: string,
): (HeatCell | null)[] {
  const [y, m] = anchorKey.split("-").map(Number);
  const year = y ?? 1970;
  const month = (m ?? 1) - 1;
  const first = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  // getDay() is Sunday-based; shift so Monday is column 0.
  const lead = (first.getDay() + 6) % 7;

  const cells: (HeatCell | null)[] = Array.from({ length: lead }, () => null);
  for (let d = 1; d <= daysInMonth; d++) {
    const key = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const entry = data.days[key];
    cells.push({
      key,
      day: d,
      held: entry?.coreRoutineMaintained ?? false,
      logged: Object.keys(entry?.hours ?? {}).length > 0,
      future: key > todayKey,
    });
  }
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
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
