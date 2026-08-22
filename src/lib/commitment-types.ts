export type CommitmentCard = {
  status: "active" | "paused";
  canCheckIn: boolean;
  todayKept: boolean;
  nextOpensAt: string | null;
  streak: number;
  bestStreak: number;
  ratePct: number | null;
  rate30Pct: number | null;
  recoveries: number;
};

export const COMMITMENT_CARD_KEYS = [
  "bestStreak",
  "canCheckIn",
  "nextOpensAt",
  "rate30Pct",
  "ratePct",
  "recoveries",
  "status",
  "streak",
  "todayKept",
] as const;
