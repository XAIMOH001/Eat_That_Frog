"use client";

import { useEffect, useMemo, useState } from "react";
import { LayoutGrid, PieChart, Trash2 } from "lucide-react";
import { AnalyticsPanel } from "./AnalyticsPanel";
import { DayOverview } from "./DayOverview";
import { verdict } from "./DisciplineGauge";
import { FrogCard } from "./FrogCard";
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
  const [, tick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => tick((n) => n + 1), 60_000);
    return () => clearInterval(id);
  }, []);

  const onTabKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const keys = ["ArrowLeft", "ArrowRight", "Home", "End"];
    if (!keys.includes(e.key)) return;
    e.preventDefault();
    const i = TABS.findIndex((t) => t.id === tab);
    const next =
      e.key === "Home"
        ? 0
        : e.key === "End"
          ? TABS.length - 1
          : (i + (e.key === "ArrowRight" ? 1 : -1) + TABS.length) % TABS.length;
    const target = TABS[next];
    if (!target) return;
    setTab(target.id);
    document.getElementById(`tab-${target.id}`)?.focus();
  };

  const now = new Date();
  const todayKey = dateKey(now);
  const currentHour = journal.selected === todayKey ? now.getHours() : null;

  const metrics = useMemo(() => dayMetrics(journal.day), [journal.day]);
  const streak = useMemo(() => routineStreak(journal.data, todayKey), [journal.data, todayKey]);
  const best = useMemo(() => bestStreak(journal.data), [journal.data]);

  return (
    <main className="min-h-screen bg-surface px-4 py-6 sm:px-6 sm:py-10">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <HeaderBar
          selected={journal.selected}
          onSelect={journal.setSelected}
          onShift={journal.goDay}
          score={metrics.disciplineScore}
          routine={journal.day.coreRoutineMaintained}
          onRoutine={journal.setRoutine}
        />

        <FrogCard
          frog={journal.day.frog}
          onText={journal.setFrogText}
          onCompleted={journal.setFrogCompleted}
        />

        <p aria-live="polite" className="sr-only">
          {`Discipline score ${metrics.disciplineScore} out of 100. ${verdict(
            metrics.disciplineScore,
          )}. Streak ${streak} ${streak === 1 ? "day" : "days"}.`}
        </p>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div
            role="tablist"
            aria-label="Dashboard view"
            onKeyDown={onTabKeyDown}
            className="flex gap-1.5 rounded-full bg-surface p-1.5 shadow-[inset_3px_3px_6px_#a3b1c6,inset_-3px_-3px_6px_#ffffff]"
          >
            {TABS.map(({ id, label, icon: Icon }) => {
              const active = tab === id;
              return (
                <button
                  key={id}
                  id={`tab-${id}`}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  aria-controls={`panel-${id}`}
                  tabIndex={active ? 0 : -1}
                  onClick={() => setTab(id)}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-full px-5 py-2 text-sm font-semibold transition-shadow duration-200 ease-out focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none sm:flex-none ${
                    active
                      ? "bg-surface text-primary shadow-[5px_5px_10px_#a3b1c6,-5px_-5px_10px_#ffffff]"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className="size-4" aria-hidden="true" />
                  {label}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={journal.clearLog}
            className="flex items-center justify-center gap-2 rounded-full bg-surface px-5 py-2.5 text-sm font-semibold text-muted-foreground shadow-[5px_5px_10px_#a3b1c6,-5px_-5px_10px_#ffffff] transition-shadow duration-200 ease-out hover:shadow-[9px_9px_16px_#a3b1c6,-9px_-9px_16px_#ffffff] active:shadow-[inset_3px_3px_6px_#a3b1c6,inset_-3px_-3px_6px_#ffffff] focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
          >
            <Trash2 className="size-4" aria-hidden="true" />
            Clear Log
          </button>
        </div>

        <div
          id={`panel-${tab}`}
          role="tabpanel"
          aria-labelledby={`tab-${tab}`}
          tabIndex={0}
          className="focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
        >
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
        </div>

        <footer className="rounded-2xl bg-surface px-5 py-3.5 text-center shadow-[inset_3px_3px_6px_#a3b1c6,inset_-3px_-3px_6px_#ffffff]">
          <p className="text-xs text-muted-foreground">
            Session only — entries live in memory and reset when you reload.
          </p>
        </footer>
      </div>
    </main>
  );
}
