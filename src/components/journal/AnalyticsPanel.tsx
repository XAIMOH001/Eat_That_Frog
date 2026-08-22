import { useState } from "react";
import {
  Flame,
  Hourglass,
  RotateCcw,
  ShieldCheck,
  Target,
  TrendingDown,
  Trophy,
} from "lucide-react";
import { CategoryDonut } from "./CategoryDonut";
import { FrogRateCard } from "./FrogRateCard";
import { HabitHeatmap } from "./HabitHeatmap";
import { StatCard } from "./StatCard";
import { WeeklyBars } from "./WeeklyBars";
import {
  dailySeries,
  frogRate,
  monthGrid,
  rangeCounts,
  type DayMetrics,
  type HeatCell,
} from "@/lib/journal-metrics";
import { shiftKey, type JournalData } from "@/lib/journal-types";
import type { CommitmentCard } from "@/lib/commitment-types";

type Props = {
  data: JournalData;
  metrics: DayMetrics;
  commitment: CommitmentCard | null;
  selected: string;
  todayKey: string;
  streak: number;
  best: number;
};

const RANGES = [
  { id: "1", label: "Today", days: 1 },
  { id: "7", label: "7 days", days: 7 },
  { id: "30", label: "30 days", days: 30 },
] as const;

type RangeId = (typeof RANGES)[number]["id"];

export function AnalyticsPanel({
  data,
  metrics,
  selected,
  todayKey,
  streak,
  best,
  commitment,
}: Props) {
  const [range, setRange] = useState<RangeId>("1");
  const active = RANGES.find((r) => r.id === range) ?? RANGES[0];

  const ratio = metrics.wasted > 0 ? (metrics.productive / metrics.wasted).toFixed(1) : "—";
  const counts = rangeCounts(data, selected, active.days);
  const series = dailySeries(data, todayKey, 7);
  const thisWeek = frogRate(data, todayKey, 7);
  const lastWeek = frogRate(data, shiftKey(todayKey, -7), 7);

  const cells = monthGrid(data, selected, todayKey);
  const real = cells.filter((c): c is HeatCell => c !== null);
  const elapsed = real.filter((c) => !c.future).length;
  const heldCount = real.filter((c) => c.held).length;
  const [y, m] = selected.split("-").map(Number);
  const monthLabel = new Date(y ?? 1970, (m ?? 1) - 1, 1).toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={Target}
          label="Productive Hours"
          value={`${metrics.productive}h`}
          hint="Focus Time + Admin"
          tone="primary"
        />
        <StatCard
          icon={TrendingDown}
          label="Time Leaks"
          value={`${metrics.wasted}h`}
          hint={metrics.wasted ? `Ratio ${ratio} : 1 in your favour` : "No time leaks logged"}
          tone="warning"
        />
        <StatCard
          icon={Flame}
          label="Focus Consistency Streak"
          value={`${streak} ${streak === 1 ? "day" : "days"}`}
          hint="Consecutive days routine maintained"
          tone="success"
        />
        <StatCard
          icon={Trophy}
          label="Best Streak"
          value={`${best} ${best === 1 ? "day" : "days"}`}
          hint="Session record"
        />
      </div>

      {commitment ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            icon={Flame}
            label="Commitment Streak"
            value={`${commitment.streak} ${commitment.streak === 1 ? "day" : "days"}`}
            hint="Consecutive days kept"
            tone="success"
          />
          <StatCard
            icon={Trophy}
            label="Best Commitment Streak"
            value={`${commitment.bestStreak} ${commitment.bestStreak === 1 ? "day" : "days"}`}
            hint="Kept across every commitment"
          />
          <StatCard
            icon={ShieldCheck}
            label="Commitment Rate"
            value={commitment.ratePct === null ? "—" : `${commitment.ratePct}%`}
            hint={
              commitment.rate30Pct === null
                ? "Not enough days yet"
                : `${commitment.rate30Pct}% over 30 days`
            }
            tone="primary"
          />
          <StatCard
            icon={RotateCcw}
            label="Recoveries"
            value={`${commitment.recoveries}`}
            hint="Comebacks after a break"
          />
        </div>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-2">
        <FrogRateCard thisWeek={thisWeek} lastWeek={lastWeek} />
        <WeeklyBars series={series} />
      </div>

      <section
        className="rounded-3xl bg-surface p-6 shadow-[9px_9px_16px_#a3b1c6,-9px_-9px_16px_#ffffff]"
        aria-label="Time distribution by category"
      >
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="grid size-9 place-items-center rounded-full bg-surface shadow-[inset_3px_3px_6px_#a3b1c6,inset_-3px_-3px_6px_#ffffff]">
              <Hourglass className="size-4 text-primary" aria-hidden="true" />
            </span>
            <h2 className="text-lg font-semibold tracking-tight text-foreground">
              Time Distribution
            </h2>
          </div>

          <div
            role="group"
            aria-label="Time distribution range"
            className="flex gap-1.5 rounded-full bg-surface p-1.5 shadow-[inset_3px_3px_6px_#a3b1c6,inset_-3px_-3px_6px_#ffffff]"
          >
            {RANGES.map((r) => {
              const on = r.id === range;
              return (
                <button
                  key={r.id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => setRange(r.id)}
                  className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-shadow duration-200 ease-out focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none ${
                    on
                      ? "bg-surface text-primary shadow-[5px_5px_10px_#a3b1c6,-5px_-5px_10px_#ffffff]"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {r.label}
                </button>
              );
            })}
          </div>
        </div>
        <CategoryDonut counts={counts} />
      </section>

      <HabitHeatmap cells={cells} monthLabel={monthLabel} held={heldCount} elapsed={elapsed} />
    </div>
  );
}
