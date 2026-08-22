import { afterAll, beforeAll, beforeEach, describe, expect, mock, test } from "bun:test";

import { dateKey } from "@/lib/journal-types";
import { COMMITMENT_CARD_KEYS } from "@/lib/commitment-types";

const TEST_URL = process.env["TENANCY_TEST_DATABASE_URL"];

if (TEST_URL) process.env["DATABASE_URL"] = TEST_URL;

process.env["COMMITMENT_SECRET_KEY"] ??= Buffer.alloc(32, 7).toString("base64");

mock.module("server-only", () => ({}));

let actingUserId: string | null = null;

let actingSessionId: string | null = null;

mock.module("@/lib/dal/session", () => ({
  currentUserId: async () => actingUserId,
  currentSession: async () =>
    actingUserId && actingSessionId ? { userId: actingUserId, sessionId: actingSessionId } : null,
  verifySession: async () => ({ id: actingUserId, name: "Test", email: "t@example.test" }),
  getOptionalUser: async () => (actingUserId ? { id: actingUserId } : null),
}));

describe.skipIf(!TEST_URL)("server action tenant isolation", () => {
  let db: typeof import("@/db").db;
  let schema: typeof import("@/db/schema");
  let actions: typeof import("@/app/actions");
  let eq: typeof import("drizzle-orm").eq;

  let alice = "";
  let bob = "";
  let aliceSession = "";
  let aliceSecondSession = "";
  let bobSession = "";
  const DAY = dateKey(new Date());

  beforeAll(async () => {
    ({ db } = await import("@/db"));
    schema = await import("@/db/schema");
    actions = await import("@/app/actions");
    ({ eq } = await import("drizzle-orm"));

    const mk = async (email: string) => {
      const [row] = await db
        .insert(schema.users)
        .values({ name: email, email })
        .returning({ id: schema.users.id });
      if (!row) throw new Error("could not seed user");
      return row.id;
    };

    const stamp = `${Date.now()}${Math.floor(Math.random() * 1e6)}`;
    alice = await mk(`alice-${stamp}@example.test`);
    bob = await mk(`bob-${stamp}@example.test`);

    const mkSession = async (userId: string, label: string) => {
      const [row] = await db
        .insert(schema.sessions)
        .values({
          userId,
          token: `tok-${label}-${stamp}`,
          expiresAt: new Date(Date.now() + 7 * 24 * 3_600_000),
          updatedAt: new Date(),
        })
        .returning({ id: schema.sessions.id });
      if (!row) throw new Error("could not seed session");
      return row.id;
    };
    aliceSession = await mkSession(alice, "alice");
    aliceSecondSession = await mkSession(alice, "alice2");
    bobSession = await mkSession(bob, "bob");
  });

  afterAll(async () => {
    if (alice) await db.delete(schema.users).where(eq(schema.users.id, alice));
    if (bob) await db.delete(schema.users).where(eq(schema.users.id, bob));
  });

  beforeEach(async () => {
    actingUserId = null;
    actingSessionId = null;
    if (alice) {
      await db.delete(schema.reauthGrants).where(eq(schema.reauthGrants.userId, alice));
      await db.delete(schema.reauthFailures).where(eq(schema.reauthFailures.userId, alice));
    }
    if (bob) {
      await db.delete(schema.reauthGrants).where(eq(schema.reauthGrants.userId, bob));
      await db.delete(schema.reauthFailures).where(eq(schema.reauthFailures.userId, bob));
    }
    if (alice) {
      await db.delete(schema.privateCommitments).where(eq(schema.privateCommitments.userId, alice));
    }
    if (bob) {
      await db.delete(schema.privateCommitments).where(eq(schema.privateCommitments.userId, bob));
    }
  });

  async function aliceTask(title = "Alice's frog") {
    actingUserId = alice;
    const created = await actions.addPlannedTask(DAY, "A1", title);
    expect(created.ok).toBe(true);
    if (!created.ok) throw new Error("setup failed");
    return created.data.id;
  }

  test("an unauthenticated caller is refused, not treated as a default user", async () => {
    actingUserId = null;
    const result = await actions.addPlannedTask(DAY, "A1", "should not exist");
    expect(result).toEqual({ ok: false, error: "unauthenticated" });
  });

  test("the same date is a separate row per user, not a unique-constraint collision", async () => {
    actingUserId = alice;
    expect((await actions.addPlannedTask(DAY, "A1", "Alice day")).ok).toBe(true);
    actingUserId = bob;
    expect((await actions.addPlannedTask(DAY, "A1", "Bob day")).ok).toBe(true);

    const rows = await db
      .select({ id: schema.dailyRecords.id, userId: schema.dailyRecords.userId })
      .from(schema.dailyRecords)
      .where(eq(schema.dailyRecords.date, DAY));

    const owners = new Set(rows.map((r) => r.userId));
    expect(owners.has(alice)).toBe(true);
    expect(owners.has(bob)).toBe(true);
  });

  test("Bob cannot rename Alice's task even with its real uuid", async () => {
    const taskId = await aliceTask("original title");

    actingUserId = bob;
    const result = await actions.updatePlannedTask(taskId, { title: "pwned" });

    expect(result).toEqual({ ok: false, error: "not_allowed" });

    const [row] = await db
      .select({ title: schema.plannedTasks.title })
      .from(schema.plannedTasks)
      .where(eq(schema.plannedTasks.id, taskId));
    expect(row?.title).toBe("original title");
  });

  test("Bob cannot delete Alice's task, and her hour tags survive the attempt", async () => {
    const taskId = await aliceTask("tagged task");

    actingUserId = alice;
    expect(
      (await actions.upsertHourlyLog(DAY, 9, { note: "n", category: "focus", taskId })).ok,
    ).toBe(true);

    actingUserId = bob;
    expect(await actions.deletePlannedTask(taskId)).toEqual({ ok: false, error: "not_allowed" });

    const [task] = await db
      .select({ id: schema.plannedTasks.id })
      .from(schema.plannedTasks)
      .where(eq(schema.plannedTasks.id, taskId));
    expect(task).toBeDefined();

    const tagged = await db
      .select({ taskId: schema.hourlyLogs.taskId })
      .from(schema.hourlyLogs)
      .where(eq(schema.hourlyLogs.taskId, taskId));
    expect(tagged.length).toBe(1);
  });

  test("Bob cannot tag his own hour with Alice's task uuid", async () => {
    const taskId = await aliceTask("not yours");

    actingUserId = bob;
    const result = await actions.upsertHourlyLog(DAY, 10, {
      note: "mine",
      category: "focus",
      taskId,
    });
    expect(result).toEqual({ ok: false, error: "not_allowed" });

    const rows = await db
      .select({ id: schema.hourlyLogs.id })
      .from(schema.hourlyLogs)
      .where(eq(schema.hourlyLogs.userId, bob));
    expect(rows.length).toBe(0);
  });

  test("a non-uuid task id still passes through, because it is an in-flight optimistic id", async () => {
    actingUserId = bob;
    const result = await actions.upsertHourlyLog(DAY, 11, {
      note: "optimistic",
      category: "focus",
      taskId: "t1",
    });
    expect(result.ok).toBe(true);
  });

  test("Bob's routine toggle does not touch Alice's day", async () => {
    actingUserId = alice;
    expect(
      (
        await actions.updateDailyRecordStatus(DAY, {
          coreRoutineMaintained: true,
          routineLockedAt: null,
        })
      ).ok,
    ).toBe(true);

    actingUserId = bob;
    await actions.updateDailyRecordStatus(DAY, {
      coreRoutineMaintained: false,
      routineLockedAt: null,
    });

    const [aliceDay] = await db
      .select({ held: schema.dailyRecords.coreRoutineMaintained })
      .from(schema.dailyRecords)
      .where(eq(schema.dailyRecords.userId, alice));
    expect(aliceDay?.held).toBe(true);
  });

  test("an unauthenticated caller cannot start a commitment", async () => {
    actingUserId = null;
    expect(await actions.startCommitment("gaming", null)).toEqual({
      ok: false,
      error: "unauthenticated",
    });
  });

  test("an unknown category is refused, and the value never reaches the message", async () => {
    actingUserId = alice;
    const result = await actions.startCommitment("not-a-real-category", null);
    expect(result).toEqual({ ok: false, error: "invalid_input" });
  });

  test("a label is only accepted for the custom category", async () => {
    actingUserId = alice;
    expect(await actions.startCommitment("gaming", "sneaky label")).toEqual({
      ok: false,
      error: "invalid_input",
    });
  });

  test("the stored secret is ciphertext, never the chosen category or custom label", async () => {
    actingUserId = alice;
    expect((await actions.startCommitment("other", "a private thing")).ok).toBe(true);

    const [row] = await db
      .select({ secret: schema.privateCommitments.secret })
      .from(schema.privateCommitments)
      .where(eq(schema.privateCommitments.userId, alice));

    expect(row?.secret).toStartWith("etf1.k1.");
    expect(row?.secret).not.toContain("other");
    expect(row?.secret).not.toContain("a private thing");
  });

  test("a category the picker no longer offers is refused", async () => {
    actingUserId = alice;
    expect(await actions.startCommitment("pornography", null)).toEqual({
      ok: false,
      error: "invalid_input",
    });
  });

  test("a second commitment is refused by the partial unique index, not by an if", async () => {
    actingUserId = alice;
    expect((await actions.startCommitment("gaming", null)).ok).toBe(true);
    expect(await actions.startCommitment("smoking", null)).toEqual({
      ok: false,
      error: "not_allowed",
    });

    const live = await db
      .select({ id: schema.privateCommitments.id })
      .from(schema.privateCommitments)
      .where(eq(schema.privateCommitments.userId, alice));
    expect(live.length).toBe(1);
  });

  test("checking in with no commitment is refused rather than creating one", async () => {
    actingUserId = bob;
    expect(await actions.checkInCommitment()).toEqual({ ok: false, error: "not_allowed" });
  });

  test("a check-in writes today, derived from the server rather than the caller", async () => {
    actingUserId = alice;
    expect((await actions.startCommitment("junk_food", null)).ok).toBe(true);

    const result = await actions.checkInCommitment();
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("unreachable");
    expect(result.data.streak).toBe(1);
    expect(result.data.todayKept).toBe(true);
    expect(result.data.canCheckIn).toBe(false);

    const [row] = await db
      .select({ keptOn: schema.commitmentCheckIns.keptOn })
      .from(schema.commitmentCheckIns)
      .where(eq(schema.commitmentCheckIns.userId, alice));
    expect(row?.keptOn).toBe(DAY);
  });

  test("the card carries exactly the whitelisted keys and no ciphertext", async () => {
    actingUserId = alice;
    expect((await actions.startCommitment("doomscrolling", null)).ok).toBe(true);
    const result = await actions.checkInCommitment();
    if (!result.ok) throw new Error("setup failed");

    expect(Object.keys(result.data).sort()).toEqual([...COMMITMENT_CARD_KEYS]);
    expect(JSON.stringify(result.data)).not.toContain("etf1.");
    expect(JSON.stringify(result.data)).not.toContain("doomscrolling");
  });

  test("a duplicate check-in is not_allowed, never db_error", async () => {
    actingUserId = alice;
    expect((await actions.startCommitment("smoking", null)).ok).toBe(true);
    expect((await actions.checkInCommitment()).ok).toBe(true);

    expect(await actions.checkInCommitment()).toEqual({ ok: false, error: "not_allowed" });
  });

  test("two concurrent check-ins produce exactly one row", async () => {
    actingUserId = alice;
    expect((await actions.startCommitment("gaming", null)).ok).toBe(true);

    const [a, b] = await Promise.all([actions.checkInCommitment(), actions.checkInCommitment()]);
    expect([a.ok, b.ok].filter(Boolean).length).toBe(1);
    const failed = [a, b].find((r) => !r.ok);
    expect(failed).toEqual({ ok: false, error: "not_allowed" });

    const rows = await db
      .select({ id: schema.commitmentCheckIns.id })
      .from(schema.commitmentCheckIns)
      .where(eq(schema.commitmentCheckIns.userId, alice));
    expect(rows.length).toBe(1);
  });

  test("Bob's check-in cannot touch Alice's commitment", async () => {
    actingUserId = alice;
    expect((await actions.startCommitment("gaming", null)).ok).toBe(true);

    actingUserId = bob;
    expect(await actions.checkInCommitment()).toEqual({ ok: false, error: "not_allowed" });

    const aliceRows = await db
      .select({ id: schema.commitmentCheckIns.id })
      .from(schema.commitmentCheckIns)
      .where(eq(schema.commitmentCheckIns.userId, alice));
    expect(aliceRows.length).toBe(0);
  });

  test("the composite foreign key rejects a hand-written cross-tenant check-in", async () => {
    actingUserId = alice;
    expect((await actions.startCommitment("gaming", null)).ok).toBe(true);
    const [aliceCommitment] = await db
      .select({ id: schema.privateCommitments.id })
      .from(schema.privateCommitments)
      .where(eq(schema.privateCommitments.userId, alice));
    if (!aliceCommitment) throw new Error("setup failed");

    let rejected = false;
    try {
      await db.insert(schema.commitmentCheckIns).values({
        userId: bob,
        commitmentId: aliceCommitment.id,
        keptOn: DAY,
      });
    } catch {
      rejected = true;
    }
    expect(rejected).toBe(true);
  });

  test("clearing Bob's log leaves Alice's hours alone", async () => {
    actingUserId = alice;
    expect((await actions.upsertHourlyLog(DAY, 14, { note: "alice hour" })).ok).toBe(true);
    actingUserId = bob;
    expect((await actions.upsertHourlyLog(DAY, 14, { note: "bob hour" })).ok).toBe(true);

    actingSessionId = bobSession;
    await grant(bob, bobSession);
    expect((await actions.clearDayLogs(DAY)).ok).toBe(true);

    const aliceHours = await db
      .select({ note: schema.hourlyLogs.note })
      .from(schema.hourlyLogs)
      .where(eq(schema.hourlyLogs.userId, alice));
    const bobHours = await db
      .select({ note: schema.hourlyLogs.note })
      .from(schema.hourlyLogs)
      .where(eq(schema.hourlyLogs.userId, bob));

    expect(aliceHours.length).toBeGreaterThan(0);
    expect(bobHours.length).toBe(0);
  });

  async function grant(userId: string, sessionId: string, minutesFromNow = 5) {
    await db.insert(schema.reauthGrants).values({
      userId,
      sessionId,
      expiresAt: new Date(Date.now() + minutesFromNow * 60_000),
    });
  }

  async function loggedHour() {
    actingUserId = alice;
    actingSessionId = aliceSession;
    expect((await actions.upsertHourlyLog(DAY, 8, { note: "keep me" })).ok).toBe(true);
  }

  async function aliceHourCount() {
    const rows = await db
      .select({ id: schema.hourlyLogs.id })
      .from(schema.hourlyLogs)
      .where(eq(schema.hourlyLogs.userId, alice));
    return rows.length;
  }

  test("the gate is not decorative: clearing without a grant is refused", async () => {
    await loggedHour();
    const before = await aliceHourCount();

    expect(await actions.clearDayLogs(DAY)).toEqual({ ok: false, error: "needs_reauth" });
    expect(await aliceHourCount()).toBe(before);
  });

  test("clearing succeeds with a fresh grant", async () => {
    await loggedHour();
    await grant(alice, aliceSession);

    expect((await actions.clearDayLogs(DAY)).ok).toBe(true);
    expect(await aliceHourCount()).toBe(0);
  });

  test("an expired grant does not unlock — the window really closes", async () => {
    await loggedHour();
    const before = await aliceHourCount();
    await grant(alice, aliceSession, -1);

    expect(await actions.clearDayLogs(DAY)).toEqual({ ok: false, error: "needs_reauth" });
    expect(await aliceHourCount()).toBe(before);
  });

  test("a grant on one device does not unlock another", async () => {
    await loggedHour();
    const before = await aliceHourCount();
    await grant(alice, aliceSession);

    actingSessionId = aliceSecondSession;
    expect(await actions.clearDayLogs(DAY)).toEqual({ ok: false, error: "needs_reauth" });
    expect(await aliceHourCount()).toBe(before);
  });

  test("signing out revokes the grant, via the foreign key rather than any code", async () => {
    await loggedHour();
    await grant(alice, aliceSession);

    await db.delete(schema.sessions).where(eq(schema.sessions.id, aliceSession));

    const left = await db
      .select({ id: schema.reauthGrants.id })
      .from(schema.reauthGrants)
      .where(eq(schema.reauthGrants.userId, alice));
    expect(left.length).toBe(0);

    const [fresh] = await db
      .insert(schema.sessions)
      .values({
        userId: alice,
        token: `tok-alice-revoked-${Date.now()}`,
        expiresAt: new Date(Date.now() + 7 * 24 * 3_600_000),
        updatedAt: new Date(),
      })
      .returning({ id: schema.sessions.id });
    if (fresh) aliceSession = fresh.id;
  });

  test("Alice's grant does not unlock Bob", async () => {
    actingUserId = alice;
    actingSessionId = aliceSession;
    expect((await actions.upsertHourlyLog(DAY, 15, { note: "alice hour" })).ok).toBe(true);
    await grant(alice, aliceSession);

    actingUserId = bob;
    actingSessionId = bobSession;
    expect(await actions.clearDayLogs(DAY)).toEqual({ ok: false, error: "needs_reauth" });

    expect(await aliceHourCount()).toBeGreaterThan(0);
  });

  test("an unauthenticated caller is refused before the gate is even consulted", async () => {
    actingUserId = null;
    actingSessionId = null;
    expect(await actions.clearDayLogs(DAY)).toEqual({ ok: false, error: "unauthenticated" });
  });

  test("the lockout engages after repeated failures", async () => {
    const { isReauthLocked, MAX_FAILURES } = await import("@/lib/dal/reauth");

    expect(await isReauthLocked(alice as never)).toBe(false);

    for (let i = 0; i < MAX_FAILURES; i += 1) {
      await db.insert(schema.reauthFailures).values({ userId: alice });
    }
    expect(await isReauthLocked(alice as never)).toBe(true);

    expect(await isReauthLocked(bob as never)).toBe(false);
  });

  test("failures outside the window do not count toward the lockout", async () => {
    const { isReauthLocked, MAX_FAILURES, FAILURE_WINDOW_MINUTES } =
      await import("@/lib/dal/reauth");

    const stale = new Date(Date.now() - (FAILURE_WINDOW_MINUTES + 1) * 60_000);
    for (let i = 0; i < MAX_FAILURES + 2; i += 1) {
      await db.insert(schema.reauthFailures).values({ userId: alice, occurredAt: stale });
    }
    expect(await isReauthLocked(alice as never)).toBe(false);
  });

  test("re-granting slides the window instead of stacking rows", async () => {
    const { grantReauth } = await import("@/lib/dal/reauth");

    await grantReauth(alice as never, aliceSession);
    await grantReauth(alice as never, aliceSession);

    const rows = await db
      .select({ id: schema.reauthGrants.id })
      .from(schema.reauthGrants)
      .where(eq(schema.reauthGrants.sessionId, aliceSession));
    expect(rows.length).toBe(1);
  });
});
