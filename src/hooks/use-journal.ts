import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { recomputeActualHours } from "@/lib/journal-metrics";
import { journalHref } from "@/lib/routes";
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

export const PLAN_TOMORROW_OPEN_HOUR = 20;
export const PLAN_TOMORROW_CLOSE_HOUR = 23;

const DEBOUNCE_MS = 600;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isPersisted(id: string): boolean {
  return UUID.test(id);
}

export type UseJournalOptions = {
  selected: string;
  initialData: JournalData;
  onNeedsReauth?: (() => void) | undefined;
};

let seq = 0;
function nextId(): string {
  seq += 1;
  return `t${seq}`;
}

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

export type SyncError = { message: string; sessionEnded: boolean };

export function useJournal(now: Date, { selected, initialData, onNeedsReauth }: UseJournalOptions) {
  const router = useRouter();
  const [navPending, startNav] = useTransition();

  const [data, setData] = useState<JournalData>(initialData);
  const [syncError, setSyncError] = useState<SyncError | null>(null);

  const stateRef = useRef(data);

  const needsReauthRef = useRef(onNeedsReauth);
  useEffect(() => {
    needsReauthRef.current = onNeedsReauth;
  }, [onNeedsReauth]);

  const commit = useCallback((next: JournalData) => {
    stateRef.current = next;
    setData(next);
  }, []);

  const [prevInitialData, setPrevInitialData] = useState(initialData);
  if (initialData !== prevInitialData) {
    setPrevInitialData(initialData);
    setData(initialData);
  }

  useEffect(() => {
    stateRef.current = data;
  }, [data]);

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

          if (result.error === "unauthenticated") {
            setSyncError({
              message: `Your session ended, so the change to ${what} was undone.`,
              sessionEnded: true,
            });
            router.refresh();
            return;
          }

          if (result.error === "needs_reauth") {
            needsReauthRef.current?.();
            return;
          }

          setSyncError({
            message:
              result.error === "not_allowed"
                ? `That change to ${what} isn't allowed any more, so it was undone.`
                : `Couldn't save ${what}. Your change was undone.`,
            sessionEnded: false,
          });
        },
        (error: unknown) => {
          console.error(`[journal] ${what} failed:`, error);
          rollback();
          setSyncError({
            message: `Couldn't reach the server to save ${what}. Your change was undone.`,
            sessionEnded: false,
          });
        },
      ),
    [router],
  );

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

  const flushPending = useCallback(async () => {
    const entries = [...pending.current.values()];
    cancelPending();
    await Promise.allSettled(entries.map((entry) => entry.run()));
  }, [cancelPending]);

  const queue = useCallback(
    (key: string, task: () => Promise<void>, debounce: boolean) => {
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

  const creating = useRef(new Set<string>());

  const addTask = useCallback(
    (title: string, priority: TaskPriority, targetDate: string, estimatedHours = 1) => {
      const trimmed = title.trim();
      if (!trimmed) return;

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

      const untagged = retagHours(withTask(current, id, undefined), id, null);
      commit(untagged.data);

      if (!isPersisted(id)) return;

      void persist(
        () => deletePlannedTask(id),
        () => {
          const restored = withTask(stateRef.current, id, previous);
          commit(setTaskIdOn(restored, untagged.touched, id));
        },
        "the deleted task",
      );
    },
    [commit, persist],
  );

  const goTo = useCallback(
    async (key: string) => {
      if (key === selected) return;
      await flushPending();
      startNav(() => router.push(journalHref(key)));
    },
    [selected, flushPending, router],
  );

  const goDay = useCallback(
    (delta: number) => void goTo(shiftKey(selected, delta)),
    [goTo, selected],
  );

  const setSelected = useCallback((key: string) => void goTo(key), [goTo]);

  const dismissError = useCallback(() => setSyncError(null), []);

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
    flushPending,
    persist,
  };
}
