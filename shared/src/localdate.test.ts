import assert from "node:assert/strict";
import { describe, it, mock } from "node:test";
import { LocalDate, LocalDateRange, Today, Yesterday } from "./localdate.ts";

describe("LocalDate", () => {
  it("normalizes timestamps to local midnight", () => {
    const date = new LocalDate(new Date(2026, 3, 17, 15, 45, 30, 123));

    assert.equal(date.year, 2026);
    assert.equal(date.month, 4);
    assert.equal(date.dayOfMonth, 17);
    assert.equal(date.dayOfWeek, 5);
    assert.equal(date.value, "2026-04-17");
    assert.equal(date.timestamp, new Date(2026, 3, 17).getTime());
    assert.equal(date.toString(), "2026-04-17");
    assert.equal(date.valueOf(), new Date(2026, 3, 17).getTime());
  });

  it("constructs from a timestamp without mutating a date input", () => {
    const input = new Date(2026, 3, 17, 15, 45, 30, 123);
    const timestamp = input.getTime();

    assert.equal(new LocalDate(timestamp).value, "2026-04-17");
    assert.equal(new LocalDate(input).value, "2026-04-17");
    assert.equal(input.getTime(), timestamp);
  });

  it("rejects invalid dates and constructor arguments", () => {
    assert.throws(() => new LocalDate(2026, 2, 29), RangeError);
    assert.throws(() => new LocalDate(2026, 4.5, 17), RangeError);
    assert.throws(() => new LocalDate(NaN), RangeError);
    assert.throws(() => new LocalDate(new Date("invalid")), RangeError);
    assert.throws(() => new LocalDate("2026-04-17" as unknown as number), TypeError);
  });

  it("can move forward and backward by whole days across calendar boundaries", () => {
    const date = new LocalDate(2026, 4, 17);

    assert.equal(date.plusDays(3).value, "2026-04-20");
    assert.equal(date.minusDays(7).value, "2026-04-10");
    assert.equal(new LocalDate(2024, 2, 28).plusDays(1).value, "2024-02-29");
    assert.equal(new LocalDate(2026, 12, 31).plusDays(1).value, "2027-01-01");
    assert.equal(new LocalDate(2026, 3, 29).plusDays(1).timestamp, new Date(2026, 2, 30).getTime());
    assert.throws(() => date.plusDays(1.5), RangeError);
    assert.throws(() => date.minusDays(NaN), RangeError);
  });

  it("uses the current timestamp in now", (t) => {
    const timestamp = new Date(2026, 3, 17, 15, 45, 30, 123).getTime();
    mock.method(Date, "now", () => timestamp);
    t.after(() => mock.restoreAll());

    assert.equal(LocalDate.now().value, "2026-04-17");
  });

  describe("startOfWeek", () => {
    // Week of 2026-04-13 (Mon) – 2026-04-19 (Sun)
    it("returns itself when called on a Monday", () => {
      assert.equal(new LocalDate(2026, 4, 13).startOfWeek().value, "2026-04-13");
    });

    it("returns the preceding Monday when called on a Tuesday", () => {
      assert.equal(new LocalDate(2026, 4, 14).startOfWeek().value, "2026-04-13");
    });

    it("returns the preceding Monday when called on a Wednesday", () => {
      assert.equal(new LocalDate(2026, 4, 15).startOfWeek().value, "2026-04-13");
    });

    it("returns the preceding Monday when called on a Thursday", () => {
      assert.equal(new LocalDate(2026, 4, 16).startOfWeek().value, "2026-04-13");
    });

    it("returns the preceding Monday when called on a Friday", () => {
      assert.equal(new LocalDate(2026, 4, 17).startOfWeek().value, "2026-04-13");
    });

    it("returns the preceding Monday when called on a Saturday", () => {
      assert.equal(new LocalDate(2026, 4, 18).startOfWeek().value, "2026-04-13");
    });

    it("returns the preceding Monday when called on a Sunday", () => {
      assert.equal(new LocalDate(2026, 4, 19).startOfWeek().value, "2026-04-13");
    });
  });
});

describe("LocalDateRange", () => {
  it("includes its start but excludes its end", () => {
    const from = new LocalDate(2026, 4, 17);
    const to = from.plusDays(2);
    const range = new LocalDateRange(from, to);

    assert.strictEqual(range.from, from);
    assert.strictEqual(range.to, to);
    assert.equal(range.includes(from.minusDays(1).timestamp), false);
    assert.equal(range.includes(from.timestamp), true);
    assert.equal(range.includes(from.plusDays(1).timestamp), true);
    assert.equal(range.includes(to.timestamp), false);
    assert.equal(range.toString(), "2026-04-17 - 2026-04-19");
  });
});

describe("relative local-date ranges", () => {
  it("creates today and yesterday relative to the supplied date", () => {
    const now = new LocalDate(2026, 4, 17);
    const today = new Today(now);
    const yesterday = new Yesterday(now);

    assert.equal(today.from.value, "2026-04-17");
    assert.equal(today.to.value, "2026-04-18");
    assert.equal(today.includes(now.timestamp), true);
    assert.equal(today.includes(today.to.timestamp), false);
    assert.equal(yesterday.from.value, "2026-04-16");
    assert.equal(yesterday.to.value, "2026-04-17");
    assert.equal(yesterday.includes(now.minusDays(1).timestamp), true);
    assert.equal(yesterday.includes(now.timestamp), false);
  });
});
