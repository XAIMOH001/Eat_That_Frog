import "server-only";

import { and, eq, gte, inArray, lte, or } from "drizzle-orm";

import { db } from "@/db";
import { dailyRecords, hourlyLogs, plannedTasks } from "@/db/schema";
import { shiftKey } from "@/lib/journal-types";
import type { UserId } from "@/lib/dal/session";

export type JournalWindow = {
  records: (typeof dailyRecords.$inferSelect)[];
  logs: (typeof hourlyLogs.$inferSelect)[];
  tasks: (typeof plannedTasks.$inferSelect)[];
};

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function assertDate(value: string): string {
  if (typeof value !== "string" || !ISO_DATE.test(value) || Number.isNaN(Date.parse(value))) {
    throw new Error("Invalid date, expected YYYY-MM-DD.");
  }
  return value;
}

export async function getJournalWindow(
  userId: UserId,
  selectedDate: string,
  todayDate: string,
  days = 90,
): Promise<JournalWindow> {
  assertDate(selectedDate);
  assertDate(todayDate);
  if (!Number.isInteger(days)) throw new Error("days must be an integer.");

  const span = Math.max(1, Math.min(days, 366));

  const records = await db
    .select()
    .from(dailyRecords)
    .where(
      and(
        eq(dailyRecords.userId, userId),
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
      ),
    );

  if (records.length === 0) return { records: [], logs: [], tasks: [] };

  const ids = records.map((r) => r.id);
  const [logs, tasks] = await Promise.all([
    db
      .select()
      .from(hourlyLogs)
      .where(and(eq(hourlyLogs.userId, userId), inArray(hourlyLogs.dailyRecordId, ids))),
    db
      .select()
      .from(plannedTasks)
      .where(and(eq(plannedTasks.userId, userId), inArray(plannedTasks.dailyRecordId, ids))),
  ]);

  return { records, logs, tasks };
}
