import { HourRow } from "./HourRow";
import { HOURS, type CategoryId, type DayEntry, type PlannedTask } from "@/lib/journal-types";

type Props = {
  day: DayEntry;
  currentHour: number | null;
  tasks: PlannedTask[];
  onNote: (hour: number, value: string) => void;
  onCategory: (hour: number, value: CategoryId | null) => void;
  onTask: (hour: number, taskId: string | null) => void;
};

export function HourGrid({ day, currentHour, tasks, onNote, onCategory, onTask }: Props) {
  return (
    <section
      className="min-w-0 rounded-3xl bg-surface p-4 shadow-[9px_9px_16px_#a3b1c6,-9px_-9px_16px_#ffffff] sm:p-6"
      aria-label="Hourly schedule matrix"
    >
      <div className="mb-4 flex items-baseline justify-between gap-3">
        <h2 className="text-lg font-semibold tracking-tight text-foreground">Hourly Schedule</h2>
        <p className="text-xs text-muted-foreground">00:00 — 23:00</p>
      </div>
      <ul
        tabIndex={0}
        aria-label="Hours of the day"
        className="max-h-[70vh] list-none space-y-3 overflow-y-auto p-1 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
      >
        {HOURS.map((hour) => (
          <li key={hour}>
            <HourRow
              hour={hour}
              entry={day.hours[String(hour)]}
              isNow={currentHour === hour}
              tasks={tasks}
              onNote={(value) => onNote(hour, value)}
              onCategory={(value) => onCategory(hour, value)}
              onTask={(taskId) => onTask(hour, taskId)}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
