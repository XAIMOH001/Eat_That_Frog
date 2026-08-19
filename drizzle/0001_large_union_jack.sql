CREATE TABLE "hourly_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"daily_record_id" uuid NOT NULL,
	"hour_slot" integer NOT NULL,
	"note" text DEFAULT '' NOT NULL,
	"category" text,
	"task_id" text,
	CONSTRAINT "hourly_logs_record_hour_unique" UNIQUE("daily_record_id","hour_slot"),
	CONSTRAINT "hourly_logs_hour_slot_range" CHECK ("hourly_logs"."hour_slot" between 0 and 23)
);
--> statement-breakpoint
ALTER TABLE "daily_records" ADD COLUMN "routine_locked_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "hourly_logs" ADD CONSTRAINT "hourly_logs_daily_record_id_daily_records_id_fk" FOREIGN KEY ("daily_record_id") REFERENCES "public"."daily_records"("id") ON DELETE cascade ON UPDATE no action;