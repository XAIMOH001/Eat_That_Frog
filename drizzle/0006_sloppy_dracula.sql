-- Private Commitment: the sealed Battle and its append-only daily check-ins.
--
-- Hand-edited from the generated diff for idempotency, in the style of 0000 and 0004, so
-- `migrate` can be re-pointed at a database that already has some of this. On an empty
-- database it behaves exactly like the generated file.
--
-- The generated ordering needed no correction this time: both tables are created before
-- either foreign key is added, and private_commitments_user_id_id_unique is inline in the
-- CREATE TABLE, so the composite FK's target already exists when it is referenced. (0004
-- needed reordering only because it was altering tables that already existed.)
--
-- There is deliberately NO data step here. drizzle-kit wraps every pending migration in one
-- transaction, so anything that RAISEs would roll back the whole batch — including the
-- tables above it.
--
-- Do not edit meta/0006_snapshot.json: that snapshot, not this SQL, is what `generate`
-- diffs against.

CREATE TABLE IF NOT EXISTS "commitment_check_ins" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"commitment_id" uuid NOT NULL,
	"kept_on" date NOT NULL,
	"checked_in_at" timestamp with time zone DEFAULT now() NOT NULL,
	-- THE duplicate-check-in barrier, and the ON CONFLICT inference target. Two concurrent
	-- requests both pass any "has today been logged?" test in application code; only this
	-- rejects one of them. Keyed on commitment_id rather than user_id because after a future
	-- Change Battle the ended and the new commitment may both hold the changeover day.
	CONSTRAINT "commitment_check_ins_commitment_kept_on_unique" UNIQUE("commitment_id","kept_on")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "private_commitments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	-- AES-256-GCM ciphertext. There is no plaintext category column anywhere in this schema.
	"secret" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"started_on" date NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ended_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	-- Anchors the child's composite foreign key; trivially unique since id is the PK.
	CONSTRAINT "private_commitments_user_id_id_unique" UNIQUE("user_id","id"),
	-- text + CHECK rather than a pg enum: ALTER TYPE ... ADD VALUE cannot run inside a
	-- transaction and migrate wraps everything in one, so an enum would make every future
	-- status a migration that can never be applied.
	CONSTRAINT "private_commitments_status_valid" CHECK ("private_commitments"."status" in ('active', 'paused', 'ended')),
	CONSTRAINT "private_commitments_ended_shape" CHECK (("private_commitments"."status" = 'ended') = ("private_commitments"."ended_at" is not null)),
	-- Shape only; the value is opaque by construction. left() rather than a regex so there is
	-- no backslash to escape through drizzle, SQL and PL/pgSQL in turn.
	CONSTRAINT "private_commitments_secret_shape" CHECK (left("private_commitments"."secret", 5) = 'etf1.' and length("private_commitments"."secret") between 24 and 512)
);
--> statement-breakpoint
-- Composite, so a check-in's user_id is provably its commitment's — Postgres rejects any
-- other value. Explicitly named: drizzle's generated name for a two-column foreign key
-- exceeds Postgres's 63 bytes and is silently truncated, after which the stored name no
-- longer matches the snapshot and every `generate` reports phantom drift.
DO $$ BEGIN
	ALTER TABLE "commitment_check_ins" ADD CONSTRAINT "commitment_check_ins_owner_fk" FOREIGN KEY ("user_id","commitment_id") REFERENCES "public"."private_commitments"("user_id","id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
	WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
	ALTER TABLE "private_commitments" ADD CONSTRAINT "private_commitments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
	WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
-- Postgres does not index the referencing side of a foreign key. These serve the cascade
-- delete and every read, whose leading predicate is always user_id.
CREATE INDEX IF NOT EXISTS "commitment_check_ins_user_id_kept_on_idx" ON "commitment_check_ins" USING btree ("user_id","kept_on");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "commitment_check_ins_user_id_commitment_id_idx" ON "commitment_check_ins" USING btree ("user_id","commitment_id");--> statement-breakpoint
-- At most one live commitment per user. Partial, so ended ones accumulate as the history
-- that "changing your Battle preserves your milestones" requires. This is also what makes a
-- future Change Battle transaction safe without a code-level "is there already one" race.
CREATE UNIQUE INDEX IF NOT EXISTS "private_commitments_live_per_user_uidx" ON "private_commitments" USING btree ("user_id") WHERE "private_commitments"."status" <> 'ended';
