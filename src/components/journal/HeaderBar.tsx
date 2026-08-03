import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { dateKey, prettyDate } from "@/lib/journal-types";
import { DisciplineGauge } from "./DisciplineGauge";
import { RoutineToggle } from "./RoutineToggle";

type Props = {
  selected: string;
  onSelect: (key: string) => void;
  onShift: (delta: number) => void;
  score: number;
  routine: boolean;
  onRoutine: (value: boolean) => void;
};

export function HeaderBar({
  selected,
  onSelect,
  onShift,
  score,
  routine,
  onRoutine,
}: Props) {
  const isToday = selected === dateKey(new Date());

  return (
    <header className="neu-raised-lg rounded-3xl p-5 sm:p-7">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-primary">
            Personal Focus &amp; Time Audit
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            {prettyDate(selected)}
          </h1>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button
              type="button"
              aria-label="Previous day"
              onClick={() => onShift(-1)}
              className="neu-raised-sm neu-press neu-focus grid size-10 place-items-center rounded-full text-muted-foreground"
            >
              <ChevronLeft className="size-4" />
            </button>
            <label className="neu-inset neu-focus flex items-center gap-2 rounded-full px-4 py-2">
              <Calendar className="size-4 text-muted-foreground" />
              <input
                type="date"
                value={selected}
                onChange={(e) => e.target.value && onSelect(e.target.value)}
                aria-label="Select date"
                className="bg-transparent font-mono text-sm tabular-nums text-foreground outline-none"
              />
            </label>
            <button
              type="button"
              aria-label="Next day"
              onClick={() => onShift(1)}
              className="neu-raised-sm neu-press neu-focus grid size-10 place-items-center rounded-full text-muted-foreground"
            >
              <ChevronRight className="size-4" />
            </button>
            {!isToday && (
              <button
                type="button"
                onClick={() => onSelect(dateKey(new Date()))}
                className="neu-raised-sm neu-press neu-focus rounded-full px-4 py-2 text-xs font-semibold text-primary"
              >
                Today
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between sm:gap-8">
          <DisciplineGauge score={score} />
          <RoutineToggle checked={routine} onChange={onRoutine} />
        </div>
      </div>
    </header>
  );
}
