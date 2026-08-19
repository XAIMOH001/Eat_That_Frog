import { describe, expect, it } from "bun:test";
import {
  isRoutineEditable,
  LOCKOUT_HOURS,
  routineState,
  routineStreak,
  type RoutineState,
} from "./routine-lock";
import { dateKey, emptyDay, shiftKey, type DayEntry, type JournalData } from "./journal-types";

// Dates are built with the local-time constructor because dateKey() reads local calendar
// fields — using UTC here would drift the key by a day in most timezones.
const AT = (h: number, min = 0) => new Date(2026, 7, 19, h, min, 0, 0);
const TODAY = dateKey(AT(12));

/** A day that was anchored at `h:min` local time on TODAY. */
function anchored(h: number, min = 0): DayEntry {
  return { ...emptyDay(), coreRoutineMaintained: true, routineLockedAt: AT(h, min).toISOString() };
}

function held(): DayEntry {
  return { ...emptyDay(), coreRoutineMaintained: true };
}

function journal(days: Record<string, DayEntry>): JournalData {
  return { version: 3, days, tasks: {} };
}

describe("LOCKOUT_HOURS", () => {
  it("is the 18 hours the confirmation copy promises", () => {
    expect(LOCKOUT_HOURS).toBe(18);
  });
});

describe("routineState", () => {
  it("reports a future day as future, anchored or not", () => {
    const key = shiftKey(TODAY, 1);
    expect(routineState(undefined, key, AT(12)).kind).toBe("future");
    expect(routineState(held(), key, AT(12)).kind).toBe("future");
  });

  it("reports an anchored past day as held", () => {
    expect(routineState(held(), shiftKey(TODAY, -1), AT(12)).kind).toBe("held");
  });

  it("reports an unanchored past day as failed", () => {
    expect(routineState(undefined, shiftKey(TODAY, -1), AT(12)).kind).toBe("failed");
    expect(routineState(emptyDay(), shiftKey(TODAY, -3), AT(12)).kind).toBe("failed");
  });

  it("reports today as open before anything is logged", () => {
    expect(routineState(undefined, TODAY, AT(12)).kind).toBe("open");
    expect(routineState(emptyDay(), TODAY, AT(12)).kind).toBe("open");
  });

  it("locks today once anchored", () => {
    const state = routineState(anchored(10), TODAY, AT(10, 1));
    expect(state.kind).toBe("locked");
  });

  it("holds the lock right up to the 18-hour mark", () => {
    // Anchored at 01:00, so the window elapses at 19:00 — inside the same calendar day, which
    // is the only case where the full 18 hours actually bites.
    expect(routineState(anchored(1), TODAY, AT(18, 59)).kind).toBe("locked");
  });

  it("reopens once the 18 hours have elapsed", () => {
    expect(routineState(anchored(1), TODAY, AT(19)).kind).toBe("reopened");
    expect(routineState(anchored(1), TODAY, AT(20)).kind).toBe("reopened");
  });

  it("caps the window at the end of the calendar day", () => {
    // 08:00 + 18h would be 02:00 tomorrow, but past days are read-only anyway, so the lock
    // stays shut for the rest of today rather than bleeding into tomorrow.
    const state = routineState(anchored(8), TODAY, AT(23, 58));
    expect(state.kind).toBe("locked");
    if (state.kind === "locked") {
      expect(state.until.getDate()).toBe(19);
      expect(state.until.getHours()).toBe(23);
    }
  });

  it("reports the capped deadline, not the raw 18-hour offset", () => {
    const state = routineState(anchored(8), TODAY, AT(12));
    expect(state.kind).toBe("locked");
    if (state.kind === "locked") {
      const raw = AT(8).getTime() + LOCKOUT_HOURS * 3_600_000;
      expect(state.until.getTime()).toBeLessThan(raw);
    }
  });

  it("degrades to reopened when the timestamp is missing or malformed", () => {
    expect(routineState(held(), TODAY, AT(12)).kind).toBe("reopened");
    const bad: DayEntry = { ...emptyDay(), coreRoutineMaintained: true, routineLockedAt: "nope" };
    expect(routineState(bad, TODAY, AT(12)).kind).toBe("reopened");
  });
});

describe("isRoutineEditable", () => {
  const cases: [RoutineState, boolean][] = [
    [{ kind: "open" }, true],
    [{ kind: "reopened" }, true],
    [{ kind: "locked", until: AT(20) }, false],
    [{ kind: "held" }, false],
    [{ kind: "failed" }, false],
    [{ kind: "future" }, false],
  ];

  for (const [state, expected] of cases) {
    it(`${expected ? "accepts" : "rejects"} input in ${state.kind}`, () => {
      expect(isRoutineEditable(state)).toBe(expected);
    });
  }
});

describe("routineStreak", () => {
  it("is zero with no history", () => {
    expect(routineStreak(journal({}), AT(12))).toBe(0);
  });

  it("counts today when today is anchored", () => {
    const days = {
      [TODAY]: anchored(9),
      [shiftKey(TODAY, -1)]: held(),
      [shiftKey(TODAY, -2)]: held(),
    };
    expect(routineStreak(journal(days), AT(12))).toBe(3);
  });

  it("does not zero a live streak just because today is unlogged", () => {
    // The grace rule: today can still be saved, so it reads the run through yesterday.
    const days = { [shiftKey(TODAY, -1)]: held(), [shiftKey(TODAY, -2)]: held() };
    expect(routineStreak(journal(days), AT(12))).toBe(2);
  });

  it("breaks on a missed past day", () => {
    const days = {
      [TODAY]: anchored(9),
      // yesterday missing — the run stops here
      [shiftKey(TODAY, -2)]: held(),
      [shiftKey(TODAY, -3)]: held(),
    };
    expect(routineStreak(journal(days), AT(12))).toBe(1);
  });

  it("stops at a day that exists but was never anchored", () => {
    const days = { [shiftKey(TODAY, -1)]: held(), [shiftKey(TODAY, -2)]: emptyDay() };
    expect(routineStreak(journal(days), AT(12))).toBe(1);
  });
});
