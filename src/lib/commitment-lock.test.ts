import { describe, expect, it } from "bun:test";
import {
  canCheckIn,
  commitmentState,
  commitmentStateLabel,
  MIN_GAP_HOURS,
  type CommitmentSnapshot,
} from "./commitment-lock";
import { dateKey, shiftKey } from "./journal-types";

const AT = (h: number, min = 0) => new Date(2026, 7, 19, h, min, 0, 0);
const TODAY = dateKey(AT(12));
const YESTERDAY = shiftKey(TODAY, -1);

function snap(over: Partial<CommitmentSnapshot> = {}): CommitmentSnapshot {
  return {
    status: "active",
    startedOn: shiftKey(TODAY, -30),
    lastKeptOn: null,
    lastCheckedInAt: null,
    ...over,
  };
}

describe("MIN_GAP_HOURS", () => {
  it("is the 18 hours the card's copy promises", () => {
    expect(MIN_GAP_HOURS).toBe(18);
  });
});

describe("commitmentState", () => {
  it("is 'none' without a commitment, so the card can offer set-up", () => {
    expect(commitmentState(null, TODAY, AT(12))).toEqual({ kind: "none" });
  });

  it("is 'paused' regardless of the clock", () => {
    expect(commitmentState(snap({ status: "paused" }), TODAY, AT(3))).toEqual({ kind: "paused" });
  });

  it("is open on the first ever day, with no previous check-in to space from", () => {
    expect(commitmentState(snap(), TODAY, AT(0, 1))).toEqual({ kind: "open" });
  });

  it("is 'kept' once today is logged", () => {
    const state = commitmentState(
      snap({ lastKeptOn: TODAY, lastCheckedInAt: AT(9).toISOString() }),
      TODAY,
      AT(10),
    );
    expect(state.kind).toBe("kept");
  });

  it("opens again at midnight when yesterday's check-in was early enough", () => {
    const s = snap({
      lastKeptOn: YESTERDAY,
      lastCheckedInAt: new Date(2026, 7, 18, 4).toISOString(),
    });
    expect(commitmentState(s, TODAY, AT(0, 1))).toEqual({ kind: "open" });
  });

  it("holds the window shut when the 18 hours have not elapsed", () => {
    const s = snap({
      lastKeptOn: YESTERDAY,
      lastCheckedInAt: new Date(2026, 7, 18, 23).toISOString(),
    });
    const state = commitmentState(s, TODAY, AT(12));
    expect(state.kind).toBe("waiting");
    if (state.kind !== "waiting") throw new Error("unreachable");
    expect(state.opensAt.getHours()).toBe(17);
  });

  it("opens once those 18 hours have elapsed", () => {
    const s = snap({
      lastKeptOn: YESTERDAY,
      lastCheckedInAt: new Date(2026, 7, 18, 23).toISOString(),
    });
    expect(commitmentState(s, TODAY, AT(17, 1))).toEqual({ kind: "open" });
  });

  it("never makes a day unreachable: for any check-in hour, the window opens before midnight", () => {
    for (let h = 0; h < 24; h += 1) {
      const s = snap({
        lastKeptOn: YESTERDAY,
        lastCheckedInAt: new Date(2026, 7, 18, h).toISOString(),
      });
      const state = commitmentState(s, TODAY, AT(23, 59));
      expect(state.kind).toBe("open");
    }
  });

  it("closes the midnight straddle: 23:50 then 00:05 is not two check-ins", () => {
    const keptLate = snap({
      lastKeptOn: YESTERDAY,
      lastCheckedInAt: new Date(2026, 7, 18, 23, 50).toISOString(),
    });
    expect(commitmentState(keptLate, TODAY, AT(0, 5)).kind).toBe("waiting");
  });

  it("treats an unparseable timestamp as no constraint rather than locking the user out", () => {
    const s = snap({ lastKeptOn: YESTERDAY, lastCheckedInAt: "not a date" });
    expect(commitmentState(s, TODAY, AT(0, 1))).toEqual({ kind: "open" });
  });

  it("waits when today precedes the start date", () => {
    const s = snap({ startedOn: shiftKey(TODAY, 3) });
    expect(commitmentState(s, TODAY, AT(12)).kind).toBe("waiting");
  });
});

describe("canCheckIn", () => {
  it("is true only for 'open'", () => {
    expect(canCheckIn({ kind: "open" })).toBe(true);
    expect(canCheckIn({ kind: "none" })).toBe(false);
    expect(canCheckIn({ kind: "paused" })).toBe(false);
    expect(canCheckIn({ kind: "kept", nextOpensAt: AT(23) })).toBe(false);
    expect(canCheckIn({ kind: "waiting", opensAt: AT(17) })).toBe(false);
  });
});

describe("commitmentStateLabel", () => {
  it("never names a behaviour — the whole point of the feature", () => {
    const labels = [
      commitmentStateLabel({ kind: "none" }),
      commitmentStateLabel({ kind: "open" }),
      commitmentStateLabel({ kind: "kept", nextOpensAt: AT(23) }),
      commitmentStateLabel({ kind: "waiting", opensAt: AT(17) }),
      commitmentStateLabel({ kind: "paused" }),
    ];
    for (const label of labels) {
      expect(label).not.toMatch(/porn|masturb|social|smok|gam|food|scroll|procrast/i);
    }
  });
});
