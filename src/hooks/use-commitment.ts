import { useCallback, useRef, useState } from "react";

import { checkInCommitment, type ActionResult } from "@/app/actions";
import type { CommitmentCard } from "@/lib/commitment-types";

type Persist = (
  action: () => Promise<ActionResult<unknown>>,
  rollback: () => void,
  what: string,
) => Promise<void>;

export function useCommitment(initial: CommitmentCard | null, persist: Persist) {
  const [card, setCard] = useState(initial);

  const [prevInitial, setPrevInitial] = useState(initial);
  if (initial !== prevInitial) {
    setPrevInitial(initial);
    setCard(initial);
  }

  const inFlight = useRef(false);

  const checkIn = useCallback(() => {
    if (inFlight.current) return;
    const before = card;
    if (!before || !before.canCheckIn) return;

    inFlight.current = true;

    setCard({
      ...before,
      canCheckIn: false,
      todayKept: true,
      streak: before.streak + 1,
      bestStreak: Math.max(before.bestStreak, before.streak + 1),
    });

    void persist(
      () =>
        checkInCommitment().then((result) => {
          if (result.ok) setCard(result.data);
          return result;
        }),
      () => setCard(before),
      "your commitment",
    ).finally(() => {
      inFlight.current = false;
    });
  }, [card, persist]);

  return { card, checkIn };
}
