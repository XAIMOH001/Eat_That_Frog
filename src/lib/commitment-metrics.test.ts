import { describe, expect, it } from "bun:test";
import {
  bestCommitmentStreak,
  commitmentRate,
  commitmentStreak,
  recoveryCount,
} from "./commitment-metrics";
import { shiftKey } from "./journal-types";

const TODAY = "2026-08-19";
const back = (n: number) => shiftKey(TODAY, -n);

function run(from: number, to: number): string[] {
  const days: string[] = [];
  for (let n = from; n >= to; n -= 1) days.push(back(n));
  return days;
}

describe("commitmentStreak", () => {
  it("counts back from today when today is kept", () => {
    expect(commitmentStreak(new Set(run(2, 0)), TODAY)).toBe(3);
  });

  it("does not zero a live streak just because today is not logged yet", () => {
    expect(commitmentStreak(new Set(run(3, 1)), TODAY)).toBe(3);
  });

  it("is zero when neither today nor yesterday was kept", () => {
    expect(commitmentStreak(new Set(run(5, 2)), TODAY)).toBe(0);
  });

  it("is zero for a commitment with no check-ins", () => {
    expect(commitmentStreak(new Set(), TODAY)).toBe(0);
  });

  it("stops at the first gap rather than counting all kept days", () => {
    const days = new Set([...run(1, 0), ...run(6, 4)]);
    expect(commitmentStreak(days, TODAY)).toBe(2);
  });
});

describe("bestCommitmentStreak", () => {
  it("finds the longest run, not the most recent", () => {
    expect(bestCommitmentStreak([...run(20, 11), ...run(3, 0)])).toBe(10);
  });

  it("de-duplicates, so a Battle changeover day cannot inflate the run", () => {
    const withDuplicate = [...run(4, 0), back(2), back(2)];
    expect(bestCommitmentStreak(withDuplicate)).toBe(5);
  });

  it("is zero with no history", () => {
    expect(bestCommitmentStreak([])).toBe(0);
  });

  it("does not care what order the days arrive in", () => {
    expect(bestCommitmentStreak([back(0), back(2), back(1)])).toBe(3);
  });
});

describe("commitmentRate", () => {
  it("is the share of complete days kept", () => {
    const kept = new Set(run(10, 2));
    expect(commitmentRate(kept, back(10), back(1))).toBe(90);
  });

  it("is null when there is no complete day yet", () => {
    expect(commitmentRate(new Set(), TODAY, back(1))).toBeNull();
  });

  it("is 100 for a perfect window and 0 for an empty one", () => {
    expect(commitmentRate(new Set(run(4, 1)), back(4), back(1))).toBe(100);
    expect(commitmentRate(new Set(), back(4), back(1))).toBe(0);
  });

  it("ignores days outside the window", () => {
    const kept = new Set(run(40, 0));
    expect(commitmentRate(kept, back(4), back(1))).toBe(100);
  });
});

describe("recoveryCount", () => {
  it("is zero for one unbroken run — that is not a comeback", () => {
    expect(recoveryCount(run(5, 0))).toBe(0);
  });

  it("counts each return after a break", () => {
    expect(recoveryCount([...run(20, 15), ...run(10, 8), ...run(3, 0)])).toBe(2);
  });

  it("is zero with no history", () => {
    expect(recoveryCount([])).toBe(0);
  });

  it("survives duplicates from a changeover day", () => {
    expect(recoveryCount([...run(5, 4), back(4), ...run(1, 0)])).toBe(1);
  });
});
