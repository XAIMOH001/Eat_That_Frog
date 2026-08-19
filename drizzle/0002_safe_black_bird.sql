ALTER TABLE "planned_tasks" ALTER COLUMN "daily_record_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "planned_tasks" ADD COLUMN "estimated_hours" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
CREATE INDEX "planned_tasks_daily_record_id_idx" ON "planned_tasks" USING btree ("daily_record_id");--> statement-breakpoint
ALTER TABLE "hourly_logs" ADD CONSTRAINT "hourly_logs_category_valid" CHECK ("hourly_logs"."category" is null or "hourly_logs"."category" in ('focus', 'admin', 'rest', 'wasted'));--> statement-breakpoint
ALTER TABLE "planned_tasks" ADD CONSTRAINT "planned_tasks_priority_valid" CHECK ("planned_tasks"."priority" in ('A1', 'A2', 'B', 'C'));--> statement-breakpoint
ALTER TABLE "planned_tasks" ADD CONSTRAINT "planned_tasks_estimated_hours_range" CHECK ("planned_tasks"."estimated_hours" between 0 and 24);