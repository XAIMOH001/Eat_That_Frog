"use client";

import { useEffect, useMemo, useState } from "react";
import { LayoutGrid, PieChart, Trash2 } from "lucide-react";
import { AnalyticsPanel } from "./AnalyticsPanel";
import { DayOverview } from "./DayOverview";
import { HeaderBar } from "./HeaderBar";
import { HourGrid } from "./HourGrid";
import { useJournal } from "@/hooks/use-journal";
import { bestStreak, dayMetrics, routineStreak } from "@/lib/journal-metrics";
import { dateKey } from "@/lib/journal-types";

const TABS = [
  { id: "journal", label: "Journal", icon: LayoutGrid },
  { id: "analytics", label: "Analytics", icon: PieChart },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function JournalDashboard() {
  const journal = useJournal();
  const [tab, setTab] = useState<TabId>("journal");
  // The tick only forces a re-read of the clock; the highlighted hour itself is
  // derived below so it stays correct on every render, not just on the minute.
  const [, tick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => tick((n) => n + 1), 60_000);
    return () => clearInterval(id);
  }, []);

  const now = new Date();
  const currentHour = journal.selected === dateKey(now) ? now.getHours() : null;

  const metrics = useMemo(() => dayMetrics(journal.day), [journal.day]);
  const streak = useMemo(
    () => routineStreak(journal.data, journal.selected),
    [journal.data, journal.selected],
  );
  const best = useMemo(() => bestStreak(journal.data), [journal.data]);

  return (
    <main className="min-h-screen bg-[#e0e5ec] px-4 py-6 sm:px-6 sm:py-10">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <HeaderBar
          selected={journal.selected}
          onSelect={journal.setSelected}
          onShift={journal.goDay}
          score={metrics.disciplineScore}
          routine={journal.day.routineMaintained}
          onRoutine={journal.setRoutine}
        />

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-1.5 rounded-full bg-[#e0e5ec] p-1.5 shadow-[inset_3px_3px_6px_#a3b1c6,inset_-3px_-3px_6px_#ffffff]">
            {TABS.map(({ id, label, icon: Icon }) => {
              const active = tab === id;
              return (
                <button
                  key={id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setTab(id)}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-full px-5 py-2 text-sm font-semibold transition-shadow duration-200 ease-out focus-visible:ring-2 focus-visible:ring-[#6c5ce7]/45 focus-visible:outline-none sm:flex-none ${
                    active
                      ? "bg-[#e0e5ec] text-primary shadow-[5px_5px_10px_#a3b1c6,-5px_-5px_10px_#ffffff]"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className="size-4" />
                  {label}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={journal.clearDay}
            className="flex items-center justify-center gap-2 rounded-full bg-[#e0e5ec] px-5 py-2.5 text-sm font-semibold text-muted-foreground shadow-[5px_5px_10px_#a3b1c6,-5px_-5px_10px_#ffffff] transition-shadow duration-200 ease-out hover:shadow-[9px_9px_16px_#a3b1c6,-9px_-9px_16px_#ffffff] active:shadow-[inset_3px_3px_6px_#a3b1c6,inset_-3px_-3px_6px_#ffffff] focus-visible:ring-2 focus-visible:ring-[#6c5ce7]/45 focus-visible:outline-none"
          >
            <Trash2 className="size-4" />
            Clear Day
          </button>
        </div>

        {tab === "journal" ? (
          <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
            <HourGrid
              day={journal.day}
              currentHour={currentHour}
              onNote={journal.setNote}
              onCategory={journal.setCategory}
            />
            <DayOverview metrics={metrics} streak={streak} />
          </div>
        ) : (
          <AnalyticsPanel metrics={metrics} streak={streak} best={best} />
        )}

        <footer className="rounded-2xl bg-[#e0e5ec] px-5 py-3.5 text-center shadow-[inset_3px_3px_6px_#a3b1c6,inset_-3px_-3px_6px_#ffffff]">
          <p className="text-xs text-muted-foreground">
            Session only — entries live in memory and reset when you reload.
          </p>
        </footer>
      </div>
    </main>
  );
}
