"use client";

import { useEffect, useMemo, useState } from "react";
import { LayoutGrid, PieChart, Trash2 } from "lucide-react";
import { AnalyticsPanel } from "./AnalyticsPanel";
import { DayOverview } from "./DayOverview";
import { verdict } from "./DisciplineGauge";
import { FrogCard } from "./FrogCard";
import { HeaderBar } from "./HeaderBar";
import { HourGrid } from "./HourGrid";
import { TaskQueue } from "./TaskQueue";
import { PLAN_TOMORROW_CLOSE_HOUR, PLAN_TOMORROW_OPEN_HOUR, useJournal } from "@/hooks/use-journal";
import { bestStreak, dayMetrics } from "@/lib/journal-metrics";
import { routineStreak } from "@/lib/routine-lock";
import { dateKey, shiftKey } from "@/lib/journal-types";

const TABS = [
  { id: "journal", label: "Journal", icon: LayoutGrid },
  { id: "analytics", label: "Analytics", icon: PieChart },
] as const;

type TabId = (typeof TABS)[number]["id"];

const fmtHour = (h: number) => `${String(h % 12 || 12)}${h < 12 ? "am" : "pm"}`;
const PLAN_WINDOW_LABEL = `${fmtHour(PLAN_TOMORROW_OPEN_HOUR)}–${fmtHour(
  PLAN_TOMORROW_CLOSE_HOUR + 1,
)}`;

export function JournalDashboard() {
  // Single clock read per render, threaded into everything that needs "now" so no module
  // reaches for the ambient clock on its own.
  const now = new Date();
  const journal = useJournal(now);
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

  const todayKey = dateKey(now);
  const currentHour = journal.selected === todayKey ? now.getHours() : null;

  const metrics = useMemo(
    () => dayMetrics(journal.data, journal.selected, journal.day),
    [journal.data, journal.selected, journal.day],
  );
  // todayKey rather than `now` as the dep: routineStreak only reads the calendar day out of the
  // clock, so a fresh Date on every render must not invalidate the memo.
  const streak = useMemo(
    () => routineStreak(journal.data, now),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [journal.data, todayKey],
  );
  const best = useMemo(() => bestStreak(journal.data), [journal.data]);

  // The frog card edits the A1 task by title, creating it on first keystroke. Kept here rather
  // than in the hook so the card stays a dumb text/checkbox control until the full queue lands.
  const { frog, addTask, updateTask, selected } = journal;
  const setFrogTitle = (title: string) => {
    if (frog) updateTask(frog.id, { title });
    else addTask(title, "A1", selected);
  };
  const setFrogCompleted = (completed: boolean) => {
    if (frog) updateTask(frog.id, { completed });
  };

  return (
    <main className="min-h-screen bg-surface px-4 py-6 sm:px-6 sm:py-10">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <HeaderBar
          selected={journal.selected}
          onSelect={journal.setSelected}
          onShift={journal.goDay}
          score={metrics.disciplineScore}
          routine={journal.day.coreRoutineMaintained}
          routineState={journal.lockState}
          onRoutine={journal.setRoutine}
        />

        <FrogCard frog={journal.frog} onText={setFrogTitle} onCompleted={setFrogCompleted} />

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
                tasks={journal.tasks}
                onNote={journal.setNote}
                onCategory={journal.setCategory}
                onTask={journal.setHourTask}
              />
              <div className="flex min-w-0 flex-col gap-6">
                <TaskQueue
                  tasks={journal.tasks}
                  targetDate={journal.selected}
                  isToday={journal.selected === todayKey}
                  tomorrowKey={shiftKey(todayKey, 1)}
                  planTomorrowOpen={journal.planTomorrowOpen}
                  planWindow={PLAN_WINDOW_LABEL}
                  onAdd={journal.addTask}
                  onToggle={(id, completed) => journal.updateTask(id, { completed })}
                  onRemove={journal.removeTask}
                />
                <DayOverview metrics={metrics} streak={streak} />
              </div>
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
