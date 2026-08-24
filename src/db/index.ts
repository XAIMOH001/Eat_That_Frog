import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

if (typeof window !== "undefined") {
  throw new Error("src/db must never be imported from client code.");
}

const connectionString = process.env["DATABASE_URL"];

if (!connectionString) {
  throw new Error(
    "DATABASE_URL is not set. Add it to .env.local — see README for the expected format.",
  );
}

const isProduction = process.env.NODE_ENV === "production";

const globalForDb = globalThis as unknown as {
  __journalDbClient?: ReturnType<typeof postgres>;
};

const client =
  globalForDb.__journalDbClient ??
  postgres(connectionString, {
    // One serverless instance serves one request at a time, so a pool per instance only
    // multiplies connections against the same Postgres. Locally a single process serves
    // every request and does want a pool.
    max: isProduction ? 1 : 10,
    idle_timeout: 20,
    connect_timeout: 10,
    // Prepared statements are per-connection, and a transaction-mode pooler (pgbouncer,
    // Neon's -pooler host) hands a different backend to each statement — the second one
    // then fails on a name it never saw. Disabled in production because with max: 1 there
    // is nearly nothing to reuse a prepared plan across anyway.
    prepare: !isProduction,
  });

// Cached in every environment: serverless keeps the module alive between warm invocations,
// so rebuilding the pool per request would negate it.
globalForDb.__journalDbClient = client;

export const db = drizzle(client, { schema });

export type Executor = typeof db | Parameters<Parameters<typeof db.transaction>[0]>[0];
