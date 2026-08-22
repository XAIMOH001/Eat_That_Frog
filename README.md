# `Eat That Frog`: Personal Focus & Time-Audit Journal

> **Plan your intentions, audit your reality, and eliminate low-value busyness.**

**Eat That Frog** is a precision focus and time-blocking journal engineered to bridge the gap between what you plan to do and how you actually spend your time. Built around Brian Tracy’s _Eat That Frog!_ methodology and structured on a 24-hour schedule matrix, it forces a daily confrontation between your highest-impact goals and your actual hourly habits—keeping you strictly accountable to your core daily discipline.

---

## Overview & Philosophy

Most productivity tools suffer from a fundamental flaw: they record what you _hope_ to do, but never audit where your time _actually went_. Eat That Frog pairs advance prioritization with a 24-hour time audit to eliminate the gap between intent and execution.

- **The A1 "Frog":** Mark Twain famously remarked that if you eat a live frog first thing in the morning, you can go through the day knowing it is probably the worst thing that will happen to you. In Eat That Frog, your "Frog" is your single highest-consequence task—the one thing that yields maximum impact if completed.
- **The 10/90 Rule:** Spending 10% of your time planning in advance saves 90% of the execution effort. The integrated task queue lets you draft tomorrow's priorities before your head hits the pillow.
- **The Reality Audit:** A full 24-hour time matrix requires you to tag every hour as `Focus`, `Admin`, `Rest`, or `Leaks`, giving you an honest, objective breakdown of your daily execution.

---

## Value Proposition

- **Intent vs. Reality Alignment:** Compare planned priority tasks against actual logged hours to calculate a real-time **Execution Ratio**.
- **High-Impact Priority Execution:** Anchor every day to your **A1 Frog** before low-value reactive tasks consume your energy.
- **Objective Discipline Metrics:** Replace subjective feelings of productivity with a calculated **Daily Discipline Score** (calibrated against a realistic 6-hour waking focus target).
- **Habit Architecture & Lockout Guard:** Build unbroken routine streaks with an automated **18-hour lockout rule** that prevents retroactive logging or streak cheating.
- **Discreet Neumorphic UI:** Built with a tactile, soft grey design system (`#e0e5ec`) and privacy-conscious data models (`coreRoutineMaintained`) to ensure over-the-shoulder privacy in any setting.

---

## Key Features

- **24-Hour Schedule Matrix:** Log hourly notes and tag activities directly with linked ABCDE tasks.
- **ABCDE Task Queue:** Categorize tasks into A1 (Primary Frog), A2/A3 (Sub-Frogs), B (Tadpoles), and C (Nice-to-Haves).
- **Daily Discipline Score Gauge:** A dynamic 0–100 score engine weighting Frog completion (40%), planned execution ratio (30%), and focus hours (30%).
- **18-Hour Core Routine Lockout:** Date-bounded state machine that locks the routine toggle after execution and resets streaks to 0 if a day expires unlogged.
- **Analytics & Multi-Day Trends:** Long-term productivity analytics including a 7-day stacked bar chart (Productive hours vs. Time Leaks) and a GitHub-style habit consistency heatmap.rest by
  priority, log where the day actually went, and see how the two compare.

Next.js 16 (App Router) · React 19 · TypeScript 5.8 · Tailwind v4 · Bun

---

## Getting started

**Use Bun.** The committed lockfile is `bun.lock`, and `bunfig.toml` sets
`minimumReleaseAge = 86400` — a supply-chain guard that skips package versions published in
the last 24 hours. `npm install` ignores both, so it silently disables that protection and
generates a competing lockfile.

```sh
bun install
cp .env.example .env.local     # then fill in DATABASE_URL and BETTER_AUTH_SECRET
bun run db:migrate
bun run dev                    # http://localhost:3000
```

`BETTER_AUTH_SECRET` can be generated with `bunx auth@latest secret`. You need a Postgres to
point `DATABASE_URL` at; anything reachable will do.

The app requires an account. `/` redirects to `/sign-in`, the journal itself lives at
`/journal`, and sign-up is open by default — create one and you land on the dashboard.

| Script                | What it does                         |
| --------------------- | ------------------------------------ |
| `bun run dev`         | Dev server                           |
| `bun run build`       | Production build                     |
| `bun run lint`        | ESLint (errors block)                |
| `bunx tsc --noEmit`   | Typecheck                            |
| `bun test`            | Tests                                |
| `bun run format`      | Prettier                             |
| `bun run db:generate` | Diff the schema into a new migration |
| `bun run db:migrate`  | Apply pending migrations             |

There is deliberately no `db:pull`. Introspecting the database would overwrite
`src/db/schema.ts`, which is hand-written and carries the CHECK constraints, the composite
foreign keys, and the re-export of the generated auth schema.

Tests cover the pure logic (`daily-quote`, `journal-hydrate`, `routine-lock`) plus tenant
isolation for the Server Actions. The isolation suite needs a real database and skips
without one, because the thing it tests is the SQL predicate:

```sh
createdb etf_scratch
DATABASE_URL=postgres://…/etf_scratch bun run db:migrate
TENANCY_TEST_DATABASE_URL=postgres://…/etf_scratch bun test
```

The scoring formula in `journal-metrics.ts` is still uncovered and is the obvious next target.

---

## The model

Three things, persisted to PostgreSQL via Drizzle. Every one of them is owned: each row
carries a `user_id`, and every query is scoped by it.

```ts
PlannedTask  id, title, priority (A1|A2|B|C), targetDate, estimatedHours, actualHours, completed
DayEntry     hours (0–23), coreRoutineMaintained, routineLockedAt
HourEntry    note, category (focus|admin|rest|wasted), taskId
```

- **A1 is the frog** — the single hardest, most important task. The frog card reads and
  writes the A1 task for the day; it is not a separate field.
- **`actualHours` is derived, never incremented.** `recomputeActualHours` rebuilds every
  task's total from the hour log after any hour changes. A counter would drift the moment
  you re-tag or clear an hour. There is no column for it — the log is the source of truth
  and the total is recomputed on read.
- An hour tagged to a task but logged as **Rest or a time leak is not execution** and does not
  count toward that task.

State is optimistic in the client and persisted through Server Actions, which debounce
text edits by 600ms and flush before navigation, on tab hide, and on sign-out. A failed
write rolls the optimistic change back and says so.

The discipline score is **not** stored. `dayMetrics` derives it from the day's hours and
tasks on every render, so there is no column a client could write to. Making the server
authoritative over the score is future work, and belongs in an events table rather than a
mutable column.

**Clear Log** wipes the day's 24 hour rows and their task tags, which also drops every
task's `actualHours` back to zero. It is gated behind `ConfirmDialog` — the app's one modal,
with a focus trap, Escape to cancel, backdrop dismiss and focus returned to the trigger. The
dialog names what will be lost rather than asking a generic "are you sure", and the button is
disabled when there is nothing to clear. The frog and the routine flag are never touched.

---

## Daily Discipline Score

```
score = 40 · S_Frog  +  60 · volume · (S_Plan + S_Focus) / 2

S_Frog   1 if the A1 task is completed, else 0
volume   min(productive hours / 6, 1)
S_Plan   productive hours tagged to a planned task / productive hours
S_Focus  (focus + 0.6 · admin) / (focus + admin + wasted)
```

The frog is worth 40 outright. The other 60 are **earned against the hours actually
worked** — volume multiplies the quality terms rather than sitting beside them as a fourth
weighted term. S_Plan and S_Focus are ratios, and a ratio over a single hour is not evidence
of a disciplined day: weighting volume additively still paid one tagged focus hour 83/100,
where multiplying scores it 50.

| Day                            | Score |
| ------------------------------ | ----- |
| Frog only, nothing logged      | 40    |
| Frog + 1 tagged focus hour     | 48    |
| Frog + 4 tagged focus hours    | 70    |
| Frog + 8 tagged focus hours    | 100   |
| Frog + 4 focus, 4 wasted       | 63    |
| No frog + 8 tagged focus hours | 60    |

**Rest appears in no denominator.** This is the single most important property of the
formula, not an accident of it. Penalising a logged rest hour creates a direct incentive to
fake focus or leave hours blank, which corrupts the audit the whole app depends on. The
guarantee is testable: adding rest hours to any day never changes its score.

Other decisions worth knowing before you touch this:

- **Admin counts at 0.6 of focus.** Necessary maintenance carries roughly 60% of the
  leverage of deep frog work.
- **`S_Plan` returns 0 when no productive hours were logged**, not 100. Nothing executed
  means nothing was planned.
- **Core Routine does not score.** It drives the streak and the lockout only, so a day with
  the routine held but the frog uneaten tops out at 60.
- **Volume counts productive hours only**, so a squandered day cannot inflate it and Rest
  stays outside every term. It saturates at **6** — the view being that six hours of genuine
  focused work is already a full day, and an eighth adds nothing. This is the one knob most
  worth revisiting from real use: `FULL_DAY_HOURS` in `journal-metrics.ts`.

`verdict()` takes the frog flag rather than inferring it from the total. A day with no frog
but six fully planned hours reaches 60, which score-only bands reported as "Frog eaten" —
stating the opposite of what happened. The two ladders are independent: 40 points are the
frog, 60 are the hours, and the wording never claims one from the other.

---

## Accounts and tenant isolation

Authentication is [Better Auth](https://www.better-auth.com), self-hosted against the same
Postgres via its Drizzle adapter. Email and password only for now; adding Google or GitHub is
a `socialProviders` block in `src/lib/auth.ts` plus widening `img-src` in `next.config.ts` for
the provider's avatar host.

Protection is two layers, and the split matters:

- **`src/proxy.ts` is routing, not security.** It checks only that a session cookie is
  _present_ — it never verifies the signature, because it runs on prefetches and must stay
  off the database. Its whole job is to avoid rendering a page you cannot use.
- **The Data Access Layer is the boundary.** `verifySession()` gates the journal page and
  `requireUser()` gates every Server Action.

Both are needed. A Server Action is addressed by an opaque action id rather than by route, so
one harvested from the client bundle can be POSTed to `/sign-in` — a path proxy deliberately
treats as public — and it would still execute. Route protection cannot cover that; the check
next to the data can.

Ownership is enforced in the schema, not just in queries:

- `daily_records` is unique on `(user_id, date)`, not on `date`. Before this it was unique on
  `date` alone, which meant the table could physically hold exactly one person's journal.
- `planned_tasks` and `hourly_logs` carry a denormalised `user_id`, and a **composite**
  foreign key `(user_id, daily_record_id) → daily_records(user_id, id)` makes it provably
  equal to their parent's. Postgres rejects any other value, so filtering a child table on
  `user_id` is equivalent to joining through its parent.

The denormalisation is deliberate, and the argument is failure mode rather than speed. A
forgotten join returns the wrong rows and looks like working code; a forgotten `user_id` in a
Drizzle `.values()` is a compile error, because the column is `notNull` with no default. Fail
loud beats fail silent.

`requireUser()` returns a branded `UserId` that only the session can produce, so "never trust
a client-supplied user id" is a type error rather than a convention someone has to remember.

Two traps worth knowing before you touch `src/app/actions.ts`:

- **Never `redirect()` inside `run()`.** It catches everything to build its result code, and
  a redirect works by throwing — it would be swallowed into a generic `db_error` and silently
  never happen. `unstable_rethrow` is the first line of the catch for exactly this reason.
- An expired session returns `unauthenticated`, distinct from `not_allowed`. Collapsing them
  made the UI report a routine-lock violation to someone who had merely been logged out, who
  would then keep typing and lose every edit with nothing to click.
- A missing re-authentication grant returns `needs_reauth`, for the same reason: the client has
  to tell "type your password again" apart from "the rule says no".

### Re-authentication

A valid session says somebody signed in as you at some point. Some actions want more than
that, because the threat is a person at your unlocked laptop — for whom the session cookie is
already satisfied. Those actions require a **grant**: proof of your password on _this device_
within the last five minutes (`src/lib/dal/reauth.ts`).

`clearDayLogs` is the only consumer today. Revealing or changing the private commitment are
the intended next two.

- `auth.api.verifyPassword` does the check. Unlike `signInEmail` it never creates a session row
  or rewrites the session cookie, so confirming your identity cannot rotate the credential it
  is confirming.
- A grant is keyed to `sessions.id` with `ON DELETE CASCADE`, so **signing out revokes it with
  no code involved**, and a grant earned on a laptop never unlocks a phone. The row stores the
  session's id, never its token.
- The `UNIQUE` on `session_id` makes re-authenticating an upsert, so there is never more than
  one grant per session to reason about.
- Five failed attempts inside fifteen minutes stop the gate accepting more. Locking by user is
  safe here: `/verify-password` requires a valid session, so a stranger cannot trigger it
  without already holding your cookie.

**Rate limiting is two layers, and neither is redundant.** Better Auth's limiter runs only in
its HTTP router, so it protects the raw `POST /api/auth/verify-password` route (which the
catch-all handler leaves reachable) but does nothing for `auth.api.verifyPassword` called from
a Server Action. The database-backed failure counter covers that path, and unlike Better
Auth's default in-memory storage it survives a restart. Note the limiter also defaults to
production-only, which is why `src/lib/auth.ts` sets `enabled: true` explicitly.

The dialog is a convenience. The gate is `requireFreshUser()` in `src/app/actions.ts`, and the
test that matters calls the action directly with no grant to prove it.

---

## Core Routine lockout

A date-bounded state machine (`src/lib/routine-lock.ts`), pure and clock-injected — nothing
in it reads the ambient clock, so it survives a server boundary and is directly testable.

| State      | When                                      | Editable |
| ---------- | ----------------------------------------- | -------- |
| `open`     | Today, not yet set                        | yes      |
| `locked`   | Set within the last 18 hours              | no       |
| `reopened` | Today, set, lockout elapsed               | yes      |
| `held`     | A past day that was set                   | no       |
| `failed`   | A past day never set — permanently missed | no       |
| `future`   | A later date                              | no       |

Setting the toggle stamps `routineLockedAt` and locks for 18 hours, capped at end of day.
The hook rejects the write when the state is not editable, so the rule holds even if a
caller forgets to disable the control.

**Streak semantics: grace during the day, permanent fail at midnight.** An unlogged _today_
still reads the run through yesterday — zeroing a live streak before the day has ended is
punitive for a day you can still save. Once the date rolls over, that day breaks the run
like any other miss.

A consequence worth knowing: because past dates are read-only, historical routine data
cannot be created through the UI at all. The heatmap will show at most one held day per
session until persistence lands.

---

## Analytics

- **Frog Execution Rate** — a stat tile, not a chart. Week over week. Days with no frog
  named are not counted against you; you can only fail to eat a frog you actually set.
- **Time Distribution** — donut with a Today / 7 days / 30 days filter.
- **Last 7 Days** — stacked productive-versus-leaked bars.
- **Habit Heatmap** — month grid of routine consistency.

### Chart colour is computed, not chosen

Two constraints came out of running a palette validator against the `#e0e5ec` surface, and
both are load-bearing:

- The bar chart deliberately has **only two series**. Adding Rest as a third stack segment
  drops the palette below the colourblind separation floor.
- The heatmap encodes held versus missed by **fill presence** — a filled raised cell against
  an empty sunken one — not by a green/red pair, which measures ΔE 4.6 for protanopia
  against this surface, i.e. indistinguishable for red-blind readers.

**Known issue:** the four-category palette fails as a _chart_ palette. Focus and Admin sit at
ΔE 11.7 for normal vision, under the floor of 15, so those donut segments are hard to tell
apart even with full colour vision. The palette was tuned for WCAG text contrast, which is a
different job. Fixing it means changing colour tokens, which the design brief forbids.

---
