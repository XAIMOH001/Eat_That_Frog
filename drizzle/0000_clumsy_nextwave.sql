-- Baseline of a database that was created with `drizzle-kit push`, not migrations.
-- Introspected via `drizzle-kit pull`, then made idempotent by hand so that `migrate` can
-- record it as applied against the already-live tables. On an empty database it creates them
-- for real. Do not edit the matching meta/0000_snapshot.json — that snapshot, not this SQL,
-- is what `generate` diffs against.
CREATE TABLE IF NOT EXISTS "daily_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"date" date NOT NULL,
	"discipline_score" integer DEFAULT 0 NOT NULL,
	"core_routine_maintained" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "daily_records_date_unique" UNIQUE("date")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "planned_tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"daily_record_id" uuid,
	"priority" text NOT NULL,
	"title" text NOT NULL,
	"completed" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
	ALTER TABLE "planned_tasks" ADD CONSTRAINT "planned_tasks_daily_record_id_daily_records_id_fk" FOREIGN KEY ("daily_record_id") REFERENCES "public"."daily_records"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
	WHEN duplicate_object THEN null;
END $$;
