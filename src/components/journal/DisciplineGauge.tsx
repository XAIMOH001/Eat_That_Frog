type Props = { score: number };

export function verdict(score: number) {
  if (score >= 90) return "Exceptional day";
  if (score >= 80) return "Routine held, frog eaten";
  if (score >= 40) return "One commitment held";
  if (score >= 10) return "Both commitments missed";
  return "Day not started";
}

export function DisciplineGauge({ score }: Props) {
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
          aria-valuetext={`${score} out of 100 — ${verdict(score)}`}
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
        <p className="mt-1 text-sm font-medium text-foreground">{verdict(score)}</p>
      </div>
    </div>
  );
}
