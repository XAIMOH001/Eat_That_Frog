import "server-only";

import { and, desc, eq } from "drizzle-orm";

import { db, type Executor } from "@/db";
import { commitmentCheckIns, privateCommitments } from "@/db/schema";
import type { UserId } from "@/lib/dal/session";
import {
  bestCommitmentStreak,
  commitmentRate,
  commitmentStreak,
  recoveryCount,
} from "@/lib/commitment-metrics";
import { canCheckIn, commitmentState, type CommitmentSnapshot } from "@/lib/commitment-lock";
import type { CommitmentCard } from "@/lib/commitment-types";
import { dateKey, shiftKey } from "@/lib/journal-types";

const RATE_WINDOW_DAYS = 30;

export async function getCommitmentCard(
  userId: UserId,
  now: Date,
  tx: Executor = db,
): Promise<CommitmentCard | null> {
  const [live] = await tx
    .select({
      id: privateCommitments.id,
      status: privateCommitments.status,
      startedOn: privateCommitments.startedOn,
    })
    .from(privateCommitments)
    .where(and(eq(privateCommitments.userId, userId), eq(privateCommitments.status, "active")));

  if (!live) return null;

  const allDays = await tx
    .select({ keptOn: commitmentCheckIns.keptOn })
    .from(commitmentCheckIns)
    .where(eq(commitmentCheckIns.userId, userId));

  const liveDays = await tx
    .select({ keptOn: commitmentCheckIns.keptOn })
    .from(commitmentCheckIns)
    .where(
      and(eq(commitmentCheckIns.userId, userId), eq(commitmentCheckIns.commitmentId, live.id)),
    );

  const [last] = await tx
    .select({ keptOn: commitmentCheckIns.keptOn, checkedInAt: commitmentCheckIns.checkedInAt })
    .from(commitmentCheckIns)
    .where(and(eq(commitmentCheckIns.userId, userId), eq(commitmentCheckIns.commitmentId, live.id)))
    .orderBy(desc(commitmentCheckIns.keptOn))
    .limit(1);

  const todayKey = dateKey(now);
  const liveSet = new Set(liveDays.map((r) => r.keptOn));

  const snapshot: CommitmentSnapshot = {
    status: live.status === "paused" ? "paused" : "active",
    startedOn: live.startedOn,
    lastKeptOn: last?.keptOn ?? null,
    lastCheckedInAt: last?.checkedInAt?.toISOString() ?? null,
  };
  const state = commitmentState(snapshot, todayKey, now);

  const yesterday = shiftKey(todayKey, -1);
  const windowStart = shiftKey(todayKey, -(RATE_WINDOW_DAYS - 1));
  const recentFrom = windowStart > live.startedOn ? windowStart : live.startedOn;

  return {
    status: snapshot.status,
    canCheckIn: canCheckIn(state),
    todayKept: liveSet.has(todayKey),
    nextOpensAt:
      state.kind === "kept"
        ? state.nextOpensAt.toISOString()
        : state.kind === "waiting"
          ? state.opensAt.toISOString()
          : null,
    streak: commitmentStreak(liveSet, todayKey),
    bestStreak: bestCommitmentStreak(allDays.map((r) => r.keptOn)),
    ratePct: commitmentRate(liveSet, live.startedOn, yesterday),
    rate30Pct: commitmentRate(liveSet, recentFrom, yesterday),
    recoveries: recoveryCount(allDays.map((r) => r.keptOn)),
  };
}

export async function hasLiveCommitment(userId: UserId, tx: Executor = db): Promise<boolean> {
  const [row] = await tx
    .select({ id: privateCommitments.id })
    .from(privateCommitments)
    .where(and(eq(privateCommitments.userId, userId), eq(privateCommitments.status, "active")));
  return Boolean(row);
}
