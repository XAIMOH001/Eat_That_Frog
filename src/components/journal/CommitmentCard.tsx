import Link from "next/link";
import { Check, Flame, Lock } from "lucide-react";

import type { CommitmentCard as Card } from "@/lib/commitment-types";
import { ROUTES } from "@/lib/routes";
import { dateKey } from "@/lib/journal-types";

type Props = {
  card: Card | null;
  now: Date;
  onCheckIn: () => void;
};

const WELL =
  "rounded-2xl bg-surface px-4 py-3 shadow-[inset_3px_3px_6px_#a3b1c6,inset_-3px_-3px_6px_#ffffff]";

const EYEBROW = "text-[0.65rem] font-semibold tracking-[0.16em] text-muted-foreground uppercase";

const BUTTON =
  "mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-surface px-5 py-3 text-sm font-semibold transition-shadow duration-200 ease-out focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none";

const BUTTON_READY =
  "text-primary shadow-[5px_5px_10px_#a3b1c6,-5px_-5px_10px_#ffffff] hover:shadow-[9px_9px_16px_#a3b1c6,-9px_-9px_16px_#ffffff] active:shadow-[inset_3px_3px_6px_#a3b1c6,inset_-3px_-3px_6px_#ffffff]";

const BUTTON_LOCKED =
  "text-muted-foreground shadow-[inset_3px_3px_6px_#a3b1c6,inset_-3px_-3px_6px_#ffffff]";

function whenLabel(iso: string | null, now: Date): string {
  if (!iso) return "—";
  const at = new Date(iso);
  if (Number.isNaN(at.getTime())) return "—";

  const time = at.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  return dateKey(at) === dateKey(now) ? `Today, ${time}` : `Tomorrow, ${time}`;
}

export function CommitmentCard({ card, now, onCheckIn }: Props) {
  if (!card) {
    return (
      <section
        className="h-fit rounded-3xl bg-surface p-6 shadow-[9px_9px_16px_#a3b1c6,-9px_-9px_16px_#ffffff]"
        aria-label="Private commitment"
      >
        <h2 className="text-lg font-semibold tracking-tight text-foreground">Private Commitment</h2>
        <p className="mt-3 text-sm text-muted-foreground">
          Pick one behaviour you want more control over. It stays private — the dashboard only ever
          shows the streak.
        </p>
        <Link href={ROUTES.onboardingCommitment} className={`${BUTTON} ${BUTTON_READY}`}>
          Choose your commitment
        </Link>
      </section>
    );
  }

  const ready = card.canCheckIn && !card.todayKept;

  return (
    <section
      className="h-fit rounded-3xl bg-surface p-6 shadow-[9px_9px_16px_#a3b1c6,-9px_-9px_16px_#ffffff]"
      aria-label="Private commitment"
    >
      <h2 className="text-lg font-semibold tracking-tight text-foreground">Private Commitment</h2>

      <div className="mt-5 rounded-2xl bg-surface px-4 py-4 text-center shadow-[inset_3px_3px_6px_#a3b1c6,inset_-3px_-3px_6px_#ffffff]">
        <p className={EYEBROW}>Current Streak</p>
        <p className="mt-1 flex items-center justify-center gap-2 text-3xl font-semibold tracking-tight text-success">
          <Flame className="size-5 shrink-0" aria-hidden="true" />
          <span className="tabular-nums">{card.streak}</span>
          <span className="text-sm font-medium text-muted-foreground">
            {card.streak === 1 ? "day" : "days"}
          </span>
        </p>
      </div>

      <ul className="mt-3 space-y-2.5">
        <li className={`flex items-center justify-between ${WELL}`}>
          <span className="text-sm font-medium text-foreground">Today</span>
          <span
            className="text-sm font-semibold"
            style={{ color: card.todayKept ? "var(--cat-rest)" : "var(--color-muted-foreground)" }}
          >
            {card.todayKept ? "Kept" : "Not yet"}
          </span>
        </li>
        <li className={`flex items-center justify-between ${WELL}`}>
          <span className="text-sm font-medium text-foreground">Best</span>
          <span className="text-sm font-semibold tabular-nums text-foreground">
            {card.bestStreak} {card.bestStreak === 1 ? "day" : "days"}
          </span>
        </li>
        {card.todayKept ? (
          <li className={`flex items-center justify-between ${WELL}`}>
            <span className="text-sm font-medium text-foreground">Next check-in</span>
            <span className="text-sm font-semibold text-muted-foreground">
              {whenLabel(card.nextOpensAt, now)}
            </span>
          </li>
        ) : null}
      </ul>

      <button
        type="button"
        onClick={ready ? onCheckIn : undefined}
        {...(ready ? {} : { "aria-disabled": true })}
        className={`${BUTTON} ${ready ? BUTTON_READY : BUTTON_LOCKED}`}
      >
        {card.todayKept ? (
          <>
            <Check className="size-4 shrink-0" aria-hidden="true" />
            Kept today
          </>
        ) : ready ? (
          "I kept my commitment"
        ) : (
          <>
            <Lock className="size-4 shrink-0" aria-hidden="true" />
            Opens {whenLabel(card.nextOpensAt, now)}
          </>
        )}
      </button>

      <p aria-live="polite" className="sr-only">
        {card.todayKept
          ? `Commitment kept. Streak ${card.streak} days.`
          : "Commitment not yet logged today."}
      </p>
    </section>
  );
}
