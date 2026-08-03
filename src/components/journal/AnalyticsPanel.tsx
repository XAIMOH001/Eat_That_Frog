import { Flame, Hourglass, Target, TrendingDown, Trophy } from "lucide-react";
import type { DayMetrics } from "@/lib/journal-metrics";
import { CategoryDonut } from "./CategoryDonut";
import { StatCard } from "./StatCard";

type Props = {
  metrics: DayMetrics;
  streak: number;
  best: number;
};

export function AnalyticsPanel({ metrics, streak, best }: Props) {
  const ratio = metrics.wasted > 0 ? (metrics.productive / metrics.wasted).toFixed(1) : "—";

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
          label="Wasted Hours"
          value={`${metrics.wasted}h`}
          hint={metrics.wasted ? `Ratio ${ratio} : 1 in your favour` : "Nothing logged as wasted"}
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
          hint="All-time record"
        />
      </div>

      <section className="neu-raised rounded-3xl p-6" aria-label="Time distribution by category">
        <div className="mb-6 flex items-center gap-3">
          <span className="neu-inset-sm grid size-9 place-items-center rounded-full">
            <Hourglass className="size-4 text-primary" />
          </span>
          <h2 className="text-lg font-semibold tracking-tight text-foreground">
            Time Distribution
          </h2>
        </div>
        <CategoryDonut metrics={metrics} />
      </section>
    </div>
  );
}
