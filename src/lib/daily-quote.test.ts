import { describe, expect, it } from "bun:test";
import { hashDateKey, quoteCount, quoteForDate } from "./daily-quote";

/** Consecutive YYYY-MM-DD keys, built without touching the ambient clock. */
function keys(count: number): string[] {
  const out: string[] = [];
  for (let i = 0; i < count; i += 1) {
    const d = new Date(2026, 0, 1 + i);
    const m = String(d.getMonth() + 1).padStart(2, "0");
    out.push(`${d.getFullYear()}-${m}-${String(d.getDate()).padStart(2, "0")}`);
  }
  return out;
}

describe("hashDateKey", () => {
  it("is deterministic", () => {
    expect(hashDateKey("2026-08-19")).toBe(hashDateKey("2026-08-19"));
  });

  it("stays an unsigned 32-bit integer", () => {
    for (const key of keys(40)) {
      const h = hashDateKey(key);
      expect(Number.isInteger(h)).toBe(true);
      expect(h).toBeGreaterThanOrEqual(0);
      expect(h).toBeLessThanOrEqual(0xffffffff);
    }
  });

  it("separates adjacent dates", () => {
    expect(hashDateKey("2026-08-19")).not.toBe(hashDateKey("2026-08-20"));
  });
});

describe("quoteForDate", () => {
  it("returns the same quote for the same date, every call", () => {
    const first = quoteForDate("2026-08-19");
    for (let i = 0; i < 5; i += 1) {
      expect(quoteForDate("2026-08-19")).toEqual(first);
    }
  });

  it("defaults to offset 0", () => {
    expect(quoteForDate("2026-08-19")).toEqual(quoteForDate("2026-08-19", 0));
  });

  it("spreads across the catalogue over a 60-day run", () => {
    const seen = new Set(keys(60).map((k) => quoteForDate(k).text));
    // Not an exact count — the hash is allowed to collide. This only guards against a
    // degenerate seed that pins every date to one or two quotes.
    expect(seen.size).toBeGreaterThanOrEqual(Math.ceil(quoteCount() / 2));
  });

  it("reaches every quote exactly once over a full offset cycle", () => {
    const cycle = Array.from({ length: quoteCount() }, (_, i) => quoteForDate("2026-08-19", i));
    expect(new Set(cycle.map((q) => q.text)).size).toBe(quoteCount());
  });

  it("wraps back to the start after a full cycle", () => {
    expect(quoteForDate("2026-08-19", quoteCount())).toEqual(quoteForDate("2026-08-19", 0));
    expect(quoteForDate("2026-08-19", quoteCount() * 3 + 2)).toEqual(quoteForDate("2026-08-19", 2));
  });

  it("normalises a negative offset into range", () => {
    expect(quoteForDate("2026-08-19", -1)).toEqual(quoteForDate("2026-08-19", quoteCount() - 1));
  });

  it("returns a populated quote for every offset", () => {
    for (let i = 0; i < quoteCount(); i += 1) {
      const q = quoteForDate("2026-08-19", i);
      expect(q.text.trim().length).toBeGreaterThan(0);
      expect(q.author.trim().length).toBeGreaterThan(0);
    }
  });
});
