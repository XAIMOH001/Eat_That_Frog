import {
  CATEGORIES,
  categoryMeta,
  hourLabel,
  type CategoryId,
  type HourEntry,
  type PlannedTask,
} from "@/lib/journal-types";

type Props = {
  hour: number;
  entry: HourEntry | undefined;
  isNow: boolean;
  /** Today's planned tasks, for the swiss-cheese tag. Empty hides the control entirely. */
  tasks: PlannedTask[];
  onNote: (value: string) => void;
  onCategory: (value: CategoryId | null) => void;
  onTask: (taskId: string | null) => void;
};

export function HourRow({ hour, entry, isNow, tasks, onNote, onCategory, onTask }: Props) {
  const category = entry?.category ?? null;
  const meta = category ? categoryMeta(category) : null;
  const taskId = entry?.taskId ?? null;
  const tagged = taskId ? tasks.find((t) => t.id === taskId) : undefined;

  return (
    <div
      className={`rounded-2xl bg-surface p-3 transition-shadow duration-200 ease-out sm:p-4 ${
        category
          ? "shadow-[inset_3px_3px_6px_#a3b1c6,inset_-3px_-3px_6px_#ffffff]"
          : "shadow-[5px_5px_10px_#a3b1c6,-5px_-5px_10px_#ffffff]"
      } ${isNow ? "ring-2 ring-accent" : ""}`}
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <div className="flex items-center justify-between gap-3 md:w-28 md:shrink-0">
          <span className="text-sm font-semibold tabular-nums text-foreground">
            {hourLabel(hour)}
          </span>
          {meta ? (
            <span
              className="rounded-full bg-surface px-2.5 py-1 text-[0.65rem] font-semibold tracking-wider uppercase shadow-[inset_3px_3px_6px_#a3b1c6,inset_-3px_-3px_6px_#ffffff]"
              style={{ color: meta.colorVar }}
            >
              {meta.short}
            </span>
          ) : isNow ? (
            <span className="text-[0.65rem] font-semibold tracking-wider text-primary uppercase">
              Now
            </span>
          ) : null}
        </div>

        <input
          value={entry?.note ?? ""}
          onChange={(e) => onNote(e.target.value)}
          placeholder="What happened this hour?"
          aria-label={`Activity note for ${hourLabel(hour)}`}
          className="min-w-0 flex-1 rounded-2xl bg-surface px-4 py-2.5 text-sm text-foreground shadow-[inset_3px_3px_6px_#a3b1c6,inset_-3px_-3px_6px_#ffffff] outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-accent"
        />

        {/* Only offered once something is planned, so an unplanned day keeps the original row.
            A native select rather than a custom combobox: keyboard and screen-reader behaviour
            come free, and it collapses to the priority code when space is tight. */}
        {tasks.length > 0 ? (
          <select
            value={taskId ?? ""}
            onChange={(e) => onTask(e.target.value || null)}
            aria-label={`Planned task for ${hourLabel(hour)}`}
            title={tagged ? `${tagged.priority} · ${tagged.title}` : "Not linked to a planned task"}
            className={`w-full shrink-0 rounded-2xl bg-surface px-3 py-2 text-xs font-medium shadow-[inset_3px_3px_6px_#a3b1c6,inset_-3px_-3px_6px_#ffffff] outline-none focus-visible:ring-2 focus-visible:ring-accent md:w-28 ${
              tagged ? "text-foreground" : "text-muted-foreground"
            }`}
          >
            <option value="">— task</option>
            {tasks.map((t) => (
              <option key={t.id} value={t.id}>
                {t.priority} · {t.title}
              </option>
            ))}
          </select>
        ) : null}

        <div
          role="group"
          aria-label={`Category for ${hourLabel(hour)}`}
          className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-0.5 md:mx-0 md:shrink-0 md:overflow-visible md:px-0"
        >
          {CATEGORIES.map((c) => {
            const active = category === c.id;
            return (
              <button
                key={c.id}
                type="button"
                aria-pressed={active}
                onClick={() => onCategory(active ? null : c.id)}
                className={`shrink-0 rounded-full bg-surface px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-shadow duration-200 ease-out focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none ${
                  active
                    ? "shadow-[inset_3px_3px_6px_#a3b1c6,inset_-3px_-3px_6px_#ffffff]"
                    : "shadow-[5px_5px_10px_#a3b1c6,-5px_-5px_10px_#ffffff] active:shadow-[inset_3px_3px_6px_#a3b1c6,inset_-3px_-3px_6px_#ffffff]"
                }`}
                style={{ color: active ? c.colorVar : "var(--color-muted-foreground)" }}
              >
                {c.short}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
