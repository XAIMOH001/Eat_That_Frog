"use server";

import { unstable_rethrow } from "next/navigation";

import { db, type Executor } from "@/db";
import {
  commitmentCheckIns,
  dailyRecords,
  hourlyLogs,
  plannedTasks,
  privateCommitments,
} from "@/db/schema";
import { and, desc, eq } from "drizzle-orm";
import {
  CATEGORIES,
  TASK_PRIORITIES,
  dateKey,
  emptyDay,
  type CategoryId,
  type HourEntry,
} from "@/lib/journal-types";
import { isRoutineEditable, routineState } from "@/lib/routine-lock";
import { canCheckIn, commitmentState } from "@/lib/commitment-lock";
import {
  BATTLE_CATEGORIES,
  CUSTOM_CATEGORY_ID,
  MAX_COMMITMENT_LABEL,
} from "@/lib/commitment-categories";
import { sealBattle } from "@/lib/commitment-secret";
import { getCommitmentCard } from "@/lib/dal/commitment";
import type { CommitmentCard } from "@/lib/commitment-types";
import { currentSession, currentUserId, type UserId } from "@/lib/dal/session";
import { hasFreshReauth } from "@/lib/dal/reauth";

export type ActionResult<T> =
  | { ok: true; data: T }
  | {
      ok: false;
      error: "invalid_input" | "not_allowed" | "needs_reauth" | "unauthenticated" | "db_error";
    };

class InvalidInput extends Error {}
class NotAllowed extends Error {}
class Unauthenticated extends Error {}
class NeedsReauth extends Error {}

async function run<T>(what: string, fn: () => Promise<T>): Promise<ActionResult<T>> {
  try {
    return { ok: true, data: await fn() };
  } catch (error) {
    // Must stay first in the catch, or redirect() is swallowed into db_error.
    unstable_rethrow(error);
    console.error(`[action] ${what} failed:`, error);
    if (error instanceof InvalidInput) return { ok: false, error: "invalid_input" };
    if (error instanceof NotAllowed) return { ok: false, error: "not_allowed" };
    if (error instanceof NeedsReauth) return { ok: false, error: "needs_reauth" };
    if (error instanceof Unauthenticated) return { ok: false, error: "unauthenticated" };
    return { ok: false, error: "db_error" };
  }
}

async function requireUser(): Promise<UserId> {
  const userId = await currentUserId();
  if (!userId) throw new Unauthenticated("No authenticated user.");
  return userId;
}

async function requireFreshUser(): Promise<UserId> {
  const session = await currentSession();
  if (!session) throw new Unauthenticated("No authenticated user.");
  if (!(await hasFreshReauth(session.userId, session.sessionId))) {
    throw new NeedsReauth("Re-authentication required.");
  }
  return session.userId;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const CATEGORY_IDS = new Set<string>(CATEGORIES.map((c) => c.id));
const PRIORITY_IDS = new Set<string>(TASK_PRIORITIES.map((p) => p.id));

const MAX_TITLE = 200;
const MAX_NOTE = 2000;
const MAX_TASK_REF = 64;

function assertUuid(value: string, label: string): string {
  if (typeof value !== "string" || !UUID.test(value)) throw new InvalidInput(`Invalid ${label}.`);
  return value;
}

function assertDate(value: string): string {
  if (typeof value !== "string" || !ISO_DATE.test(value) || Number.isNaN(Date.parse(value))) {
    throw new InvalidInput("Invalid date, expected YYYY-MM-DD.");
  }
  return value;
}

function assertHourSlot(value: number): number {
  if (!Number.isInteger(value) || value < 0 || value > 23) {
    throw new InvalidInput("Invalid hour slot, expected an integer 0–23.");
  }
  return value;
}

function assertCategory(value: CategoryId | null): CategoryId | null {
  if (value !== null && !CATEGORY_IDS.has(value)) throw new InvalidInput("Unknown category.");
  return value;
}

function assertPriority(value: string): string {
  if (!PRIORITY_IDS.has(value)) throw new InvalidInput("Unknown task priority.");
  return value;
}

function assertEstimate(value: number): number {
  if (!Number.isInteger(value) || value < 0 || value > 24) {
    throw new InvalidInput("Estimated hours must be an integer 0–24.");
  }
  return value;
}

function assertText(value: unknown, max: number, label: string): string {
  if (typeof value !== "string") throw new InvalidInput(`Invalid ${label}.`);
  if (value.length > max) throw new InvalidInput(`${label} exceeds ${max} characters.`);
  return value;
}

async function getOwnedRecord(userId: UserId, dateString: string) {
  assertDate(dateString);

  const [record] = await db
    .select()
    .from(dailyRecords)
    .where(and(eq(dailyRecords.userId, userId), eq(dailyRecords.date, dateString)));
  return record ?? null;
}

async function getOrCreateRecord(userId: UserId, dateString: string, tx: Executor = db) {
  assertDate(dateString);

  const [inserted] = await tx
    .insert(dailyRecords)
    .values({ userId, date: dateString })
    .onConflictDoNothing({ target: [dailyRecords.userId, dailyRecords.date] })
    .returning();

  if (inserted) return inserted;

  // The user_id predicate is not optional: without it this re-select returns another user's record id.
  const [existing] = await tx
    .select()
    .from(dailyRecords)
    .where(and(eq(dailyRecords.userId, userId), eq(dailyRecords.date, dateString)));

  if (!existing) throw new Error(`Daily record for ${dateString} vanished after upsert.`);
  return existing;
}

export async function updateDailyRecordStatus(
  dateString: string,
  status: { coreRoutineMaintained: boolean; routineLockedAt: string | null },
): Promise<ActionResult<null>> {
  return run("updateDailyRecordStatus", async () => {
    const userId = await requireUser();
    assertDate(dateString);

    if (typeof status?.coreRoutineMaintained !== "boolean") {
      throw new InvalidInput("coreRoutineMaintained must be a boolean.");
    }
    const lockedAt = status.routineLockedAt;
    if (lockedAt !== null && (typeof lockedAt !== "string" || Number.isNaN(Date.parse(lockedAt)))) {
      throw new InvalidInput("Invalid routineLockedAt timestamp.");
    }

    const record = await getOrCreateRecord(userId, dateString);

    const current = {
      ...emptyDay(),
      coreRoutineMaintained: record.coreRoutineMaintained,
      routineLockedAt: record.routineLockedAt?.toISOString() ?? null,
    };
    if (!isRoutineEditable(routineState(current, dateString, new Date()))) {
      throw new NotAllowed("Routine toggle is locked for this day.");
    }

    await db
      .update(dailyRecords)
      .set({
        coreRoutineMaintained: status.coreRoutineMaintained,
        routineLockedAt: lockedAt === null ? null : new Date(lockedAt),
      })
      .where(and(eq(dailyRecords.id, record.id), eq(dailyRecords.userId, userId)));

    return null;
  });
}

export async function addPlannedTask(
  targetDate: string,
  priority: string,
  title: string,
  estimatedHours = 1,
): Promise<ActionResult<{ id: string }>> {
  return run("addPlannedTask", async () => {
    const userId = await requireUser();
    assertDate(targetDate);
    assertPriority(priority);
    assertEstimate(estimatedHours);

    const trimmed = assertText(title, MAX_TITLE, "title").trim();
    if (!trimmed) throw new InvalidInput("Task title cannot be empty.");

    return await db.transaction(async (tx) => {
      const record = await getOrCreateRecord(userId, targetDate, tx);

      const [newTask] = await tx
        .insert(plannedTasks)
        .values({
          userId,
          dailyRecordId: record.id,
          priority,
          title: trimmed,
          completed: false,
          estimatedHours,
        })
        .returning();

      if (!newTask) throw new Error("Insert returned no row.");
      return { id: newTask.id };
    });
  });
}

export async function updatePlannedTask(
  taskId: string,
  patch: { title?: string; priority?: string; completed?: boolean; estimatedHours?: number },
): Promise<ActionResult<null>> {
  return run("updatePlannedTask", async () => {
    const userId = await requireUser();
    assertUuid(taskId, "task id");

    const set: Partial<{
      title: string;
      priority: string;
      completed: boolean;
      estimatedHours: number;
    }> = {};

    if (patch.title !== undefined) {
      const trimmed = assertText(patch.title, MAX_TITLE, "title").trim();
      if (!trimmed) throw new InvalidInput("Task title cannot be empty.");
      set.title = trimmed;
    }
    if (patch.priority !== undefined) set.priority = assertPriority(patch.priority);
    if (patch.completed !== undefined) {
      if (typeof patch.completed !== "boolean")
        throw new InvalidInput("completed must be boolean.");
      set.completed = patch.completed;
    }
    if (patch.estimatedHours !== undefined) {
      set.estimatedHours = assertEstimate(patch.estimatedHours);
    }

    if (Object.keys(set).length === 0) return null;

    const updated = await db
      .update(plannedTasks)
      .set(set)
      .where(and(eq(plannedTasks.id, taskId), eq(plannedTasks.userId, userId)))
      .returning({ id: plannedTasks.id });

    if (updated.length === 0) throw new NotAllowed("No such task.");
    return null;
  });
}

export async function deletePlannedTask(taskId: string): Promise<ActionResult<null>> {
  return run("deletePlannedTask", async () => {
    const userId = await requireUser();
    assertUuid(taskId, "task id");

    await db.transaction(async (tx) => {
      await tx
        .update(hourlyLogs)
        .set({ taskId: null })
        .where(and(eq(hourlyLogs.userId, userId), eq(hourlyLogs.taskId, taskId)));

      const deleted = await tx
        .delete(plannedTasks)
        .where(and(eq(plannedTasks.id, taskId), eq(plannedTasks.userId, userId)))
        .returning({ id: plannedTasks.id });

      if (deleted.length === 0) throw new NotAllowed("No such task.");
    });

    return null;
  });
}

export async function upsertHourlyLog(
  dateString: string,
  hourSlot: number,
  data: Partial<HourEntry>,
): Promise<ActionResult<null>> {
  return run("upsertHourlyLog", async () => {
    const userId = await requireUser();
    assertDate(dateString);
    assertHourSlot(hourSlot);

    if (data.category !== undefined) assertCategory(data.category);
    if (data.note !== undefined) assertText(data.note, MAX_NOTE, "note");
    if (data.taskId !== undefined && data.taskId !== null) {
      assertText(data.taskId, MAX_TASK_REF, "task reference");
    }

    const note = data.note ?? "";
    const category = data.category ?? null;
    const taskId = data.taskId ?? null;

    if (taskId !== null && UUID.test(taskId)) {
      const [owned] = await db
        .select({ id: plannedTasks.id })
        .from(plannedTasks)
        .where(and(eq(plannedTasks.id, taskId), eq(plannedTasks.userId, userId)));
      if (!owned) throw new NotAllowed("Unknown task.");
    }

    const isFullSlot =
      data.note !== undefined && data.category !== undefined && data.taskId !== undefined;
    const isEmpty = isFullSlot && note.trim() === "" && category === null && taskId === null;

    const record = await getOrCreateRecord(userId, dateString);

    if (isEmpty) {
      await db
        .delete(hourlyLogs)
        .where(
          and(
            eq(hourlyLogs.userId, userId),
            eq(hourlyLogs.dailyRecordId, record.id),
            eq(hourlyLogs.hourSlot, hourSlot),
          ),
        );
      return null;
    }

    const set: Partial<{ note: string; category: string | null; taskId: string | null }> = {};
    if (data.note !== undefined) set.note = note;
    if (data.category !== undefined) set.category = category;
    if (data.taskId !== undefined) set.taskId = taskId;

    if (Object.keys(set).length === 0) return null;

    await db
      .insert(hourlyLogs)
      .values({ userId, dailyRecordId: record.id, hourSlot, note, category, taskId })
      .onConflictDoUpdate({
        target: [hourlyLogs.dailyRecordId, hourlyLogs.hourSlot],
        set,
        setWhere: eq(hourlyLogs.userId, userId),
      });

    return null;
  });
}

export async function clearDayLogs(dateString: string): Promise<ActionResult<null>> {
  return run("clearDayLogs", async () => {
    const userId = await requireFreshUser();
    assertDate(dateString);

    const record = await getOwnedRecord(userId, dateString);
    if (!record) return null;

    await db
      .delete(hourlyLogs)
      .where(and(eq(hourlyLogs.userId, userId), eq(hourlyLogs.dailyRecordId, record.id)));
    return null;
  });
}

const BATTLE_IDS = new Set<string>(BATTLE_CATEGORIES.map((b) => b.id));

function assertBattleCategory(value: string): string {
  if (typeof value !== "string" || !BATTLE_IDS.has(value)) {
    throw new InvalidInput("Unknown commitment category.");
  }
  return value;
}

export async function startCommitment(
  category: string,
  customLabel: string | null,
): Promise<ActionResult<null>> {
  return run("startCommitment", async () => {
    const userId = await requireUser();
    assertBattleCategory(category);

    let label: string | null = null;
    if (category === CUSTOM_CATEGORY_ID) {
      if (customLabel !== null) {
        const trimmed = assertText(customLabel, MAX_COMMITMENT_LABEL, "label").trim();
        label = trimmed === "" ? null : trimmed;
      }
    } else if (customLabel !== null) {
      throw new InvalidInput("A label is only accepted for a custom commitment.");
    }

    const [created] = await db
      .insert(privateCommitments)
      .values({
        userId,
        secret: sealBattle(userId, category, label),
        startedOn: dateKey(new Date()),
      })
      .onConflictDoNothing()
      .returning({ id: privateCommitments.id });

    if (!created) throw new NotAllowed("A commitment is already live.");
    return null;
  });
}

// Zero-arity deliberately: no date or timestamp parameter means back-dating cannot be expressed.
export async function checkInCommitment(): Promise<ActionResult<CommitmentCard>> {
  return run("checkInCommitment", async () => {
    const userId = await requireUser();
    const now = new Date();
    const todayKey = dateKey(now);

    return await db.transaction(async (tx) => {
      const [live] = await tx
        .select({
          id: privateCommitments.id,
          status: privateCommitments.status,
          startedOn: privateCommitments.startedOn,
        })
        .from(privateCommitments)
        .where(and(eq(privateCommitments.userId, userId), eq(privateCommitments.status, "active")));

      if (!live) throw new NotAllowed("No active commitment.");

      const [last] = await tx
        .select({
          keptOn: commitmentCheckIns.keptOn,
          checkedInAt: commitmentCheckIns.checkedInAt,
        })
        .from(commitmentCheckIns)
        .where(
          and(eq(commitmentCheckIns.userId, userId), eq(commitmentCheckIns.commitmentId, live.id)),
        )
        .orderBy(desc(commitmentCheckIns.keptOn))
        .limit(1);

      const state = commitmentState(
        {
          status: live.status === "paused" ? "paused" : "active",
          startedOn: live.startedOn,
          lastKeptOn: last?.keptOn ?? null,
          lastCheckedInAt: last?.checkedInAt?.toISOString() ?? null,
        },
        todayKey,
        now,
      );
      if (!canCheckIn(state)) throw new NotAllowed("Check-in is not open yet.");

      const [row] = await tx
        .insert(commitmentCheckIns)
        .values({ userId, commitmentId: live.id, keptOn: todayKey })
        .onConflictDoNothing({
          target: [commitmentCheckIns.commitmentId, commitmentCheckIns.keptOn],
        })
        .returning({ id: commitmentCheckIns.id });

      if (!row) throw new NotAllowed("Already checked in for today.");

      const card = await getCommitmentCard(userId, now, tx);
      if (!card) throw new Error("Commitment vanished mid-check-in.");
      return card;
    });
  });
}
