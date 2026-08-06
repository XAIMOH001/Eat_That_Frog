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
  const [data, setData] = useState<JournalData>({ version: 1, days: {} });
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
    (value: boolean) => mutateDay((d) => ({ ...d, routineMaintained: value })),
    [mutateDay],
  );

  const clearDay = useCallback(() => mutateDay(() => emptyDay()), [mutateDay]);

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
    clearDay,
  };
}
