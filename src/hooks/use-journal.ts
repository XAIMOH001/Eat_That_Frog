import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { emptyJournal, loadJournal, saveJournal } from "@/lib/journal-storage";
import {
  dateKey,
  emptyDay,
  shiftKey,
  type CategoryId,
  type JournalData,
} from "@/lib/journal-types";

export function useJournal() {
  const [data, setData] = useState<JournalData>(() => emptyJournal());
  const [selected, setSelected] = useState<string>(() => dateKey(new Date()));
  const [hydrated, setHydrated] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setData(loadJournal());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => saveJournal(data), 250);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [data, hydrated]);

  const day = useMemo(() => data.days[selected] ?? emptyDay(), [data, selected]);

  const mutateDay = useCallback(
    (fn: (draft: ReturnType<typeof emptyDay>) => ReturnType<typeof emptyDay>) => {
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

  const goDay = useCallback((delta: number) => setSelected((k) => shiftKey(k, delta)), []);

  return {
    data,
    day,
    selected,
    hydrated,
    setSelected,
    goDay,
    setNote,
    setCategory,
    setRoutine,
    clearDay,
  };
}
