import { CATEGORIES, categoryMeta, hourLabel, type CategoryId, type HourEntry } from "@/lib/journal-types";

type Props = {
  hour: number;
  entry: HourEntry | undefined;
  isNow: boolean;
  onNote: (value: string) => void;
  onCategory: (value: CategoryId | null) => void;
};

export function HourRow({ hour, entry, isNow, onNote, onCategory }: Props) {
  const category = entry?.category ?? null;
  const meta = category ? categoryMeta(category) : null;

  return (
    <div
      className={`rounded-2xl p-3 sm:p-4 ${category ? "neu-inset" : "neu-raised-sm"} ${
        isNow ? "ring-1 ring-primary/40" : ""
      }`}
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <div className="flex items-center justify-between gap-3 md:w-28 md:shrink-0">
          <span className="font-mono text-sm font-semibold tabular-nums text-foreground">
            {hourLabel(hour)}
          </span>
          {meta ? (
            <span
              className="neu-inset-sm rounded-full px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-wider"
              style={{ color: meta.colorVar }}
            >
              {meta.short}
            </span>
          ) : isNow ? (
            <span className="text-[0.65rem] font-semibold uppercase tracking-wider text-primary">
              Now
            </span>
          ) : null}
        </div>

        <input
          value={entry?.note ?? ""}
          onChange={(e) => onNote(e.target.value)}
          placeholder="What happened this hour?"
          aria-label={`Activity note for ${hourLabel(hour)}`}
          className="neu-inset neu-focus min-w-0 flex-1 rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/70"
        />

        <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-0.5 md:mx-0 md:shrink-0 md:overflow-visible md:px-0">
          {CATEGORIES.map((c) => {
            const active = category === c.id;
            return (
              <button
                key={c.id}
                type="button"
                aria-pressed={active}
                onClick={() => onCategory(active ? null : c.id)}
                className={`neu-focus shrink-0 rounded-full px-3 py-1.5 text-xs font-medium whitespace-nowrap ${
                  active ? "neu-inset-sm" : "neu-raised-sm neu-press"
                }`}
                style={active ? { color: c.colorVar } : { color: "var(--muted-foreground)" }}
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
