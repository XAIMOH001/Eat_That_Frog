import { Check } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import type { FeatureTone } from "./features";

const TONE: Record<FeatureTone, string> = {
  default: "var(--color-muted-foreground)",
  primary: "var(--color-primary)",
  success: "var(--color-success)",
};

export function FeatureSection({
  id,
  icon: Icon,
  eyebrow,
  title,
  lead,
  points,
  tone = "default",
  children,
}: {
  id: string;
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  lead: string;
  points: readonly string[];
  tone?: FeatureTone;
  children?: React.ReactNode;
}) {
  const color = TONE[tone];

  return (
    <section
      aria-labelledby={`${id}-title`}
      className="rounded-3xl bg-surface p-6 shadow-[9px_9px_16px_#a3b1c6,-9px_-9px_16px_#ffffff] sm:p-8"
    >
      <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr] lg:gap-10">
        <div>
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-surface shadow-[inset_3px_3px_6px_#a3b1c6,inset_-3px_-3px_6px_#ffffff]">
            <Icon className="size-4" style={{ color }} aria-hidden="true" />
          </span>
          <p className="mt-4 text-xs font-semibold tracking-[0.14em] text-muted-foreground uppercase">
            {eyebrow}
          </p>
          <h2
            id={`${id}-title`}
            className="mt-2 text-2xl font-semibold tracking-tight text-foreground"
          >
            {title}
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{lead}</p>
        </div>

        <ul className="flex flex-col gap-2.5">
          {points.map((point) => (
            <li
              key={point}
              className="flex items-start gap-3 rounded-2xl bg-surface px-4 py-3 shadow-[inset_3px_3px_6px_#a3b1c6,inset_-3px_-3px_6px_#ffffff]"
            >
              <Check className="mt-0.5 size-4 shrink-0" style={{ color }} aria-hidden="true" />
              <span className="text-sm leading-relaxed text-foreground">{point}</span>
            </li>
          ))}
          {children}
        </ul>
      </div>
    </section>
  );
}
