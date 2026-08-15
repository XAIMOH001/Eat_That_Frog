import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { DisciplineGauge } from "./DisciplineGauge";
import { RoutineToggle } from "./RoutineToggle";
import type { RoutineState } from "@/lib/routine-lock";
import { dateKey, prettyDate } from "@/lib/journal-types";

type Props = {
  selected: string;
  onSelect: (key: string) => void;
  onShift: (delta: number) => void;
  score: number;
  routine: boolean;
  routineState: RoutineState;
  onRoutine: (value: boolean) => void;
};

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const MIN_DATE = "2000-01-01";
const MAX_DATE = "2100-12-31";

const navButton =
  "grid size-10 place-items-center rounded-full bg-surface text-muted-foreground shadow-[5px_5px_10px_#a3b1c6,-5px_-5px_10px_#ffffff] transition-shadow duration-200 ease-out hover:shadow-[9px_9px_16px_#a3b1c6,-9px_-9px_16px_#ffffff] active:shadow-[inset_3px_3px_6px_#a3b1c6,inset_-3px_-3px_6px_#ffffff] focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none";

export function HeaderBar({
  selected,
  onSelect,
  onShift,
  score,
  routine,
  routineState,
  onRoutine,
}: Props) {
  const isToday = selected === dateKey(new Date());

  return (
    <header className="rounded-3xl bg-surface p-5 shadow-[9px_9px_16px_#a3b1c6,-9px_-9px_16px_#ffffff] sm:p-7">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-[0.65rem] font-semibold tracking-[0.22em] text-primary uppercase">
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
              className={navButton}
            >
              <ChevronLeft className="size-4" aria-hidden="true" />
            </button>

            <label className="flex items-center gap-2 rounded-full bg-surface px-4 py-2 shadow-[inset_3px_3px_6px_#a3b1c6,inset_-3px_-3px_6px_#ffffff]">
              <Calendar className="size-4 text-muted-foreground" aria-hidden="true" />
              <input
                type="date"
                value={selected}
                min={MIN_DATE}
                max={MAX_DATE}
                onChange={(e) => {
                  const next = e.target.value;
                  if (ISO_DATE.test(next) && next >= MIN_DATE && next <= MAX_DATE) onSelect(next);
                }}
                aria-label="Select date"
                className="bg-transparent text-sm tabular-nums text-foreground outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
              />
            </label>

            <button
              type="button"
              aria-label="Next day"
              onClick={() => onShift(1)}
              className={navButton}
            >
              <ChevronRight className="size-4" aria-hidden="true" />
            </button>

            {!isToday && (
              <button
                type="button"
                onClick={() => onSelect(dateKey(new Date()))}
                className="rounded-full bg-surface px-4 py-2 text-xs font-semibold text-primary shadow-[5px_5px_10px_#a3b1c6,-5px_-5px_10px_#ffffff] transition-shadow duration-200 ease-out hover:shadow-[9px_9px_16px_#a3b1c6,-9px_-9px_16px_#ffffff] active:shadow-[inset_3px_3px_6px_#a3b1c6,inset_-3px_-3px_6px_#ffffff] focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
              >
                Today
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between sm:gap-8">
          <DisciplineGauge score={score} />
          <RoutineToggle checked={routine} state={routineState} onChange={onRoutine} />
        </div>
      </div>
    </header>
  );
}
