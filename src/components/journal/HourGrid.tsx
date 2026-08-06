import { HourRow } from "./HourRow";
import { HOURS, type CategoryId, type DayEntry } from "@/lib/journal-types";

type Props = {
  day: DayEntry;
  currentHour: number | null;
  onNote: (hour: number, value: string) => void;
  onCategory: (hour: number, value: CategoryId | null) => void;
};

export function HourGrid({ day, currentHour, onNote, onCategory }: Props) {
  return (
    <section
      className="rounded-3xl bg-[#e0e5ec] p-4 shadow-[9px_9px_16px_#a3b1c6,-9px_-9px_16px_#ffffff] sm:p-6"
      aria-label="Hourly schedule matrix"
    >
      <div className="mb-4 flex items-baseline justify-between gap-3">
        <h2 className="text-lg font-semibold tracking-tight text-foreground">Hourly Schedule</h2>
        <p className="text-xs text-muted-foreground">00:00 — 23:00</p>
      </div>
      <div className="max-h-[70vh] space-y-3 overflow-y-auto p-1">
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
