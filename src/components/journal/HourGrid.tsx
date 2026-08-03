import { HOURS } from "@/lib/journal-types";
import type { CategoryId, DayEntry } from "@/lib/journal-types";
import { HourRow } from "./HourRow";

type Props = {
  day: DayEntry;
  currentHour: number | null;
  onNote: (hour: number, value: string) => void;
  onCategory: (hour: number, value: CategoryId | null) => void;
};

export function HourGrid({ day, currentHour, onNote, onCategory }: Props) {
  return (
    <section className="neu-raised rounded-3xl p-4 sm:p-6" aria-label="Hourly schedule matrix">
      <div className="mb-4 flex items-baseline justify-between gap-3">
        <h2 className="text-lg font-semibold tracking-tight text-foreground">Hourly Schedule</h2>
        <p className="text-xs text-muted-foreground">00:00 — 23:00</p>
      </div>
      <div className="max-h-[70vh] space-y-2.5 overflow-y-auto pr-1">
        {HOURS.map((hour) => (
          <HourRow
            key={hour}
            hour={hour}
            entry={day.hours[String(hour)]}
            isNow={currentHour === hour}
            onNote={(value) => onNote(hour, value)}
            onCategory={(value) => onCategory(hour, value)}
          />
        ))}
      </div>
    </section>
  );
}
