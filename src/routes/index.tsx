import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Download, LayoutGrid, PieChart, ShieldCheck, Trash2 } from "lucide-react";
import { AnalyticsPanel } from "@/components/journal/AnalyticsPanel";
import { HeaderBar } from "@/components/journal/HeaderBar";
import { HourGrid } from "@/components/journal/HourGrid";
import { useJournal } from "@/hooks/use-journal";
import { bestStreak, dayMetrics, routineStreak } from "@/lib/journal-metrics";
import { exportJournal } from "@/lib/journal-storage";
import { dateKey } from "@/lib/journal-types";

const title = "Focus Journal — Personal Time-Audit & Daily Discipline";
const description =
  "A private, offline daily time-blocking journal: audit every hour, score your discipline, and track focus consistency streaks. All data stays in your browser.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: JournalPage,
});

function JournalPage() {
  const journal = useJournal();
  const [tab, setTab] = useState<"journal" | "analytics">("journal");
  const [currentHour, setCurrentHour] = useState<number | null>(null);

  useEffect(() => {
    const update = () =>
      setCurrentHour(journal.selected === dateKey(new Date()) ? new Date().getHours() : null);
    update();
    const id = setInterval(update, 60_000);
    return () => clearInterval(id);
  }, [journal.selected]);

  const metrics = useMemo(() => dayMetrics(journal.day), [journal.day]);
  const streak = useMemo(
    () => routineStreak(journal.data, journal.selected),
    [journal.data, journal.selected],
  );
  const best = useMemo(() => bestStreak(journal.data), [journal.data]);

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 sm:py-10">
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
          <div className="neu-inset flex gap-1.5 rounded-full p-1.5">
            {(
              [
                { id: "journal", label: "Journal", icon: LayoutGrid },
                { id: "analytics", label: "Analytics", icon: PieChart },
              ] as const
            ).map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                aria-pressed={tab === id}
                onClick={() => setTab(id)}
                className={`neu-focus flex flex-1 items-center justify-center gap-2 rounded-full px-5 py-2 text-sm font-semibold sm:flex-none ${
                  tab === id
                    ? "neu-raised-sm text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="size-4" />
                {label}
              </button>
            ))}
          </div>

          <div className="flex gap-2.5">
            <button
              type="button"
              onClick={() => exportJournal(journal.data)}
              className="neu-raised-sm neu-press neu-focus flex flex-1 items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-foreground sm:flex-none"
            >
              <Download className="size-4" />
              Export JSON Backup
            </button>
            <button
              type="button"
              onClick={journal.clearDay}
              aria-label="Clear this day"
              className="neu-raised-sm neu-press neu-focus grid size-11 shrink-0 place-items-center rounded-full text-muted-foreground"
            >
              <Trash2 className="size-4" />
            </button>
          </div>
        </div>

        {tab === "journal" ? (
          <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
            <HourGrid
              day={journal.day}
              currentHour={currentHour}
              onNote={journal.setNote}
              onCategory={journal.setCategory}
            />
            <div className="space-y-4">
              <AnalyticsPanelCompact metrics={metrics} streak={streak} />
            </div>
          </div>
        ) : (
          <AnalyticsPanel metrics={metrics} streak={streak} best={best} />
        )}

        <footer className="neu-inset flex items-center justify-center gap-2 rounded-2xl px-5 py-3.5 text-center">
          <ShieldCheck className="size-4 shrink-0 text-success" />
          <p className="text-xs text-muted-foreground">
            100% offline — every entry is stored only in this browser&apos;s local storage.
          </p>
        </footer>
      </div>
    </main>
  );
}

function AnalyticsPanelCompact({
  metrics,
  streak,
}: {
  metrics: ReturnType<typeof dayMetrics>;
  streak: number;
}) {
  const rows = [
    { label: "Productive", value: `${metrics.productive}h`, color: "var(--cat-focus)" },
    { label: "Rest", value: `${metrics.rest}h`, color: "var(--cat-rest)" },
    { label: "Wasted", value: `${metrics.wasted}h`, color: "var(--cat-wasted)" },
    { label: "Unlogged", value: `${24 - metrics.logged}h`, color: "var(--muted-foreground)" },
  ];

  return (
    <section className="neu-raised rounded-3xl p-6" aria-label="Day overview">
      <h2 className="text-lg font-semibold tracking-tight text-foreground">Day Overview</h2>
      <ul className="mt-5 space-y-2.5">
        {rows.map((row) => (
          <li
            key={row.label}
            className="neu-inset-sm flex items-center justify-between rounded-xl px-4 py-3"
          >
            <span className="text-sm font-medium text-foreground">{row.label}</span>
            <span className="font-mono text-sm font-semibold tabular-nums" style={{ color: row.color }}>
              {row.value}
            </span>
          </li>
        ))}
      </ul>
      <div className="neu-inset mt-5 rounded-2xl px-4 py-4 text-center">
        <p className="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Focus Consistency Streak
        </p>
        <p className="mt-1 text-3xl font-semibold tracking-tight text-success">
          {streak}
          <span className="ml-1 text-sm font-medium text-muted-foreground">
            {streak === 1 ? "day" : "days"}
          </span>
        </p>
      </div>
    </section>
  );
}
