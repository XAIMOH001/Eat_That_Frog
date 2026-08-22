import { dailyRecords, hourlyLogs, plannedTasks } from "@/db/schema";
import { recomputeActualHours } from "./journal-metrics";
import {
  emptyDay,
  type CategoryId,
  type DayEntry,
  type JournalData,
  type PlannedTask,
  type TaskPriority,
} from "./journal-types";

export type RecordRow = Pick<
  typeof dailyRecords.$inferSelect,
  "id" | "date" | "coreRoutineMaintained" | "routineLockedAt"
>;

export type HourlyLogRow = Pick<
  typeof hourlyLogs.$inferSelect,
  "dailyRecordId" | "hourSlot" | "note" | "category" | "taskId"
>;

export type PlannedTaskRow = Pick<
  typeof plannedTasks.$inferSelect,
  "id" | "dailyRecordId" | "priority" | "title" | "completed" | "estimatedHours"
>;

function isoOrNull(value: Date | null): string | null {
  if (value === null) return null;
  return Number.isNaN(value.getTime()) ? null : value.toISOString();
}

export function hydrateJournal(
  records: RecordRow[],
  logs: HourlyLogRow[],
  tasks: PlannedTaskRow[],
): JournalData {
  const dateById = new Map<string, string>();
  const days: Record<string, DayEntry> = {};

  for (const record of records) {
    dateById.set(record.id, record.date);
    days[record.date] = {
      ...emptyDay(),
      coreRoutineMaintained: record.coreRoutineMaintained,
      routineLockedAt: isoOrNull(record.routineLockedAt),
    };
  }

  for (const log of logs) {
    const key = dateById.get(log.dailyRecordId);
    if (!key) continue;
    const day = days[key];
    if (!day) continue;
    day.hours[String(log.hourSlot)] = {
      note: log.note,
      category: (log.category as CategoryId | null) ?? null,
      taskId: log.taskId,
    };
  }

  const taskMap: Record<string, PlannedTask> = {};
  for (const task of tasks) {
    const targetDate = dateById.get(task.dailyRecordId);
    if (!targetDate) continue;
    taskMap[task.id] = {
      id: task.id,
      title: task.title,
      priority: task.priority as TaskPriority,
      targetDate,
      estimatedHours: task.estimatedHours,
      actualHours: 0,
      completed: task.completed,
    };
  }

  return recomputeActualHours({ version: 3, days, tasks: taskMap });
}
