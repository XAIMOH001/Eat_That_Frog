"use server";

import { db } from "@/db";
import { dailyRecords, hourlyLogs, plannedTasks } from "@/db/schema";
import { and, eq, gte, inArray, lte, or } from "drizzle-orm";
import {
  CATEGORIES,
  TASK_PRIORITIES,
  emptyDay,
  shiftKey,
  type CategoryId,
  type HourEntry,
} from "@/lib/journal-types";
import { isRoutineEditable, routineState } from "@/lib/routine-lock";

/* ------------------------------------------------------------------ result --- */

/**
 * Mutations return a result rather than throwing, so the optimistic client can tell a
 * failure from a success and roll back. `error` is a short stable code, never a driver
 * message: a thrown error is redacted by Next in production, but a returned string is not.
 */
export type ActionResult<T> =
  { ok: true; data: T } | { ok: false; error: "invalid_input" | "not_allowed" | "db_error" };

class InvalidInput extends Error {}
class NotAllowed extends Error {}

async function run<T>(what: string, fn: () => Promise<T>): Promise<ActionResult<T>> {
  try {
    return { ok: true, data: await fn() };
  } catch (error) {
    // The real error stays on the server; the client gets a code.
    console.error(`[action] ${what} failed:`, error);
    if (error instanceof InvalidInput) return { ok: false, error: "invalid_input" };
    if (error instanceof NotAllowed) return { ok: false, error: "not_allowed" };
    return { ok: false, error: "db_error" };
  }
}

/* ------------------------------------------------------------------ guards --- */

/**
 * OWNERSHIP SEAM — THIS PROVIDES NO SECURITY TODAY.
 *
 * Every Server Action below is a public, unauthenticated HTTP endpoint: anyone who can
 * reach the origin can call it. This app has no auth layer and no user column, so this
 * function returns a constant and checks nothing. It exists solely so that wiring real
 * authentication later is a change to one function plus an ownership predicate, rather
 * than an edit to every action. Do not mistake its presence for a protected boundary.
 */
async function requireUser(): Promise<string> {
  return "local";
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const CATEGORY_IDS = new Set<string>(CATEGORIES.map((c) => c.id));
const PRIORITY_IDS = new Set<string>(TASK_PRIORITIES.map((p) => p.id));

/** Length caps. Nothing else bounds these — the columns are bare `text`. */
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

/** Type-checks before any string method runs — `data` is untyped at runtime. */
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

/* ------------------------------------------------------------ daily records --- */

/** Read-only. Returns null rather than creating, so a GET never writes. */
export async function getRecord(dateString: string) {
  await requireUser();
  assertDate(dateString);

  const [record] = await db.select().from(dailyRecords).where(eq(dailyRecords.date, dateString));
  return record ?? null;
}

/**
 * Insert-first so concurrent first-writes for the same day cannot both pass a "does it
 * exist" check and collide on daily_records.date's UNIQUE constraint. A transaction would
 * not help here at READ COMMITTED — the conflict clause is what makes this safe.
 */
type Executor = typeof db | Parameters<Parameters<typeof db.transaction>[0]>[0];

async function getOrCreateRecord(dateString: string, tx: Executor = db) {
  assertDate(dateString);

  const [inserted] = await tx
    .insert(dailyRecords)
    .values({ date: dateString })
    .onConflictDoNothing({ target: dailyRecords.date })
    .returning();

  if (inserted) return inserted;

  // Lost the race: the winner's row is committed by the time the conflict resolved.
  const [existing] = await tx.select().from(dailyRecords).where(eq(dailyRecords.date, dateString));

  if (!existing) throw new Error(`Daily record for ${dateString} vanished after upsert.`);
  return existing;
}

export async function updateDailyRecordStatus(
  dateString: string,
  status: { coreRoutineMaintained: boolean; routineLockedAt: string | null },
): Promise<ActionResult<null>> {
  return run("updateDailyRecordStatus", async () => {
    await requireUser();
    assertDate(dateString);

    if (typeof status?.coreRoutineMaintained !== "boolean") {
      throw new InvalidInput("coreRoutineMaintained must be a boolean.");
    }
    const lockedAt = status.routineLockedAt;
    if (lockedAt !== null && (typeof lockedAt !== "string" || Number.isNaN(Date.parse(lockedAt)))) {
      throw new InvalidInput("Invalid routineLockedAt timestamp.");
    }

    const record = await getOrCreateRecord(dateString);

    // The 18-hour lockout is a data-integrity rule, not a UI affordance: without this the
    // toggle can be forged on any past day and an arbitrary streak fabricated. Server-local
    // time is used, matching how page.tsx derives today.
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
      .where(eq(dailyRecords.id, record.id));

    return null;
  });
}

/* ------------------------------------------------------------ planned tasks --- */

/** Keyed on the task's target date: the queue can plan tomorrow from today's view. */
export async function addPlannedTask(
  targetDate: string,
  priority: string,
  title: string,
  estimatedHours = 1,
): Promise<ActionResult<{ id: string }>> {
  return run("addPlannedTask", async () => {
    await requireUser();
    assertDate(targetDate);
    assertPriority(priority);
    assertEstimate(estimatedHours);

    const trimmed = assertText(title, MAX_TITLE, "title").trim();
    if (!trimmed) throw new InvalidInput("Task title cannot be empty.");

    // Atomic: a crash between creating the day and inserting its task would otherwise
    // leave an empty daily_records row behind.
    return await db.transaction(async (tx) => {
      const record = await getOrCreateRecord(targetDate, tx);

      const [newTask] = await tx
        .insert(plannedTasks)
        .values({
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
    await requireUser();
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

    await db.update(plannedTasks).set(set).where(eq(plannedTasks.id, taskId));
    return null;
  });
}

export async function deletePlannedTask(taskId: string): Promise<ActionResult<null>> {
  return run("deletePlannedTask", async () => {
    await requireUser();
    assertUuid(taskId, "task id");

    // hourly_logs.task_id deliberately has no foreign key, so the untagging is ours to do.
    // Both halves in one transaction: the client used to orchestrate this as N+1 separate
    // round-trips with no ordering guarantee, which left dangling tags on partial failure.
    await db.transaction(async (tx) => {
      await tx.update(hourlyLogs).set({ taskId: null }).where(eq(hourlyLogs.taskId, taskId));
      await tx.delete(plannedTasks).where(eq(plannedTasks.id, taskId));
    });

    return null;
  });
}

/* -------------------------------------------------------------- hourly logs --- */

/**
 * Insert or update one hour. `data` may be partial — only the keys present are written on
 * conflict, so persisting a note cannot clobber the category beside it.
 *
 * An hour that ends up entirely empty is deleted rather than stored: the habit heatmap
 * treats "has any hour row" as "this day was logged", and a note typed then deleted should
 * not light a day up forever.
 */
export async function upsertHourlyLog(
  dateString: string,
  hourSlot: number,
  data: Partial<HourEntry>,
): Promise<ActionResult<null>> {
  return run("upsertHourlyLog", async () => {
    await requireUser();
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

    const isFullSlot =
      data.note !== undefined && data.category !== undefined && data.taskId !== undefined;
    const isEmpty = isFullSlot && note.trim() === "" && category === null && taskId === null;

    const record = await getOrCreateRecord(dateString);

    if (isEmpty) {
      await db
        .delete(hourlyLogs)
        .where(and(eq(hourlyLogs.dailyRecordId, record.id), eq(hourlyLogs.hourSlot, hourSlot)));
      return null;
    }

    const set: Partial<{ note: string; category: string | null; taskId: string | null }> = {};
    if (data.note !== undefined) set.note = note;
    if (data.category !== undefined) set.category = category;
    if (data.taskId !== undefined) set.taskId = taskId;

    // Drizzle emits an invalid `DO UPDATE SET` for an empty set object.
    if (Object.keys(set).length === 0) return null;

    await db
      .insert(hourlyLogs)
      .values({ dailyRecordId: record.id, hourSlot, note, category, taskId })
      .onConflictDoUpdate({ target: [hourlyLogs.dailyRecordId, hourlyLogs.hourSlot], set });

    return null;
  });
}

export async function clearDayLogs(dateString: string): Promise<ActionResult<null>> {
  return run("clearDayLogs", async () => {
    await requireUser();
    assertDate(dateString);

    const record = await getRecord(dateString);
    if (!record) return null;

    await db.delete(hourlyLogs).where(eq(hourlyLogs.dailyRecordId, record.id));
    return null;
  });
}

/* ------------------------------------------------------------------ window --- */

export type JournalWindow = {
  records: (typeof dailyRecords.$inferSelect)[];
  logs: (typeof hourlyLogs.$inferSelect)[];
  tasks: (typeof plannedTasks.$inferSelect)[];
};

/**
 * Everything needed to draw the analytics panels: a trailing window ending at the selected
 * day, plus one ending at today. Two ranges rather than one min..max span because the date
 * picker accepts anything from 2000 to 2100 — a single span between a distant past date and
 * today would be unbounded, while the streak counters still need the days around today.
 */
export async function getJournalWindow(
  selectedDate: string,
  todayDate: string,
  days = 90,
): Promise<JournalWindow> {
  await requireUser();
  assertDate(selectedDate);
  assertDate(todayDate);
  if (!Number.isInteger(days)) throw new InvalidInput("days must be an integer.");

  const span = Math.max(1, Math.min(days, 366));

  const records = await db
    .select()
    .from(dailyRecords)
    .where(
      or(
        and(
          gte(dailyRecords.date, shiftKey(todayDate, -(span - 1))),
          lte(dailyRecords.date, todayDate),
        ),
        and(
          gte(dailyRecords.date, shiftKey(selectedDate, -(span - 1))),
          lte(dailyRecords.date, selectedDate),
        ),
      ),
    );

  if (records.length === 0) return { records: [], logs: [], tasks: [] };

  const ids = records.map((r) => r.id);
  const [logs, tasks] = await Promise.all([
    db.select().from(hourlyLogs).where(inArray(hourlyLogs.dailyRecordId, ids)),
    db.select().from(plannedTasks).where(inArray(plannedTasks.dailyRecordId, ids)),
  ]);

  return { records, logs, tasks };
}
