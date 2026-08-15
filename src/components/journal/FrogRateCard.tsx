import { Target, TrendingDown, TrendingUp, Minus } from "lucide-react";
import type { FrogRate } from "@/lib/journal-metrics";

type Props = {
  thisWeek: FrogRate;
  lastWeek: FrogRate;
};

export function FrogRateCard({ thisWeek, lastWeek }: Props) {
  const hasBaseline = lastWeek.planned > 0;
  const delta = hasBaseline ? thisWeek.pct - lastWeek.pct : 0;
  const dir = delta > 0 ? "up" : delta < 0 ? "down" : "flat";

  // Direction carries an icon and a word, never colour alone.
  const trend = {
    up: { Icon: TrendingUp, tone: "var(--color-success)", word: "up" },
    down: { Icon: TrendingDown, tone: "var(--cat-wasted)", word: "down" },
    flat: { Icon: Minus, tone: "var(--color-muted-foreground)", word: "level" },
  }[dir];

  const summary = !thisWeek.planned
    ? "No frogs named in the last 7 days"
    : `${thisWeek.eaten} of ${thisWeek.planned} frogs eaten in the last 7 days${
        hasBaseline ? `, ${trend.word} ${Math.abs(delta)} points versus the 7 days before` : ""
      }`;

  return (
    <section
      className="rounded-3xl bg-surface p-6 shadow-[9px_9px_16px_#a3b1c6,-9px_-9px_16px_#ffffff]"
      aria-label="Frog execution rate"
    >
      <div className="flex items-center gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-surface shadow-[inset_3px_3px_6px_#a3b1c6,inset_-3px_-3px_6px_#ffffff]">
          <Target className="size-4 text-primary" aria-hidden="true" />
        </span>
        <h3 className="text-xs font-semibold tracking-[0.14em] text-muted-foreground uppercase">
          Frog Execution Rate
        </h3>
      </div>

      <p className="sr-only">{summary}</p>

      <div className="mt-5 flex items-end gap-4" aria-hidden="true">
        <p className="text-4xl leading-none font-semibold tracking-tight tabular-nums text-foreground">
          {thisWeek.pct}
          <span className="ml-0.5 text-xl text-muted-foreground">%</span>
        </p>
        {hasBaseline ? (
          <p
            className="flex items-center gap-1 pb-1 text-sm font-semibold tabular-nums"
            style={{ color: trend.tone }}
          >
            <trend.Icon className="size-4" aria-hidden="true" />
            {delta > 0 ? "+" : ""}
            {delta}
            <span className="text-xs font-medium text-muted-foreground">pts</span>
          </p>
        ) : null}
      </div>

      <p className="mt-1.5 text-xs text-muted-foreground" aria-hidden="true">
        {thisWeek.eaten}/{thisWeek.planned} this week
        {hasBaseline
          ? ` · ${lastWeek.eaten}/${lastWeek.planned} last week`
          : " · no prior week yet"}
      </p>
    </section>
  );
}
