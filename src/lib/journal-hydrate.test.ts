import { describe, expect, it } from "bun:test";
import {
  hydrateJournal,
  type HourlyLogRow,
  type PlannedTaskRow,
  type RecordRow,
} from "./journal-hydrate";

const R1 = "11111111-1111-4111-8111-111111111111";
const R2 = "22222222-2222-4222-8222-222222222222";
const T1 = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const T2 = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";

function record(over: Partial<RecordRow> = {}): RecordRow {
  return {
    id: R1,
    date: "2026-08-19",
    coreRoutineMaintained: false,
    routineLockedAt: null,
    ...over,
  };
}

function log(over: Partial<HourlyLogRow> = {}): HourlyLogRow {
  return { dailyRecordId: R1, hourSlot: 9, note: "", category: null, taskId: null, ...over };
}

function task(over: Partial<PlannedTaskRow> = {}): PlannedTaskRow {
  return {
    id: T1,
    dailyRecordId: R1,
    priority: "A1",
    title: "Frog",
    completed: false,
    estimatedHours: 1,
    ...over,
  };
}

describe("hydrateJournal", () => {
  it("returns an empty v3 journal for no rows", () => {
    expect(hydrateJournal([], [], [])).toEqual({ version: 3, days: {}, tasks: {} });
  });

  it("keys days by date and hours by slot", () => {
    const data = hydrateJournal(
      [record()],
      [log({ hourSlot: 9, note: "deep work", category: "focus" })],
      [],
    );

    expect(Object.keys(data.days)).toEqual(["2026-08-19"]);
    expect(data.days["2026-08-19"]?.hours["9"]).toEqual({
      note: "deep work",
      category: "focus",
      taskId: null,
    });
  });

  it("creates a day entry even when it has no hours logged", () => {
    const data = hydrateJournal([record({ coreRoutineMaintained: true })], [], []);
    expect(data.days["2026-08-19"]).toEqual({
      hours: {},
      coreRoutineMaintained: true,
      routineLockedAt: null,
    });
  });

  it("converts routineLockedAt to an ISO string and leaves null alone", () => {
    const at = new Date("2026-08-19T06:30:00.000Z");
    const [held, unset] = [
      hydrateJournal([record({ routineLockedAt: at })], [], []),
      hydrateJournal([record({ routineLockedAt: null })], [], []),
    ];

    expect(held.days["2026-08-19"]?.routineLockedAt).toBe("2026-08-19T06:30:00.000Z");
    expect(unset.days["2026-08-19"]?.routineLockedAt).toBeNull();
  });

  it("drops an Invalid Date routineLockedAt rather than poisoning the lock window", () => {
    const data = hydrateJournal([record({ routineLockedAt: new Date("not a date") })], [], []);
    expect(data.days["2026-08-19"]?.routineLockedAt).toBeNull();
  });

  it("targets each task at its own record's date, not a single shared day", () => {
    const data = hydrateJournal(
      [record(), record({ id: R2, date: "2026-08-20" })],
      [],
      [task(), task({ id: T2, dailyRecordId: R2, priority: "B", title: "Tomorrow" })],
    );

    expect(data.tasks[T1]?.targetDate).toBe("2026-08-19");
    expect(data.tasks[T2]?.targetDate).toBe("2026-08-20");
  });

  it("skips rows whose record is outside the fetched window", () => {
    const data = hydrateJournal(
      [record()],
      [log({ dailyRecordId: R2, hourSlot: 3, note: "orphan" })],
      [task({ id: T2, dailyRecordId: R2 })],
    );

    expect(data.days["2026-08-19"]?.hours).toEqual({});
    expect(Object.keys(data.tasks)).toEqual([]);
  });

  it("recomputes actualHours from the log across every day in the window", () => {
    const data = hydrateJournal(
      [record(), record({ id: R2, date: "2026-08-20" })],
      [
        log({ hourSlot: 9, category: "focus", taskId: T1 }),
        log({ hourSlot: 10, category: "admin", taskId: T1 }),
        log({ dailyRecordId: R2, hourSlot: 11, category: "focus", taskId: T1 }),
        log({ hourSlot: 12, category: "rest", taskId: T1 }),
        log({ hourSlot: 13, category: "wasted", taskId: T1 }),
      ],
      [task()],
    );

    expect(data.tasks[T1]?.actualHours).toBe(3);
  });

  it("carries the persisted estimatedHours through instead of a fabricated 1", () => {
    const data = hydrateJournal([record()], [], [task({ estimatedHours: 7 })]);
    expect(data.tasks[T1]?.estimatedHours).toBe(7);
  });

  it("preserves an estimate of zero rather than falling back to a default", () => {
    const data = hydrateJournal([record()], [], [task({ estimatedHours: 0 })]);
    expect(data.tasks[T1]?.estimatedHours).toBe(0);
  });

  it("leaves actualHours at zero for a task no hour is tagged to", () => {
    const data = hydrateJournal([record()], [log({ hourSlot: 9, category: "focus" })], [task()]);
    expect(data.tasks[T1]?.actualHours).toBe(0);
  });
});
