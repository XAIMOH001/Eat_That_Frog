import { sql } from "drizzle-orm";
import {
  pgTable,
  uuid,
  date,
  integer,
  boolean,
  timestamp,
  text,
  unique,
  check,
  index,
} from "drizzle-orm/pg-core";

export const dailyRecords = pgTable("daily_records", {
  id: uuid("id").primaryKey().defaultRandom(),
  date: date("date").notNull().unique(), // e.g., "2026-08-19"
  disciplineScore: integer("discipline_score").default(0).notNull(),
  coreRoutineMaintained: boolean("core_routine_maintained").default(false).notNull(),
  routineLockedAt: timestamp("routine_locked_at", { withTimezone: true }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const plannedTasks = pgTable(
  "planned_tasks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    dailyRecordId: uuid("daily_record_id")
      .references(() => dailyRecords.id, { onDelete: "cascade" })
      .notNull(),
    priority: text("priority").notNull(),
    title: text("title").notNull(),
    completed: boolean("completed").default(false).notNull(),
    estimatedHours: integer("estimated_hours").default(1).notNull(),
  },
  (t) => [
    index("planned_tasks_daily_record_id_idx").on(t.dailyRecordId),
    check("planned_tasks_priority_valid", sql`${t.priority} in ('A1', 'A2', 'B', 'C')`),
    check("planned_tasks_estimated_hours_range", sql`${t.estimatedHours} between 0 and 24`),
  ],
);

export const hourlyLogs = pgTable(
  "hourly_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    dailyRecordId: uuid("daily_record_id")
      .references(() => dailyRecords.id, { onDelete: "cascade" })
      .notNull(),
    hourSlot: integer("hour_slot").notNull(),
    note: text("note").default("").notNull(),
    category: text("category"),

    taskId: text("task_id"),
  },
  (t) => [
    unique("hourly_logs_record_hour_unique").on(t.dailyRecordId, t.hourSlot),
    check("hourly_logs_hour_slot_range", sql`${t.hourSlot} between 0 and 23`),
    check(
      "hourly_logs_category_valid",
      sql`${t.category} is null or ${t.category} in ('focus', 'admin', 'rest', 'wasted')`,
    ),
  ],
);
