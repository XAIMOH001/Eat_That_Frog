import { shiftKey } from "./journal-types";

export const MIN_GAP_HOURS = 18;

export type CommitmentSnapshot = {
  status: "active" | "paused";
  startedOn: string;
  lastKeptOn: string | null;
  lastCheckedInAt: string | null;
};

export type CommitmentState =
  | { kind: "none" }
  | { kind: "open" }
  | { kind: "kept"; nextOpensAt: Date }
  | { kind: "waiting"; opensAt: Date }
  | { kind: "paused" };

function startOfDay(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1, 0, 0, 0, 0);
}

function later(a: Date, b: Date): Date {
  return a > b ? a : b;
}

export function commitmentState(
  snapshot: CommitmentSnapshot | null,
  todayKey: string,
  now: Date,
): CommitmentState {
  if (!snapshot) return { kind: "none" };
  if (snapshot.status === "paused") return { kind: "paused" };

  if (todayKey < snapshot.startedOn) {
    return { kind: "waiting", opensAt: startOfDay(snapshot.startedOn) };
  }

  const gapMs = MIN_GAP_HOURS * 3_600_000;
  const lastAt = snapshot.lastCheckedInAt ? new Date(snapshot.lastCheckedInAt) : null;
  const validLastAt = lastAt && !Number.isNaN(lastAt.getTime()) ? lastAt : null;

  if (snapshot.lastKeptOn === todayKey) {
    const tomorrow = startOfDay(shiftKey(todayKey, 1));
    const afterGap = validLastAt ? new Date(validLastAt.getTime() + gapMs) : tomorrow;
    return { kind: "kept", nextOpensAt: later(tomorrow, afterGap) };
  }

  const openedToday = startOfDay(todayKey);
  const afterGap = validLastAt ? new Date(validLastAt.getTime() + gapMs) : openedToday;
  const opensAt = later(openedToday, afterGap);

  return now >= opensAt ? { kind: "open" } : { kind: "waiting", opensAt };
}

export function canCheckIn(state: CommitmentState): boolean {
  return state.kind === "open";
}

export function commitmentStateLabel(state: CommitmentState): string {
  switch (state.kind) {
    case "none":
      return "No commitment yet";
    case "open":
      return "Ready to check in";
    case "kept":
      return "Kept today";
    case "waiting":
      return "Not open yet";
    case "paused":
      return "Paused";
  }
}
