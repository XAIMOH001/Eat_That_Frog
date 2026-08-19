"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { LayoutGrid, PieChart, Trash2 } from "lucide-react";
import { AnalyticsPanel } from "./AnalyticsPanel";
import { ConfirmDialog } from "./ConfirmDialog";
import { CoreRoutineModal } from "./CoreRoutineModal";
import { DailyQuoteCard } from "./DailyQuoteCard";
import { DayOverview } from "./DayOverview";
import { verdict } from "./DisciplineGauge";
import { FrogCard } from "./FrogCard";
import { HeaderBar } from "./HeaderBar";
import { HourGrid } from "./HourGrid";
import { TaskQueue } from "./TaskQueue";
import { PLAN_TOMORROW_CLOSE_HOUR, PLAN_TOMORROW_OPEN_HOUR, useJournal } from "@/hooks/use-journal";
import { bestStreak, dayMetrics } from "@/lib/journal-metrics";
import { isRoutineEditable, routineStreak } from "@/lib/routine-lock";
import { dateKey, prettyDate, shiftKey } from "@/lib/journal-types";

const TABS = [
  { id: "journal", label: "Journal", icon: LayoutGrid },
  { id: "analytics", label: "Analytics", icon: PieChart },
] as const;

type TabId = (typeof TABS)[number]["id"];

/**
 * Exactly one dialog at a time. Both save and restore document.body.style.overflow on open and
 * close, so two open at once can restore "hidden" last and leave the page unscrollable with
 * nothing on screen to dismiss.
 */
type DialogId = "clear" | "routine";

// Wrap into the 24h day first: the close hour is expressed as 24, and formatting that
// directly yields "12pm" — the label would say the planning window shuts at noon.
const fmtHour = (h: number) => {
  const hr = h % 24;
  return `${hr % 12 || 12}${hr < 12 ? "am" : "pm"}`;
};
const PLAN_WINDOW_LABEL = `${fmtHour(PLAN_TOMORROW_OPEN_HOUR)}–${fmtHour(
  PLAN_TOMORROW_CLOSE_HOUR + 1,
)}`;

export function JournalDashboard() {
  // Single clock read per render, threaded into everything that needs "now" so no module
  // reaches for the ambient clock on its own.
  const now = new Date();
  const journal = useJournal(now);
  const [tab, setTab] = useState<TabId>("journal");
  const [dialog, setDialog] = useState<DialogId | null>(null);
  const [, tick] = useState(0);

  const closeDialog = useCallback(() => setDialog(null), []);

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

  // Midnight can pass while the modal sits open, at which point the hook's own guard would
  // reject the write and Confirm would be a silent no-op. Derived rather than synced through an
  // effect: the 60s tick re-evaluates this, the modal unmounts itself, and the toggle falls
  // through to showing the day as missed.
  const routineEditable = isRoutineEditable(journal.lockState);

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

  const loggedHours = Object.values(journal.day.hours).filter((h) => h?.category || h?.note).length;
  const taggedHours = Object.values(journal.day.hours).filter((h) => h?.taskId).length;

  return (
    <main className="min-h-screen bg-surface px-4 py-6 sm:px-6 sm:py-10">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <HeaderBar
          selected={journal.selected}
          onSelect={journal.setSelected}
          onShift={journal.goDay}
          score={metrics.disciplineScore}
          frogEaten={metrics.sFrog === 100}
          routine={journal.day.coreRoutineMaintained}
          routineState={journal.lockState}
          onRoutineRequest={(value) => {
            // Only anchoring is gated. `value === false` is reachable solely in the reopened
            // state, where nothing is locked and there is no commitment to confirm.
            if (value) setDialog("routine");
            else journal.setRoutine(false);
          }}
        />

        <DailyQuoteCard key={journal.selected} dateKey={journal.selected} />

        <FrogCard frog={journal.frog} onText={setFrogTitle} onCompleted={setFrogCompleted} />

        <p aria-live="polite" className="sr-only">
          {`Discipline score ${metrics.disciplineScore} out of 100. ${verdict(
            metrics.disciplineScore,
            metrics.sFrog === 100,
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
            aria-disabled={loggedHours === 0}
            onClick={() => {
              if (loggedHours > 0) setDialog("clear");
            }}
            className={`flex items-center justify-center gap-2 rounded-full bg-surface px-5 py-2.5 text-sm font-semibold text-muted-foreground transition-shadow duration-200 ease-out focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none ${
              loggedHours === 0
                ? "shadow-[3px_3px_6px_#a3b1c6,-3px_-3px_6px_#ffffff]"
                : "shadow-[5px_5px_10px_#a3b1c6,-5px_-5px_10px_#ffffff] hover:shadow-[9px_9px_16px_#a3b1c6,-9px_-9px_16px_#ffffff] active:shadow-[inset_3px_3px_6px_#a3b1c6,inset_-3px_-3px_6px_#ffffff]"
            }`}
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
            <AnalyticsPanel
              data={journal.data}
              metrics={metrics}
              selected={journal.selected}
              todayKey={todayKey}
              streak={streak}
              best={best}
            />
          )}
        </div>

        <ConfirmDialog
          open={dialog === "clear"}
          title="Clear the hour log?"
          body={
            <>
              <p>
                This removes {loggedHours === 1 ? "1 logged hour" : `${loggedHours} logged hours`}
                {taggedHours > 0
                  ? ` and ${taggedHours === 1 ? "its task tag" : `their ${taggedHours} task tags`}`
                  : ""}{" "}
                for {prettyDate(journal.selected)}.
              </p>
              {taggedHours > 0 ? (
                <p>Hours logged against your tasks will drop back to zero.</p>
              ) : null}
              <p>Your frog and the routine flag are not affected. This cannot be undone.</p>
            </>
          }
          confirmLabel="Clear Log"
          onConfirm={() => {
            journal.clearLog();
            closeDialog();
          }}
          onCancel={closeDialog}
        />

        <CoreRoutineModal
          open={dialog === "routine" && routineEditable}
          onConfirm={() => {
            journal.setRoutine(true);
            closeDialog();
          }}
          onCancel={closeDialog}
        />

        <footer className="rounded-2xl bg-surface px-5 py-3.5 text-center shadow-[inset_3px_3px_6px_#a3b1c6,inset_-3px_-3px_6px_#ffffff]">
          <p className="text-xs text-muted-foreground">
            Session only — entries live in memory and reset when you reload.
          </p>
        </footer>
      </div>
    </main>
  );
}
