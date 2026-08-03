type Props = { score: number };

export function DisciplineGauge({ score }: Props) {
  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - score / 100);

  return (
    <div className="flex items-center gap-4">
      <div className="neu-inset relative grid size-24 shrink-0 place-items-center rounded-full">
        <svg viewBox="0 0 88 88" className="absolute size-24 -rotate-90">
          <circle
            cx="44"
            cy="44"
            r={radius}
            fill="none"
            stroke="rgba(163,177,198,0.35)"
            strokeWidth="7"
          />
          <circle
            cx="44"
            cy="44"
            r={radius}
            fill="none"
            stroke="var(--primary)"
            strokeWidth="7"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: "stroke-dashoffset 400ms ease" }}
          />
        </svg>
        <div className="relative text-center leading-none">
          <span className="text-2xl font-semibold tracking-tight text-foreground">{score}</span>
          <span className="block text-[0.6rem] font-medium text-muted-foreground">/ 100</span>
        </div>
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          Daily Discipline
        </p>
        <p className="mt-1 text-sm font-medium text-foreground">
          {score >= 80
            ? "Exceptional day"
            : score >= 60
              ? "Solid rhythm"
              : score >= 35
                ? "Room to tighten"
                : "Needs attention"}
        </p>
      </div>
    </div>
  );
}
