/// <reference types = "node"/>
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// Defence in depth. This module holds the connection string, so it must never be pulled into
// a client bundle. The `"use server"` directive on actions.ts is what actually keeps it out
// today; this turns a silent leak into a loud failure if that ever stops being true.
// (The `server-only` package would be the idiomatic guard, but it is not a dependency here.)
if (typeof window !== "undefined") {
  throw new Error("src/db must never be imported from client code.");
}

const connectionString = process.env["DATABASE_URL"];

if (!connectionString) {
  // Without this the failure surfaces deep inside postgres() as an unrelated parse error.
  throw new Error(
    "DATABASE_URL is not set. Add it to .env.local — see README for the expected format.",
  );
}

/**
 * Next's dev server re-evaluates modules on every hot reload. Without caching on globalThis
 * each reload would open a fresh pool and leak the previous one's sockets until Postgres
 * refuses new connections.
 */
const globalForDb = globalThis as unknown as {
  __journalDbClient?: ReturnType<typeof postgres>;
};

const client =
  globalForDb.__journalDbClient ??
  postgres(connectionString, {
    // Bounded so an unauthenticated burst against the Server Actions cannot exhaust
    // Postgres' connection slots.
    max: 10,
    idle_timeout: 20,
    connect_timeout: 10,
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.__journalDbClient = client;
}

export const db = drizzle(client, { schema });
