-- Multi-tenancy: daily_records / planned_tasks / hourly_logs gain an owner.
--
-- Hand-edited from the generated diff, in the style of 0000. Three corrections were needed
-- and each one is load-bearing:
--
--   1. drizzle emits `ADD COLUMN "user_id" uuid NOT NULL`, which cannot run against a table
--      that already has rows. Split into add-nullable / backfill / set-not-null.
--   2. drizzle ordered the children's composite foreign keys BEFORE the
--      daily_records_user_id_id_unique constraint they reference, so Postgres would reject
--      them with "no unique constraint matching given keys". The unique now comes first.
--   3. made idempotent, so `migrate` can be re-pointed at a database that already has some
--      of this. On an empty database it behaves exactly like the generated file.
--
-- drizzle-kit runs every pending migration inside one transaction, so the whole thing is
-- atomic: if the backfill refuses, nothing here is applied and __drizzle_migrations is not
-- advanced. Do not edit meta/0004_snapshot.json — that snapshot, not this SQL, is what
-- `generate` diffs against.

ALTER TABLE "daily_records" DROP CONSTRAINT IF EXISTS "daily_records_date_unique";--> statement-breakpoint
ALTER TABLE "hourly_logs" DROP CONSTRAINT IF EXISTS "hourly_logs_daily_record_id_daily_records_id_fk";--> statement-breakpoint
ALTER TABLE "planned_tasks" DROP CONSTRAINT IF EXISTS "planned_tasks_daily_record_id_daily_records_id_fk";--> statement-breakpoint
DROP INDEX IF EXISTS "planned_tasks_daily_record_id_idx";--> statement-breakpoint

ALTER TABLE "daily_records" ADD COLUMN IF NOT EXISTS "user_id" uuid;--> statement-breakpoint
ALTER TABLE "hourly_logs" ADD COLUMN IF NOT EXISTS "user_id" uuid;--> statement-breakpoint
ALTER TABLE "planned_tasks" ADD COLUMN IF NOT EXISTS "user_id" uuid;--> statement-breakpoint

-- Adopt the pre-auth rows. There is exactly one legitimate owner: the account that existed
-- before this ran. Anything else is refused rather than guessed, because attaching somebody
-- else's journal to an account is silent and unrecoverable.
DO $$
DECLARE
	owner_id uuid;
	orphans  bigint;
	accounts bigint;
BEGIN
	SELECT count(*) INTO orphans FROM "daily_records" WHERE "user_id" IS NULL;
	IF orphans = 0 THEN
		RETURN;  -- fresh database, or already adopted: nothing to do
	END IF;

	SELECT count(*) INTO accounts FROM "users";

	IF accounts = 0 THEN
		RAISE EXCEPTION
			'% pre-auth daily_records rows and no account to own them. Migration 0003 created the auth tables: sign up in the app, then re-run `bun run db:migrate`.', orphans;
	END IF;

	IF accounts > 1 THEN
		RAISE EXCEPTION
			'% accounts exist, so the owner of the % pre-auth rows is ambiguous. Set daily_records.user_id by hand, then re-run `bun run db:migrate`.', accounts, orphans;
	END IF;

	SELECT "id" INTO owner_id FROM "users" LIMIT 1;

	UPDATE "daily_records" SET "user_id" = owner_id WHERE "user_id" IS NULL;

	-- Children inherit from their own parent rather than from owner_id, so they cannot
	-- diverge even if this block is re-run against a partially migrated table.
	UPDATE "planned_tasks" t SET "user_id" = d."user_id"
		FROM "daily_records" d WHERE d."id" = t."daily_record_id" AND t."user_id" IS NULL;
	UPDATE "hourly_logs" l SET "user_id" = d."user_id"
		FROM "daily_records" d WHERE d."id" = l."daily_record_id" AND l."user_id" IS NULL;
END $$;--> statement-breakpoint

ALTER TABLE "daily_records" ALTER COLUMN "user_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "hourly_logs" ALTER COLUMN "user_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "planned_tasks" ALTER COLUMN "user_id" SET NOT NULL;--> statement-breakpoint

DO $$ BEGIN
	ALTER TABLE "daily_records" ADD CONSTRAINT "daily_records_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
	WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint

-- Before the child foreign keys, not after: they reference this exact pair of columns.
-- Note the guard catches duplicate_table as well as duplicate_object — a repeated UNIQUE
-- raises 42P07 on its backing index name, not 42710. 0000 gets away with the narrower
-- guard only because it wraps a foreign key.
DO $$ BEGIN
	ALTER TABLE "daily_records" ADD CONSTRAINT "daily_records_user_id_id_unique" UNIQUE("user_id","id");
EXCEPTION
	WHEN duplicate_object OR duplicate_table THEN null;
END $$;--> statement-breakpoint

-- The load-bearing swap: one row per user per day, replacing one row per day globally.
DO $$ BEGIN
	ALTER TABLE "daily_records" ADD CONSTRAINT "daily_records_user_id_date_unique" UNIQUE("user_id","date");
EXCEPTION
	WHEN duplicate_object OR duplicate_table THEN null;
END $$;--> statement-breakpoint

-- Composite, so a child's user_id is provably its parent's. This is what lets the queries
-- filter on a denormalised user_id without that being a promise the code has to keep.
DO $$ BEGIN
	ALTER TABLE "planned_tasks" ADD CONSTRAINT "planned_tasks_owner_record_fk" FOREIGN KEY ("user_id","daily_record_id") REFERENCES "public"."daily_records"("user_id","id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
	WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint

DO $$ BEGIN
	ALTER TABLE "hourly_logs" ADD CONSTRAINT "hourly_logs_owner_record_fk" FOREIGN KEY ("user_id","daily_record_id") REFERENCES "public"."daily_records"("user_id","id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
	WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint

-- Postgres does not index the referencing side of a foreign key. These serve the cascade
-- delete and every rewritten query, whose leading predicate is now always user_id.
CREATE INDEX IF NOT EXISTS "planned_tasks_user_id_daily_record_id_idx" ON "planned_tasks" USING btree ("user_id","daily_record_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "hourly_logs_user_id_daily_record_id_idx" ON "hourly_logs" USING btree ("user_id","daily_record_id");--> statement-breakpoint

-- deletePlannedTask untags by task_id, which has never been indexed. Pre-tenancy that was a
-- scan of one journal; now it would scan every tenant's logs. Partial, because most hours
-- carry no tag at all.
CREATE INDEX IF NOT EXISTS "hourly_logs_user_id_task_id_idx" ON "hourly_logs" USING btree ("user_id","task_id") WHERE "hourly_logs"."task_id" is not null;
