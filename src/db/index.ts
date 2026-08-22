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

const globalForDb = globalThis as unknown as {
  __journalDbClient?: ReturnType<typeof postgres>;
};

const client =
  globalForDb.__journalDbClient ??
  postgres(connectionString, {
    max: 10,
    idle_timeout: 20,
    connect_timeout: 10,
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.__journalDbClient = client;
}

export const db = drizzle(client, { schema });

export type Executor = typeof db | Parameters<Parameters<typeof db.transaction>[0]>[0];
