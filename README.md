# `Eat That Frog`: Personal Focus & Time-Audit Journal

> **Plan your intentions, audit your reality, and eliminate low-value busyness.**

**Time Weaver** is a precision focus and time-blocking journal engineered to bridge the gap between what you plan to do and how you actually spend your time. Built around Brian Tracy’s *Eat That Frog!* methodology and structured on a 24-hour schedule matrix, it forces a daily confrontation between your highest-impact goals and your actual hourly habits—keeping you strictly accountable to your core daily discipline.

---

## Overview & Philosophy

Most productivity tools suffer from a fundamental flaw: they record what you *hope* to do, but never audit where your time *actually went*. Time Weaver pairs advance prioritization with a 24-hour time audit to eliminate the gap between intent and execution.

* **The A1 "Frog":** Mark Twain famously remarked that if you eat a live frog first thing in the morning, you can go through the day knowing it is probably the worst thing that will happen to you. In Time Weaver, your "Frog" is your single highest-consequence task—the one thing that yields maximum impact if completed.
* **The 10/90 Rule:** Spending 10% of your time planning in advance saves 90% of the execution effort. The integrated task queue lets you draft tomorrow's priorities before your head hits the pillow.
* **The Reality Audit:** A full 24-hour time matrix requires you to tag every hour as `Focus`, `Admin`, `Rest`, or `Wasted`, giving you an honest, objective breakdown of your daily execution.

---

## Value Proposition

* **Intent vs. Reality Alignment:** Compare planned priority tasks against actual logged hours to calculate a real-time **Execution Ratio**.
* **High-Impact Priority Execution:** Anchor every day to your **A1 Frog** before low-value reactive tasks consume your energy.
* **Objective Discipline Metrics:** Replace subjective feelings of productivity with a calculated **Daily Discipline Score** (calibrated against a realistic 6-hour waking focus target).
* **Habit Architecture & Lockout Guard:** Build unbroken routine streaks with an automated **18-hour lockout rule** that prevents retroactive logging or streak cheating.
* **Discreet Neumorphic UI:** Built with a tactile, soft grey design system (`#e0e5ec`) and privacy-conscious data models (`coreRoutineMaintained`) to ensure over-the-shoulder privacy in any setting.

---

## Key Features

* **24-Hour Schedule Matrix:** Log hourly notes and tag activities directly with linked ABCDE tasks.
* **ABCDE Task Queue:** Categorize tasks into A1 (Primary Frog), A2/A3 (Sub-Frogs), B (Tadpoles), and C (Nice-to-Haves).
* **Daily Discipline Score Gauge:** A dynamic 0–100 score engine weighting Frog completion (40%), planned execution ratio (30%), and focus hours (30%).
* **18-Hour Core Routine Lockout:** Date-bounded state machine that locks the routine toggle after execution and resets streaks to 0 if a day expires unlogged.
* **Analytics & Multi-Day Trends:** Long-term productivity analytics including a 7-day stacked bar chart (Productive vs. Wasted time) and a GitHub-style habit consistency heatmap.rest by
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
bun run dev        # http://localhost:3000
```

| Script              | What it does          |
| ------------------- | --------------------- |
| `bun run dev`       | Dev server            |
| `bun run build`     | Production build      |
| `bun run lint`      | ESLint (errors block) |
| `bunx tsc --noEmit` | Typecheck             |
| `bun run format`    | Prettier              |

There are no tests. The scoring and state-machine logic are pure functions and are the
obvious first thing to cover.

---

## The model

Three things, shaped for the PostgreSQL backend they will become:

```ts
PlannedTask  id, title, priority (A1|A2|B|C), targetDate, estimatedHours, actualHours, completed
DayEntry     hours (0–23), coreRoutineMaintained, routineLockedAt
HourEntry    note, category (focus|admin|rest|wasted), taskId
```

- **A1 is the frog** — the single hardest, most important task. The frog card reads and
  writes the A1 task for the day; it is not a separate field.
- **`actualHours` is derived, never incremented.** `recomputeActualHours` rebuilds every
  task's total from the hour log after any hour changes. A counter would drift the moment
  you re-tag or clear an hour. It is stored as a column so a future backend can read it
  without replaying the log, but the log is always the source of truth.
- An hour tagged to a task but logged as **Rest or Wasted is not execution** and does not
  count toward that task.

State is in-memory for the duration of the session. Reloading clears everything.

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
- **Last 7 Days** — stacked productive-versus-wasted bars.
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

## Design system

Pure Neumorphism (Soft UI). **These values are fixed by the brief — do not change them:**

```
surface   bg-surface                                        (#e0e5ec)
raised    shadow-[9px_9px_16px_#a3b1c6,-9px_-9px_16px_#ffffff]
button    shadow-[5px_5px_10px_#a3b1c6,-5px_-5px_10px_#ffffff]
sunken    shadow-[inset_3px_3px_6px_#a3b1c6,inset_-3px_-3px_6px_#ffffff]
```

Use the tokens (`bg-surface`, `text-muted-foreground`, `ring-accent`), not raw hex. Colours
set through inline `style` are invisible to the Tailwind linter and have drifted from the
corrected palette twice — check those by hand.

Foreground colours were darkened to clear **WCAG AA 4.5:1** against the surface; the
originals ranged from 2.00:1 to 3.84:1. Ratios are noted per token in `globals.css` —
re-measure before altering any of them.

**Accepted exception:** every control is surface-on-surface with no border, so the neumorphic
shadow is the only thing marking a control as a control — at 1.72:1, under SC 1.4.11's 3:1.
This is a deliberate trade against the brief's fixed shadow values, not an oversight, and it
would block a formal conformance claim.

---

## Security headers

Set in `next.config.ts`: CSP, HSTS, `nosniff`, `Referrer-Policy`, `X-Frame-Options`,
`Permissions-Policy`, COOP, and `poweredByHeader: false`. Dev builds branch to allow
`'unsafe-eval'` and websockets for react-refresh and HMR.

Two caveats:

- **`script-src` carries `'unsafe-inline'`.** Next emits five inline bootstrap scripts, so a
  strict `script-src` breaks hydration outright. Removing it needs per-request nonces, which
  means middleware and dynamic rendering. Revisit when the backend lands — auth makes those
  routes dynamic anyway, which is also when user-controlled data starts being rendered.
- **These headers only apply under `next start`.** Deploy to a static host and they vanish;
  whatever CDN or proxy fronts production needs the same set.

---

## Before adding the backend

Planned: PostgreSQL/Supabase, Server Actions, Auth.js. Three things land with that work:

1. **Dates as normalized `YYYY-MM-DD` strings across the server boundary.**
   `JournalDashboard` currently calls `new Date()` during render — safe today only because
   the dashboard is `ssr: false`, and it breaks quietly if someone removes the dynamic import.
2. **The CSP nonce upgrade** (above).
3. **Real SSR.** The page currently ships zero server-rendered content. `ssr: false` is
   load-bearing for a timezone hydration guard; recovering SSR means isolating the three
   clock-dependent nodes rather than opting the whole app out.

`coreRoutineMaintained` is deliberately neutral naming and should stay that way in the
database schema and any API payload.
