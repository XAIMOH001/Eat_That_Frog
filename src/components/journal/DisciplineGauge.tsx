type Props = { score: number; frogEaten: boolean };

/**
 * The frog is a fact, not something to infer from the total. A day with no frog but a full
 * eight planned hours reaches 60, which the old score-only bands reported as "Frog eaten" —
 * the verdict was stating the opposite of what happened. Taking the flag makes the two
 * ladders independent: 40 of the 100 points are the frog, the other 60 are the hours.
 */
export function verdict(score: number, frogEaten: boolean) {
  if (!frogEaten) {
    if (score >= 40) return "Strong hours, frog uneaten";
    if (score >= 15) return "Hours logged, frog uneaten";
    return "Day not started";
  }
  if (score >= 90) return "Exceptional day";
  if (score >= 70) return "Frog eaten, hours on plan";
  if (score >= 55) return "Frog eaten, hours light";
  return "Frog eaten, little logged";
}

export function DisciplineGauge({ score, frogEaten }: Props) {
  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - score / 100);

  return (
    <div className="flex items-center gap-4">
      <div className="relative grid size-24 shrink-0 place-items-center rounded-full bg-surface shadow-[inset_6px_6px_12px_#a3b1c6,inset_-6px_-6px_12px_#ffffff]">
        <svg viewBox="0 0 88 88" className="absolute size-24 -rotate-90" aria-hidden>
          <circle cx="44" cy="44" r={radius} fill="none" stroke="#c8d0dd" strokeWidth="7" />
          <circle
            cx="44"
            cy="44"
            r={radius}
            fill="none"
            stroke="#6c5ce7"
            strokeWidth="7"
            strokeLinecap={score === 0 ? "butt" : "round"}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: "stroke-dashoffset 400ms ease" }}
          />
        </svg>
        <div
          className="relative text-center leading-none"
          role="meter"
          aria-valuenow={score}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuetext={`${score} out of 100 — ${verdict(score, frogEaten)}`}
          aria-label="Daily discipline score"
        >
          <span className="text-2xl font-semibold tracking-tight text-foreground">{score}</span>
          <span className="block text-[0.6rem] font-medium text-muted-foreground">/ 100</span>
        </div>
      </div>
      <div>
        <p className="text-xs font-semibold tracking-[0.14em] text-muted-foreground uppercase">
          Daily Discipline
        </p>
        <p className="mt-1 text-sm font-medium text-foreground">{verdict(score, frogEaten)}</p>
      </div>
    </div>
  );
}
