import { BarChart3 } from "lucide-react";
import type { DayBar } from "@/lib/journal-metrics";

type Props = { series: DayBar[] };

const SERIES = [
  { key: "productive" as const, label: "Productive", tone: "var(--cat-focus)" },
  { key: "wasted" as const, label: "Leaks", tone: "var(--cat-wasted)" },
];

const PLOT_H = 132;

export function WeeklyBars({ series }: Props) {
  const peak = Math.max(8, ...series.map((d) => d.productive + d.wasted));
  const dayLabel = (key: string) => {
    const [y, m, d] = key.split("-").map(Number);
    return new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1).toLocaleDateString(undefined, {
      weekday: "narrow",
    });
  };
  const fullDate = (key: string) => {
    const [y, m, d] = key.split("-").map(Number);
    return new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1).toLocaleDateString(undefined, {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
  };

  return (
    <section
      className="rounded-3xl bg-surface p-6 shadow-[9px_9px_16px_#a3b1c6,-9px_-9px_16px_#ffffff]"
      aria-label="Productive hours versus time leaks, last 7 days"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-surface shadow-[inset_3px_3px_6px_#a3b1c6,inset_-3px_-3px_6px_#ffffff]">
            <BarChart3 className="size-4 text-primary" aria-hidden="true" />
          </span>
          <h3 className="text-xs font-semibold tracking-[0.14em] text-muted-foreground uppercase">
            Last 7 Days
          </h3>
        </div>

        <ul className="flex list-none gap-4 p-0">
          {SERIES.map((s) => (
            <li key={s.key} className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span
                aria-hidden="true"
                className="size-2.5 shrink-0 rounded-xs"
                style={{ background: s.tone }}
              />
              {s.label}
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-6 flex items-end justify-between gap-2" aria-hidden="true">
        {series.map((d) => {
          const stack = d.productive + d.wasted;
          return (
            <div key={d.key} className="flex min-w-0 flex-1 flex-col items-center gap-2">
              <span className="text-[0.65rem] tabular-nums text-muted-foreground">
                {stack || ""}
              </span>
              <div
                className="flex w-full max-w-9 flex-col justify-end rounded-lg bg-surface shadow-[inset_3px_3px_6px_#a3b1c6,inset_-3px_-3px_6px_#ffffff]"
                style={{ height: PLOT_H }}
                title={`${fullDate(d.key)} — ${d.productive}h productive, ${d.wasted}h leaked`}
              >
                {d.wasted > 0 ? (
                  <div
                    className="w-full rounded-t-sm"
                    style={{
                      height: (d.wasted / peak) * PLOT_H,
                      background: SERIES[1]?.tone,
                      marginBottom: d.productive > 0 ? 2 : 0,
                    }}
                  />
                ) : null}
                {d.productive > 0 ? (
                  <div
                    className="w-full"
                    style={{
                      height: (d.productive / peak) * PLOT_H,
                      background: SERIES[0]?.tone,
                      borderRadius: d.wasted > 0 ? "0 0 4px 4px" : "4px",
                    }}
                  />
                ) : null}
              </div>
              <span className="text-[0.65rem] font-medium tabular-nums text-muted-foreground">
                {dayLabel(d.key)}
              </span>
            </div>
          );
        })}
      </div>

      <p className="mt-3 text-[0.65rem] text-muted-foreground" aria-hidden="true">
        Scale 0–{peak}h
      </p>

      <div className="sr-only">
        <table>
          <caption>Productive hours and time leaks per day, last 7 days</caption>
          <thead>
            <tr>
              <th scope="col">Day</th>
              <th scope="col">Productive hours</th>
              <th scope="col">Time leaks (hours)</th>
            </tr>
          </thead>
          <tbody>
            {series.map((d) => (
              <tr key={d.key}>
                <th scope="row">{fullDate(d.key)}</th>
                <td>{d.productive}</td>
                <td>{d.wasted}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
