import { CATEGORIES, type CategoryId } from "@/lib/journal-types";

type Props = { counts: Record<CategoryId, number> };

export function CategoryDonut({ counts }: Props) {
  const total = CATEGORIES.reduce((sum, c) => sum + counts[c.id], 0);
  const radius = 62;
  const circumference = 2 * Math.PI * radius;
  let cursor = 0;

  return (
    <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-around">
      <div className="relative grid size-52 shrink-0 place-items-center rounded-full bg-surface shadow-[inset_6px_6px_12px_#a3b1c6,inset_-6px_-6px_12px_#ffffff]">
        <svg viewBox="0 0 160 160" className="absolute size-52 -rotate-90" aria-hidden>
          <circle cx="80" cy="80" r={radius} fill="none" stroke="#cdd5e0" strokeWidth="18" />
          {total > 0 &&
            CATEGORIES.map((c) => {
              const value = counts[c.id];
              if (!value) return null;
              const length = (value / total) * circumference;
              const dash = `${Math.max(length - 3, 1)} ${circumference}`;
              const offset = -cursor;
              cursor += length;
              return (
                <circle
                  key={c.id}
                  cx="80"
                  cy="80"
                  r={radius}
                  fill="none"
                  stroke={c.colorVar}
                  strokeWidth="18"
                  strokeLinecap="round"
                  strokeDasharray={dash}
                  strokeDashoffset={offset}
                  style={{ transition: "stroke-dasharray 300ms ease" }}
                />
              );
            })}
        </svg>
        <div className="relative text-center">
          <span className="block text-3xl font-semibold tracking-tight text-foreground">
            {total}
          </span>
          <span className="text-[0.65rem] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
            hours logged
          </span>
        </div>
      </div>

      <ul className="w-full max-w-xs space-y-2.5">
        {CATEGORIES.map((c) => {
          const value = counts[c.id];
          const pct = total ? Math.round((value / total) * 100) : 0;
          return (
            <li
              key={c.id}
              className="flex items-center gap-3 rounded-2xl bg-surface px-3.5 py-2.5 shadow-[5px_5px_10px_#a3b1c6,-5px_-5px_10px_#ffffff]"
            >
              <span
                className="size-2.5 shrink-0 rounded-full"
                style={{ background: c.colorVar }}
                aria-hidden
              />
              <span className="flex-1 text-sm font-medium text-foreground">{c.label}</span>
              <span className="text-sm tabular-nums text-muted-foreground">
                {value}h · {pct}%
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
