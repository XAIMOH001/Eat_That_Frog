// Comment this out before running the Better Auth CLI; it cannot resolve the config with it.
import "server-only";

import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";

import { db } from "@/db";
import * as schema from "@/db/schema";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
    usePlural: true,
    transaction: true,
  }),

  emailAndPassword: {
    enabled: true,
    minPasswordLength: 12,
    requireEmailVerification: false,
    disableSignUp: false,
  },

  session: {
    cookieCache: { enabled: true, maxAge: 5 * 60 },
  },

  advanced: {
    database: {
      generateId: "uuid",
    },
  },

  rateLimit: {
    enabled: true,
    customRules: {
      "/verify-password": { window: 60, max: 5 },
    },
  },

  telemetry: { enabled: false },

  plugins: [nextCookies()],
});
