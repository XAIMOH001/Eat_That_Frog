import { useCallback, useMemo, useState } from "react";
import { recomputeActualHours } from "@/lib/journal-metrics";
import { isRoutineEditable, routineState } from "@/lib/routine-lock";
import {
  a1Task,
  dateKey,
  emptyDay,
  emptyHour,
  shiftKey,
  tasksForDate,
  type CategoryId,
  type DayEntry,
  type JournalData,
  type PlannedTask,
  type TaskPriority,
} from "@/lib/journal-types";

/** Advance planning is only meaningful once the day is essentially spent. */
export const PLAN_TOMORROW_OPEN_HOUR = 20;
export const PLAN_TOMORROW_CLOSE_HOUR = 23;

let seq = 0;
/**
 * Monotonic local id. Not a UUID on purpose — ids are provisional until a backend assigns real
 * primary keys, and a counter keeps them readable while debugging.
 */
function nextId(): string {
  seq += 1;
  return `t${seq}`;
}

export function useJournal(now: Date) {
  const [data, setData] = useState<JournalData>({ version: 3, days: {}, tasks: {} });
  const [selected, setSelected] = useState(() => dateKey(now));

  const day = useMemo(() => data.days[selected], [data, selected]);
  const dayOrEmpty = useMemo(() => day ?? emptyDay(), [day]);

  const mutateDay = useCallback(
    (fn: (draft: DayEntry) => DayEntry) => {
      setData((prev) => {
        const current = prev.days[selected] ?? emptyDay();
        const next = {
          ...prev,
          days: { ...prev.days, [selected]: fn({ ...current, hours: { ...current.hours } }) },
        };
        // Any hour change can move a task's actuals, so re-derive rather than incrementing.
        return recomputeActualHours(next);
      });
    },
    [selected],
  );

  const setNote = useCallback(
    (hour: number, note: string) =>
      mutateDay((d) => {
        const slot = d.hours[String(hour)] ?? emptyHour();
        d.hours[String(hour)] = { ...slot, note };
        return d;
      }),
    [mutateDay],
  );

  const setCategory = useCallback(
    (hour: number, category: CategoryId | null) =>
      mutateDay((d) => {
        const slot = d.hours[String(hour)] ?? emptyHour();
        d.hours[String(hour)] = { ...slot, category };
        return d;
      }),
    [mutateDay],
  );

  const setHourTask = useCallback(
    (hour: number, taskId: string | null) =>
      mutateDay((d) => {
        const slot = d.hours[String(hour)] ?? emptyHour();
        d.hours[String(hour)] = { ...slot, taskId };
        return d;
      }),
    [mutateDay],
  );

  /**
   * Rejects the write outright when the toggle is locked or the day is in the past, so the
   * rule holds even if a caller forgets to disable the control.
   */
  const setRoutine = useCallback(
    (value: boolean) => {
      setData((prev) => {
        if (!isRoutineEditable(routineState(prev.days[selected], selected, now))) return prev;
        const current = prev.days[selected] ?? emptyDay();
        return {
          ...prev,
          days: {
            ...prev.days,
            [selected]: {
              ...current,
              coreRoutineMaintained: value,
              routineLockedAt: value ? now.toISOString() : null,
            },
          },
        };
      });
    },
    [selected, now],
  );

  const addTask = useCallback(
    (title: string, priority: TaskPriority, targetDate: string, estimatedHours = 1) => {
      const trimmed = title.trim();
      if (!trimmed) return;
      setData((prev) => {
        const id = nextId();
        const task: PlannedTask = {
          id,
          title: trimmed,
          priority,
          targetDate,
          estimatedHours,
          actualHours: 0,
          completed: false,
        };
        return { ...prev, tasks: { ...prev.tasks, [id]: task } };
      });
    },
    [],
  );

  const updateTask = useCallback((id: string, patch: Partial<Omit<PlannedTask, "id">>) => {
    setData((prev) => {
      const task = prev.tasks[id];
      if (!task) return prev;
      return { ...prev, tasks: { ...prev.tasks, [id]: { ...task, ...patch } } };
    });
  }, []);

  const removeTask = useCallback((id: string) => {
    setData((prev) => {
      if (!prev.tasks[id]) return prev;
      const tasks = { ...prev.tasks };
      delete tasks[id];
      // Detach the task from any hour that referenced it, or those hours keep a dangling id.
      const days: Record<string, DayEntry> = {};
      for (const [key, d] of Object.entries(prev.days)) {
        let touched = false;
        const hours = { ...d.hours };
        for (const [h, slot] of Object.entries(hours)) {
          if (slot?.taskId === id) {
            hours[h] = { ...slot, taskId: null };
            touched = true;
          }
        }
        days[key] = touched ? { ...d, hours } : d;
      }
      return { ...prev, tasks, days };
    });
  }, []);

  /** Seed tomorrow's queue. Availability is decided by the caller via planTomorrowOpen. */
  const planTomorrow = useCallback(
    (title: string, priority: TaskPriority, estimatedHours = 1) =>
      addTask(title, priority, shiftKey(dateKey(now), 1), estimatedHours),
    [addTask, now],
  );

  const clearLog = useCallback(() => mutateDay((d) => ({ ...d, hours: {} })), [mutateDay]);

  const goDay = useCallback((delta: number) => setSelected((key) => shiftKey(key, delta)), []);

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
    planTomorrow,
    planTomorrowOpen,
    clearLog,
  };
}
