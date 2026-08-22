import "server-only";

import { and, count, eq, gt } from "drizzle-orm";

import { db, type Executor } from "@/db";
import { reauthFailures, reauthGrants } from "@/db/schema";
import type { UserId } from "@/lib/dal/session";

export const REAUTH_WINDOW_MINUTES = 5;

export const MAX_FAILURES = 5;
export const FAILURE_WINDOW_MINUTES = 15;

const MINUTE_MS = 60_000;

// Grants are bound to one session; the sessions FK cascade is what revokes them on sign-out.
export async function hasFreshReauth(
  userId: UserId,
  sessionId: string,
  tx: Executor = db,
): Promise<boolean> {
  const [row] = await tx
    .select({ id: reauthGrants.id })
    .from(reauthGrants)
    .where(
      and(
        eq(reauthGrants.userId, userId),
        eq(reauthGrants.sessionId, sessionId),
        gt(reauthGrants.expiresAt, new Date()),
      ),
    );
  return Boolean(row);
}

export async function isReauthLocked(userId: UserId, tx: Executor = db): Promise<boolean> {
  const since = new Date(Date.now() - FAILURE_WINDOW_MINUTES * MINUTE_MS);

  const [row] = await tx
    .select({ n: count() })
    .from(reauthFailures)
    .where(and(eq(reauthFailures.userId, userId), gt(reauthFailures.occurredAt, since)));

  return (row?.n ?? 0) >= MAX_FAILURES;
}

export async function grantReauth(
  userId: UserId,
  sessionId: string,
  tx: Executor = db,
): Promise<void> {
  const expiresAt = new Date(Date.now() + REAUTH_WINDOW_MINUTES * MINUTE_MS);

  await tx
    .insert(reauthGrants)
    .values({ userId, sessionId, expiresAt })
    .onConflictDoUpdate({
      target: reauthGrants.sessionId,
      set: { expiresAt, grantedAt: new Date() },
      setWhere: eq(reauthGrants.userId, userId),
    });
}

export async function recordReauthFailure(userId: UserId, tx: Executor = db): Promise<void> {
  await tx.insert(reauthFailures).values({ userId });
}

export async function revokeReauth(
  userId: UserId,
  sessionId: string,
  tx: Executor = db,
): Promise<void> {
  await tx
    .delete(reauthGrants)
    .where(and(eq(reauthGrants.userId, userId), eq(reauthGrants.sessionId, sessionId)));
}
