# Personal Focus & Time-Audit Journal — Neumorphic Soft UI

A single-page, fully offline daily time-audit journal with a pure Neumorphism aesthetic. All data lives in the browser (localStorage) — nothing leaves the device.

Note on stack: this project runs on React 19 + TanStack Start (Vite) rather than Next.js App Router. Everything requested is built the same way — single page, React, Tailwind v4, Lucide icons — just with TanStack's file-based routing instead of Next's. No backend needed.

## Design system

- Background `#e0e5ec`, all surfaces share the base color; depth comes only from shadows.
- Raised: light top-left `rgba(255,255,255,0.85)` + dark bottom-right `rgba(163,177,198,0.65)`, pronounced (not flat).
- Sunken/pressed: matching inset shadows for inputs, active toggles, logged slots, badges.
- Accents: Muted Indigo `#6C5CE7` (active), Muted Teal `#00B894` (success). Category colors: Focus = indigo, Admin = slate blue, Rest = teal, Wasted = soft coral.
- Inter, radius 16–24px, pill controls, 200ms ease transitions on every interactive state.

## Layout (single page)

1. **Header + quick audit bar** — raised header with date picker (prev/next day + calendar), a circular "Daily Discipline Score" gauge, and a sunken neumorphic toggle "Core Routine Maintained".
2. **Hourly Schedule Matrix** — scrollable 00:00–23:00 timeline. Each row: timestamp, neumorphic activity note field, category select pill (Focus Time / Admin / Rest / Unproductive), and an inset color-coded badge once categorized. Current hour is subtly highlighted.
3. **Analytics & Overview** — tabbed switch between Journal and Analytics. Stat cards: Productive vs Wasted hours (auto-computed), logged-hour count, and "Focus Consistency Streak" (consecutive days with the routine toggle checked). Soft neumorphic donut chart of time distribution by category, rendered as SVG with soft shadow rim and a center total.
4. **Footer actions** — raised tactile "Export JSON Backup" button (downloads all days), plus clear-day.

## Behavior

- Every keystroke/toggle autosaves to localStorage under one versioned key, debounced; day data keyed by `YYYY-MM-DD`.
- Discipline score = weighted mix of logged hours, focus share, and routine toggle.
- Streak walks back day-by-day from the selected date while the routine flag is true.
- Hydration-safe: localStorage read after mount so SSR doesn't mismatch.

## Mobile

Single-column stacking below `md`: hour rows become stacked (time + note on top, category pill below), stat cards stack vertically, donut centers full-width, header wraps with gauge and toggle side by side.

## Technical notes

- Rewrite `src/routes/index.tsx` as the app page with its own `head()` metadata (title/description/og/twitter).
- Add neumorphic tokens and `@utility neu-raised`, `neu-inset`, `neu-pressed`, `neu-flat` in `src/styles.css` (Tailwind v4 CSS-first), plus Inter via `<link>` in `__root.tsx`.
- Components under `src/components/journal/`: `HeaderBar`, `DisciplineGauge`, `RoutineToggle`, `HourRow`, `HourGrid`, `StatCard`, `CategoryDonut`, `AnalyticsPanel`.
- Storage + calculations in `src/lib/journal-storage.ts` and `src/lib/journal-metrics.ts`; a `useJournal` hook owns state.
- No database, no auth, no server functions — 100% client-side and private.
