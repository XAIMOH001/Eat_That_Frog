import { BarChart3, CalendarDays, Target } from "lucide-react";

import { CtaPair } from "./CtaPair";
import { DashboardPreview } from "./DashboardPreview";

const TRIAD = [
  { icon: Target, text: "One important task." },
  { icon: CalendarDays, text: "One focused day." },
  { icon: BarChart3, text: "One honest review." },
] as const;

export function Hero({ signedIn }: { signedIn: boolean }) {
  return (
    <section className="flex flex-col items-center gap-8 pt-4 text-center sm:gap-10 sm:pt-10">
      <div className="flex max-w-2xl flex-col items-center gap-5">
        <p className="text-[0.65rem] font-semibold tracking-[0.22em] text-primary uppercase">
          Personal Discipline System
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Do the work that matters.
        </h1>
        <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
          Eat That Frog is a personal discipline system built to help you identify your hardest
          task, protect your focus, control distractions, and build consistency one day at a time.
        </p>
      </div>

      <ul className="grid w-full max-w-3xl gap-3 sm:grid-cols-3">
        {TRIAD.map(({ icon: Icon, text }) => (
          <li
            key={text}
            className="flex items-center justify-center gap-2.5 rounded-2xl bg-surface px-4 py-3 shadow-[inset_3px_3px_6px_#a3b1c6,inset_-3px_-3px_6px_#ffffff]"
          >
            <Icon className="size-4 shrink-0 text-primary" aria-hidden="true" />
            <span className="text-sm font-medium text-foreground">{text}</span>
          </li>
        ))}
      </ul>

      <CtaPair signedIn={signedIn} />
      <DashboardPreview />
    </section>
  );
}
