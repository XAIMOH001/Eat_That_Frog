-- Re-authentication grants and failed attempts.
--
-- Hand-edited from the generated diff for idempotency, in the style of 0000/0004/0006, so
-- `migrate` can be re-pointed at a database that already has some of this.
--
-- Purely additive, and deliberately no data step: drizzle-kit wraps every pending migration
-- in one transaction, so anything that RAISEs would take the whole batch down with it.
--
-- The load-bearing constraint here is reauth_grants_session_id_sessions_id_fk with ON DELETE
-- CASCADE. Signing out deletes the session row, which deletes the grant — so revocation is a
-- property of the schema rather than something application code has to remember. The UNIQUE
-- on session_id is what makes re-authentication an upsert and the unlock check a single
-- indexed lookup.
--
-- Do not edit meta/0007_snapshot.json: that snapshot, not this SQL, is what `generate` diffs.

CREATE TABLE IF NOT EXISTS "reauth_failures" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "reauth_grants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	-- The session's id, never its token: a bearer credential has no business being copied
	-- into a second table.
	"session_id" uuid NOT NULL,
	"granted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	-- At most one grant per session, so re-authenticating upserts rather than appending.
	CONSTRAINT "reauth_grants_session_id_unique" UNIQUE("session_id")
);
--> statement-breakpoint
DO $$ BEGIN
	ALTER TABLE "reauth_failures" ADD CONSTRAINT "reauth_failures_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
	WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
	ALTER TABLE "reauth_grants" ADD CONSTRAINT "reauth_grants_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
	WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
-- This is the revocation mechanism. Do not weaken the cascade.
DO $$ BEGIN
	ALTER TABLE "reauth_grants" ADD CONSTRAINT "reauth_grants_session_id_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
	WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
-- Postgres does not index the referencing side of a foreign key. These serve the cascade
-- deletes and the two hot reads: "is this session unlocked" and "how many recent failures".
CREATE INDEX IF NOT EXISTS "reauth_failures_user_id_occurred_at_idx" ON "reauth_failures" USING btree ("user_id","occurred_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "reauth_grants_user_id_expires_at_idx" ON "reauth_grants" USING btree ("user_id","expires_at");
