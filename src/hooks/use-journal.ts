import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { recomputeActualHours } from "@/lib/journal-metrics";
import { isRoutineEditable, routineState } from "@/lib/routine-lock";
import {
  a1Task,
  emptyDay,
  emptyHour,
  shiftKey,
  tasksForDate,
  type CategoryId,
  type DayEntry,
  type HourEntry,
  type JournalData,
  type PlannedTask,
  type TaskPriority,
} from "@/lib/journal-types";
import {
  addPlannedTask,
  clearDayLogs,
  deletePlannedTask,
  updateDailyRecordStatus,
  updatePlannedTask,
  upsertHourlyLog,
  type ActionResult,
} from "@/app/actions";

/** Advance planning is only meaningful once the day is essentially spent. */
export const PLAN_TOMORROW_OPEN_HOUR = 20;
export const PLAN_TOMORROW_CLOSE_HOUR = 23;

/**
 * Note and title fields are controlled inputs firing on every keystroke. Without this each
 * would issue one Server Action per character typed.
 */
const DEBOUNCE_MS = 600;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Optimistic ids ("t1") exist only until the insert round-trips; they are not in the DB. */
function isPersisted(id: string): boolean {
  return UUID.test(id);
}

export type UseJournalOptions = {
  /** Driven by the `?date=` search param, so the day is server-fetched and shareable. */
  selected: string;
  initialData: JournalData;
};

let seq = 0;
function nextId(): string {
  seq += 1;
  return `t${seq}`;
}

/* ------------------------------------------------------- pure state helpers --- */

type HourRef = { dayKey: string; hour: number };

function withHour(data: JournalData, key: string, hour: number, slot: HourEntry | undefined) {
  const day = data.days[key] ?? emptyDay();
  const hours = { ...day.hours };
  if (slot) hours[String(hour)] = slot;
  else delete hours[String(hour)];
  return recomputeActualHours({ ...data, days: { ...data.days, [key]: { ...day, hours } } });
}

function withDayHours(data: JournalData, key: string, hours: Record<string, HourEntry>) {
  const day = data.days[key] ?? emptyDay();
  return recomputeActualHours({ ...data, days: { ...data.days, [key]: { ...day, hours } } });
}

function withRoutine(
  data: JournalData,
  key: string,
  coreRoutineMaintained: boolean,
  routineLockedAt: string | null,
) {
  const day = data.days[key] ?? emptyDay();
  return {
    ...data,
    days: { ...data.days, [key]: { ...day, coreRoutineMaintained, routineLockedAt } },
  };
}

function withTask(data: JournalData, id: string, task: PlannedTask | undefined) {
  const tasks = { ...data.tasks };
  if (task) tasks[id] = task;
  else delete tasks[id];
  return recomputeActualHours({ ...data, tasks });
}

/**
 * Rewrite every hour tagged with `from` to `to`. Returns the new data plus the exact hours
 * it touched, so the caller can re-persist them and reverse them precisely on rollback.
 */
function retagHours(data: JournalData, from: string, to: string | null) {
  const days: Record<string, DayEntry> = {};
  const touched: HourRef[] = [];

  for (const [dayKey, day] of Object.entries(data.days)) {
    let changed = false;
    const hours = { ...day.hours };
    for (const [h, slot] of Object.entries(hours)) {
      if (slot?.taskId !== from) continue;
      hours[h] = { ...slot, taskId: to };
      changed = true;
      touched.push({ dayKey, hour: Number(h) });
    }
    days[dayKey] = changed ? { ...day, hours } : day;
  }

  return { data: { ...data, days }, touched };
}

/** Force a specific taskId onto an explicit list of hours. Used to reverse a retag. */
function setTaskIdOn(data: JournalData, refs: HourRef[], taskId: string | null) {
  const days = { ...data.days };
  for (const { dayKey, hour } of refs) {
    const day = days[dayKey];
    const slot = day?.hours[String(hour)];
    if (!day || !slot) continue;
    days[dayKey] = { ...day, hours: { ...day.hours, [String(hour)]: { ...slot, taskId } } };
  }
  return recomputeActualHours({ ...data, days });
}

/* -------------------------------------------------------------------- hook --- */

export function useJournal(now: Date, { selected, initialData }: UseJournalOptions) {
  const router = useRouter();
  const [navPending, startNav] = useTransition();

  const [data, setData] = useState<JournalData>(initialData);
  const [syncError, setSyncError] = useState<string | null>(null);

  /**
   * Mirrors `data`. Every mutation computes its next state from this ref and commit() writes
   * it back synchronously, so a second edit in the same tick reads the first one's result.
   * An effect-only sync would lag by a commit and let same-tick edits clobber each other in
   * both state and the database; the effect below is only a backstop for server payloads.
   */
  const stateRef = useRef(data);

  const commit = useCallback((next: JournalData) => {
    stateRef.current = next;
    setData(next);
  }, []);

  // The server is authoritative on navigation. Every mutation is flushed before the route
  // changes, so the freshly fetched window supersedes whatever is held locally.
  const [prevInitialData, setPrevInitialData] = useState(initialData);
  if (initialData !== prevInitialData) {
    setPrevInitialData(initialData);
    setData(initialData);
  }

  // Backstop for state that did not come through commit() — the server payload above. Safe
  // to lag by an effect here, because no user event can fire between that render and this
  // flush, so no mutation can read a stale ref across a navigation.
  useEffect(() => {
    stateRef.current = data;
  }, [data]);

  /* ----------------------------------------------------------- persistence --- */

  /** Run a mutation, rolling the optimistic state back and surfacing it if it fails. */
  const persist = useCallback(
    (
      action: () => Promise<ActionResult<unknown>>,
      rollback: () => void,
      what: string,
    ): Promise<void> =>
      action().then(
        (result) => {
          if (result.ok) return;
          console.error(`[journal] ${what} rejected: ${result.error}`);
          rollback();
          setSyncError(
            result.error === "not_allowed"
              ? `That change to ${what} isn't allowed any more, so it was undone.`
              : `Couldn't save ${what}. Your change was undone.`,
          );
        },
        (error: unknown) => {
          console.error(`[journal] ${what} failed:`, error);
          rollback();
          setSyncError(`Couldn't reach the server to save ${what}. Your change was undone.`);
        },
      ),
    [],
  );

  /* ------------------------------------------------------ debounced writes --- */

  const pending = useRef(
    new Map<string, { timer: ReturnType<typeof setTimeout>; run: () => Promise<void> }>(),
  );

  const cancelPending = useCallback((key?: string) => {
    if (key === undefined) {
      for (const entry of pending.current.values()) clearTimeout(entry.timer);
      pending.current.clear();
      return;
    }
    const entry = pending.current.get(key);
    if (entry) {
      clearTimeout(entry.timer);
      pending.current.delete(key);
    }
  }, []);

  /** Run every queued write and wait for it. Called before navigating so nothing is lost. */
  const flushPending = useCallback(async () => {
    const entries = [...pending.current.values()];
    cancelPending();
    await Promise.allSettled(entries.map((entry) => entry.run()));
  }, [cancelPending]);

  const queue = useCallback(
    (key: string, task: () => Promise<void>, debounce: boolean) => {
      // Any write for this key supersedes a queued one, so a stale debounced value can never
      // land after a newer immediate write.
      cancelPending(key);

      if (!debounce) {
        void task();
        return;
      }

      const timer = setTimeout(() => {
        pending.current.delete(key);
        void task();
      }, DEBOUNCE_MS);
      pending.current.set(key, { timer, run: task });
    },
    [cancelPending],
  );

  // Flush on unmount and when the tab is hidden — a tab close inside the debounce window
  // would otherwise drop the last keystrokes outright.
  useEffect(() => {
    const onHide = () => void flushPending();
    window.addEventListener("pagehide", onHide);
    document.addEventListener("visibilitychange", onHide);
    return () => {
      window.removeEventListener("pagehide", onHide);
      document.removeEventListener("visibilitychange", onHide);
      void flushPending();
    };
  }, [flushPending]);

  /* ------------------------------------------------------------ hour edits --- */

  const writeHour = useCallback(
    (hour: number, slot: HourEntry, previous: HourEntry | undefined, debounce: boolean) => {
      const key = selected;
      queue(
        `hour:${hour}`,
        () =>
          persist(
            () => upsertHourlyLog(key, hour, slot),
            () => commit(withHour(stateRef.current, key, hour, previous)),
            `hour ${String(hour).padStart(2, "0")}:00`,
          ),
        debounce,
      );
    },
    [selected, queue, persist, commit],
  );

  /** Optimistically patch one hour, then persist the whole merged slot. */
  const patchHour = useCallback(
    (hour: number, patch: Partial<HourEntry>, debounce: boolean) => {
      const current = stateRef.current;
      const previous = current.days[selected]?.hours[String(hour)];
      const merged: HourEntry = { ...(previous ?? emptyHour()), ...patch };

      commit(withHour(current, selected, hour, merged));
      writeHour(hour, merged, previous, debounce);
    },
    [selected, commit, writeHour],
  );

  const setNote = useCallback(
    (hour: number, note: string) => patchHour(hour, { note }, true),
    [patchHour],
  );

  const setCategory = useCallback(
    (hour: number, category: CategoryId | null) => patchHour(hour, { category }, false),
    [patchHour],
  );

  const setHourTask = useCallback(
    (hour: number, taskId: string | null) => patchHour(hour, { taskId }, false),
    [patchHour],
  );

  const clearLog = useCallback(() => {
    // Drop queued note writes first, or they would recreate rows moments after the delete.
    cancelPending();

    const current = stateRef.current;
    const previous = current.days[selected]?.hours ?? {};
    commit(withDayHours(current, selected, {}));

    void persist(
      () => clearDayLogs(selected),
      () => commit(withDayHours(stateRef.current, selected, previous)),
      "the cleared day",
    );
  }, [cancelPending, selected, commit, persist]);

  /* -------------------------------------------------------------- routine --- */

  const setRoutine = useCallback(
    (value: boolean) => {
      const current = stateRef.current;
      const day = current.days[selected];
      if (!isRoutineEditable(routineState(day, selected, now))) return;

      const previousValue = day?.coreRoutineMaintained ?? false;
      const previousLockedAt = day?.routineLockedAt ?? null;
      const routineLockedAt = value ? now.toISOString() : null;

      commit(withRoutine(current, selected, value, routineLockedAt));

      void persist(
        () => updateDailyRecordStatus(selected, { coreRoutineMaintained: value, routineLockedAt }),
        () => commit(withRoutine(stateRef.current, selected, previousValue, previousLockedAt)),
        "your routine",
      );
    },
    [selected, now, commit, persist],
  );

  /* ---------------------------------------------------------------- tasks --- */

  /** Guards the create-vs-update race on the frog input, whose onChange fires per keystroke. */
  const creating = useRef(new Set<string>());

  const addTask = useCallback(
    (title: string, priority: TaskPriority, targetDate: string, estimatedHours = 1) => {
      const trimmed = title.trim();
      if (!trimmed) return;

      // Two keystrokes landing before the first insert resolves would otherwise create two
      // A1 rows for the same day, and A1 is single-occupancy by convention.
      const slot = `${priority}:${targetDate}`;
      if (priority === "A1" && creating.current.has(slot)) return;
      creating.current.add(slot);

      const tempId = nextId();
      const task: PlannedTask = {
        id: tempId,
        title: trimmed,
        priority,
        targetDate,
        estimatedHours,
        actualHours: 0,
        completed: false,
      };

      commit(withTask(stateRef.current, tempId, task));

      void persist(
        () =>
          addPlannedTask(targetDate, priority, trimmed, estimatedHours).then((result) => {
            if (!result.ok) return result;

            // Hours tagged while the task was still optimistic point at the temp id. Left
            // alone they would persist as a task_id that matches nothing, forever.
            const realId = result.data.id;
            const swapped = withTask(withTask(stateRef.current, tempId, undefined), realId, {
              ...task,
              id: realId,
            });
            const retagged = retagHours(swapped, tempId, realId);
            commit(retagged.data);

            for (const ref of retagged.touched) {
              if (ref.dayKey !== selected) continue;
              const slotNow = retagged.data.days[ref.dayKey]?.hours[String(ref.hour)];
              if (slotNow) writeHour(ref.hour, slotNow, { ...slotNow, taskId: tempId }, false);
            }
            return result;
          }),
        () => commit(withTask(stateRef.current, tempId, undefined)),
        "your task",
      ).finally(() => creating.current.delete(slot));
    },
    [selected, commit, persist, writeHour],
  );

  const updateTask = useCallback(
    (id: string, patch: Partial<Omit<PlannedTask, "id">>) => {
      const current = stateRef.current;
      const previous = current.tasks[id];
      if (!previous) return;

      commit(withTask(current, id, { ...previous, ...patch }));
      if (!isPersisted(id)) return;

      const wire: {
        title?: string;
        priority?: string;
        completed?: boolean;
        estimatedHours?: number;
      } = {};
      if (patch.title !== undefined) wire.title = patch.title;
      if (patch.priority !== undefined) wire.priority = patch.priority;
      if (patch.completed !== undefined) wire.completed = patch.completed;
      if (patch.estimatedHours !== undefined) wire.estimatedHours = patch.estimatedHours;
      if (Object.keys(wire).length === 0) return;

      // Title comes from a per-keystroke input, so it debounces; a checkbox does not.
      const debounce = wire.title !== undefined && wire.completed === undefined;

      queue(
        `task:${id}`,
        () =>
          persist(
            () => updatePlannedTask(id, wire),
            () => commit(withTask(stateRef.current, id, previous)),
            "your task",
          ),
        debounce,
      );
    },
    [commit, queue, persist],
  );

  const removeTask = useCallback(
    (id: string) => {
      const current = stateRef.current;
      const previous = current.tasks[id];
      if (!previous) return;

      // Optimistic untag only. deletePlannedTask clears hourly_logs.task_id inside the same
      // transaction as the delete, so the client no longer fans this out as N+1 writes that
      // could half-apply.
      const untagged = retagHours(withTask(current, id, undefined), id, null);
      commit(untagged.data);

      if (!isPersisted(id)) return;

      void persist(
        () => deletePlannedTask(id),
        () => {
          // Restore the task and re-tag exactly the hours that were untagged above.
          const restored = withTask(stateRef.current, id, previous);
          commit(setTaskIdOn(restored, untagged.touched, id));
        },
        "the deleted task",
      );
    },
    [commit, persist],
  );

  /* ----------------------------------------------------------- navigation --- */

  const goTo = useCallback(
    async (key: string) => {
      if (key === selected) return;
      // Awaited, not merely dispatched: otherwise the refetch races the write and a stale
      // window overwrites what was just typed.
      await flushPending();
      startNav(() => router.push(`/?date=${key}`));
    },
    [selected, flushPending, router],
  );

  const goDay = useCallback(
    (delta: number) => void goTo(shiftKey(selected, delta)),
    [goTo, selected],
  );

  const setSelected = useCallback((key: string) => void goTo(key), [goTo]);

  const dismissError = useCallback(() => setSyncError(null), []);

  /* ------------------------------------------------------------- derived --- */

  const day = useMemo(() => data.days[selected], [data, selected]);
  const dayOrEmpty = useMemo(() => day ?? emptyDay(), [day]);

  const hour = now.getHours();
  const planTomorrowOpen = hour >= PLAN_TOMORROW_OPEN_HOUR && hour <= PLAN_TOMORROW_CLOSE_HOUR;

  const tasks = useMemo(() => tasksForDate(data, selected), [data, selected]);
  const frog = useMemo(() => a1Task(data, selected), [data, selected]);
  const lockState = useMemo(() => routineState(day, selected, now), [day, selected, now]);

  return {
    data,
    day: dayOrEmpty,
    selected,
    setSelected,
    goDay,
    navPending,
    syncError,
    dismissError,
    setNote,
    setCategory,
    setHourTask,
    setRoutine,
    lockState,
    tasks,
    frog,
    addTask,
    updateTask,
    removeTask,
    planTomorrowOpen,
    clearLog,
  };
}
