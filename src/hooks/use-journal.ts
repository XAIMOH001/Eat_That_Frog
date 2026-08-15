import { useCallback, useMemo, useState } from "react";
import {
  dateKey,
  emptyDay,
  shiftKey,
  type CategoryId,
  type DayEntry,
  type JournalData,
} from "@/lib/journal-types";

export function useJournal() {
  const [data, setData] = useState<JournalData>({ version: 2, days: {} });
  const [selected, setSelected] = useState(() => dateKey(new Date()));

  const day = useMemo(() => data.days[selected] ?? emptyDay(), [data, selected]);

  const mutateDay = useCallback(
    (fn: (draft: DayEntry) => DayEntry) => {
      setData((prev) => {
        const current = prev.days[selected] ?? emptyDay();
        return {
          ...prev,
          days: { ...prev.days, [selected]: fn({ ...current, hours: { ...current.hours } }) },
        };
      });
    },
    [selected],
  );

  const setNote = useCallback(
    (hour: number, note: string) =>
      mutateDay((d) => {
        const slot = d.hours[String(hour)] ?? { note: "", category: null };
        d.hours[String(hour)] = { ...slot, note };
        return d;
      }),
    [mutateDay],
  );

  const setCategory = useCallback(
    (hour: number, category: CategoryId | null) =>
      mutateDay((d) => {
        const slot = d.hours[String(hour)] ?? { note: "", category: null };
        d.hours[String(hour)] = { ...slot, category };
        return d;
      }),
    [mutateDay],
  );

  const setRoutine = useCallback(
    (value: boolean) => mutateDay((d) => ({ ...d, coreRoutineMaintained: value })),
    [mutateDay],
  );

  const setFrogText = useCallback(
    (text: string) => mutateDay((d) => ({ ...d, frog: { ...d.frog, text } })),
    [mutateDay],
  );

  const setFrogCompleted = useCallback(
    (value: boolean) => mutateDay((d) => ({ ...d, frog: { ...d.frog, completed: value } })),
    [mutateDay],
  );

  const clearLog = useCallback(() => mutateDay((d) => ({ ...d, hours: {} })), [mutateDay]);

  const goDay = useCallback((delta: number) => setSelected((key) => shiftKey(key, delta)), []);

  return {
    data,
    day,
    selected,
    setSelected,
    goDay,
    setNote,
    setCategory,
    setRoutine,
    setFrogText,
    setFrogCompleted,
    clearLog,
  };
}
