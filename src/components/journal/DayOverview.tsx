import type { DayMetrics } from "@/lib/journal-metrics";

type Props = {
  metrics: DayMetrics;
  streak: number;
};

export function DayOverview({ metrics, streak }: Props) {
  const rows = [
    { label: "Productive", value: `${metrics.productive}h`, color: "var(--cat-focus)" },
    { label: "Rest", value: `${metrics.rest}h`, color: "var(--cat-rest)" },
    { label: "Leaks", value: `${metrics.wasted}h`, color: "var(--cat-wasted)" },
    { label: "Unlogged", value: `${24 - metrics.logged}h`, color: "var(--color-muted-foreground)" },
  ];

  return (
    <section
      className="h-fit rounded-3xl bg-surface p-6 shadow-[9px_9px_16px_#a3b1c6,-9px_-9px_16px_#ffffff]"
      aria-label="Day overview"
    >
      <h2 className="text-lg font-semibold tracking-tight text-foreground">Day Overview</h2>
      <ul className="mt-5 space-y-2.5">
        {rows.map((row) => (
          <li
            key={row.label}
            className="flex items-center justify-between rounded-2xl bg-surface px-4 py-3 shadow-[inset_3px_3px_6px_#a3b1c6,inset_-3px_-3px_6px_#ffffff]"
          >
            <span className="text-sm font-medium text-foreground">{row.label}</span>
            <span className="text-sm font-semibold tabular-nums" style={{ color: row.color }}>
              {row.value}
            </span>
          </li>
        ))}
      </ul>
      <div className="mt-5 rounded-2xl bg-surface px-4 py-4 text-center shadow-[inset_3px_3px_6px_#a3b1c6,inset_-3px_-3px_6px_#ffffff]">
        <p className="text-[0.65rem] font-semibold tracking-[0.16em] text-muted-foreground uppercase">
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
