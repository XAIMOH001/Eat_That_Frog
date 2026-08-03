import { CATEGORIES } from "@/lib/journal-types";
import type { DayMetrics } from "@/lib/journal-metrics";

type Props = { metrics: DayMetrics };

export function CategoryDonut({ metrics }: Props) {
  const total = metrics.logged;
  const radius = 62;
  const circumference = 2 * Math.PI * radius;
  let cursor = 0;

  return (
    <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center sm:justify-around">
      <div className="neu-inset relative grid size-52 shrink-0 place-items-center rounded-full">
        <svg viewBox="0 0 160 160" className="absolute size-52 -rotate-90">
          <circle
            cx="80"
            cy="80"
            r={radius}
            fill="none"
            stroke="rgba(163,177,198,0.28)"
            strokeWidth="18"
          />
          {total > 0 &&
            CATEGORIES.map((c) => {
              const value = metrics.counts[c.id];
              if (!value) return null;
              const length = (value / total) * circumference;
              const dash = `${Math.max(length - 3, 1)} ${circumference}`;
              const offset = -cursor;
              cursor += length;
              return (
                <circle
                  key={c.id}
                  cx="80"
                  cy="80"
                  r={radius}
                  fill="none"
                  stroke={c.colorVar}
                  strokeWidth="18"
                  strokeLinecap="round"
                  strokeDasharray={dash}
                  strokeDashoffset={offset}
                  style={{ transition: "stroke-dasharray 300ms ease" }}
                />
              );
            })}
        </svg>
        <div className="relative text-center">
          <span className="block text-3xl font-semibold tracking-tight text-foreground">
            {total}
          </span>
          <span className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            hours logged
          </span>
        </div>
      </div>

      <ul className="w-full max-w-xs space-y-2.5">
        {CATEGORIES.map((c) => {
          const value = metrics.counts[c.id];
          const pct = total ? Math.round((value / total) * 100) : 0;
          return (
            <li
              key={c.id}
              className="neu-raised-sm flex items-center gap-3 rounded-xl px-3.5 py-2.5"
            >
              <span
                className="size-2.5 shrink-0 rounded-full"
                style={{ background: c.colorVar }}
                aria-hidden
              />
              <span className="flex-1 text-sm font-medium text-foreground">{c.label}</span>
              <span className="font-mono text-sm tabular-nums text-muted-foreground">
                {value}h · {pct}%
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
