import { CalendarDays } from "lucide-react";
import type { HeatCell } from "@/lib/journal-metrics";

type Props = {
  cells: (HeatCell | null)[];
  monthLabel: string;
  held: number;
  elapsed: number;
};

const WEEKDAYS = ["M", "T", "W", "T", "F", "S", "S"];

export function HabitHeatmap({ cells, monthLabel, held, elapsed }: Props) {
  const cellClass = (c: HeatCell | null) => {
    if (!c) return "invisible";
    if (c.future) return "bg-surface shadow-[inset_0_0_0_1px_#cdd5e0]";
    if (c.held) return "bg-success shadow-[2px_2px_4px_#a3b1c6,-2px_-2px_4px_#ffffff]";
    return "bg-surface shadow-[inset_2px_2px_4px_#a3b1c6,inset_-2px_-2px_4px_#ffffff]";
  };

  const describe = (c: HeatCell) =>
    c.future
      ? "upcoming"
      : c.held
        ? "routine held"
        : c.logged
          ? "missed"
          : "missed, nothing logged";

  return (
    <section
      className="rounded-3xl bg-surface p-6 shadow-[9px_9px_16px_#a3b1c6,-9px_-9px_16px_#ffffff]"
      aria-label="Core routine consistency this month"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-surface shadow-[inset_3px_3px_6px_#a3b1c6,inset_-3px_-3px_6px_#ffffff]">
            <CalendarDays className="size-4 text-primary" aria-hidden="true" />
          </span>
          <h3 className="text-xs font-semibold tracking-[0.14em] text-muted-foreground uppercase">
            {monthLabel}
          </h3>
        </div>
        <p className="text-xs tabular-nums text-muted-foreground">
          {held}/{elapsed} days held
        </p>
      </div>

      <div className="mt-5" aria-hidden="true">
        <div className="mx-auto grid max-w-[19rem] grid-cols-7 gap-1.5">
          {WEEKDAYS.map((d, i) => (
            <span
              key={`${d}-${i}`}
              className="text-center text-[0.6rem] font-medium text-muted-foreground"
            >
              {d}
            </span>
          ))}
          {cells.map((c, i) => (
            <span
              key={c?.key ?? `pad-${i}`}
              title={c ? `${c.key} — ${describe(c)}` : undefined}
              className={`aspect-square rounded-[5px] ${cellClass(c)}`}
            />
          ))}
        </div>
      </div>

      <ul className="mt-4 flex list-none flex-wrap justify-center gap-4 p-0" aria-hidden="true">
        <li className="flex items-center gap-1.5 text-[0.7rem] text-muted-foreground">
          <span className="size-3 shrink-0 rounded-[3px] bg-success shadow-[2px_2px_4px_#a3b1c6,-2px_-2px_4px_#ffffff]" />
          Held
        </li>
        <li className="flex items-center gap-1.5 text-[0.7rem] text-muted-foreground">
          <span className="size-3 shrink-0 rounded-[3px] bg-surface shadow-[inset_2px_2px_4px_#a3b1c6,inset_-2px_-2px_4px_#ffffff]" />
          Missed
        </li>
        <li className="flex items-center gap-1.5 text-[0.7rem] text-muted-foreground">
          <span className="size-3 shrink-0 rounded-[3px] bg-surface shadow-[inset_0_0_0_1px_#cdd5e0]" />
          Upcoming
        </li>
      </ul>

      <div className="sr-only">
        <table>
          <caption>Core routine held per day, {monthLabel}</caption>
          <thead>
            <tr>
              <th scope="col">Date</th>
              <th scope="col">Status</th>
            </tr>
          </thead>
          <tbody>
            {cells
              .filter((c): c is HeatCell => c !== null)
              .map((c) => (
                <tr key={c.key}>
                  <th scope="row">{c.key}</th>
                  <td>{describe(c)}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
