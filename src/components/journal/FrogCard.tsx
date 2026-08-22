import { Check, Target } from "lucide-react";
import type { PlannedTask } from "@/lib/journal-types";

type Props = {
  frog: PlannedTask | undefined;
  onText: (value: string) => void;
  onCompleted: (value: boolean) => void;
};

export function FrogCard({ frog, onText, onCompleted }: Props) {
  const title = frog?.title ?? "";
  const completed = frog?.completed ?? false;
  const named = title.trim().length > 0;
  const locked = !named && !completed;

  return (
    <section
      className="rounded-3xl bg-surface p-5 shadow-[9px_9px_16px_#a3b1c6,-9px_-9px_16px_#ffffff] sm:p-6"
      aria-label="Eat that frog"
    >
      <div className="flex items-center gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-surface shadow-[inset_3px_3px_6px_#a3b1c6,inset_-3px_-3px_6px_#ffffff]">
          <Target className="size-4 text-primary" aria-hidden="true" />
        </span>
        <div>
          <p className="text-[0.65rem] font-semibold tracking-[0.22em] text-primary uppercase">
            Eat That Frog
          </p>
          <p className="mt-0.5 text-sm text-muted-foreground">
            The hardest, most important thing you will do today.
          </p>
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          value={title}
          onChange={(e) => onText(e.target.value)}
          placeholder="What is your frog today?"
          aria-label="Today's frog"
          className={`min-w-0 flex-1 rounded-2xl bg-surface px-4 py-3 text-sm shadow-[inset_3px_3px_6px_#a3b1c6,inset_-3px_-3px_6px_#ffffff] outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-accent ${
            completed ? "text-muted-foreground line-through" : "text-foreground"
          }`}
        />

        <button
          type="button"
          aria-pressed={completed}
          aria-disabled={locked}
          aria-describedby={locked ? "frog-hint" : undefined}
          onClick={() => {
            if (!locked) onCompleted(!completed);
          }}
          className={`flex shrink-0 items-center justify-center gap-2 rounded-2xl bg-surface px-5 py-3 text-sm font-semibold transition-shadow duration-200 ease-out focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none ${
            completed
              ? "text-success shadow-[inset_3px_3px_6px_#a3b1c6,inset_-3px_-3px_6px_#ffffff]"
              : locked
                ? "text-muted-foreground shadow-[3px_3px_6px_#a3b1c6,-3px_-3px_6px_#ffffff]"
                : "text-foreground shadow-[5px_5px_10px_#a3b1c6,-5px_-5px_10px_#ffffff] hover:shadow-[9px_9px_16px_#a3b1c6,-9px_-9px_16px_#ffffff] active:shadow-[inset_3px_3px_6px_#a3b1c6,inset_-3px_-3px_6px_#ffffff]"
          }`}
        >
          {completed ? <Check className="size-4" strokeWidth={3} aria-hidden="true" /> : null}
          {completed ? "Frog Eaten" : "Ate The Frog!"}
        </button>
      </div>

      {locked ? (
        <p id="frog-hint" className="mt-3 text-xs text-muted-foreground">
          Name your frog first, then you can mark it eaten.
        </p>
      ) : null}
    </section>
  );
}
