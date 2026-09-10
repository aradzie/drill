import assert from "node:assert/strict";
import { test, type TestContext } from "node:test";
import { watchToday } from "./watch-today.ts";

function setup(t: TestContext, now: string) {
  const timezone = process.env.TZ;
  process.env.TZ = "Europe/Warsaw";
  t.after(() => {
    if (timezone === undefined) delete process.env.TZ;
    else process.env.TZ = timezone;
  });
  t.mock.timers.enable({ apis: ["Date", "setTimeout"], now: new Date(now) });

  const window = new EventTarget();
  const document = Object.assign(new EventTarget(), { visibilityState: "visible" });
  const restoreGlobals: (() => void)[] = [];
  for (const [name, value] of Object.entries({ window, document })) {
    const previous = Object.getOwnPropertyDescriptor(globalThis, name);
    Object.defineProperty(globalThis, name, { configurable: true, value });
    restoreGlobals.push(() => {
      if (previous) Object.defineProperty(globalThis, name, previous);
      else Reflect.deleteProperty(globalThis, name);
    });
  }

  const dates: string[] = [];
  const stop = watchToday((today) => dates.push(today.value));
  t.after(() => {
    stop();
    for (const restore of restoreGlobals) restore();
  });
  return { window, document, dates, stop };
}

test("refreshes at local midnight and schedules the following midnight", (t) => {
  const { dates } = setup(t, "2026-09-21T23:59:59+02:00");
  assert.deepEqual(dates, ["2026-09-21"]);
  t.mock.timers.tick(999);
  assert.equal(dates.length, 1);
  t.mock.timers.tick(1);
  assert.deepEqual(dates, ["2026-09-21", "2026-09-22"]);
  t.mock.timers.tick(24 * 60 * 60 * 1000);
  assert.deepEqual(dates, ["2026-09-21", "2026-09-22", "2026-09-23"]);
});

for (const { now, hours, next } of [
  { now: "2026-03-29T00:00:00+01:00", hours: 23, next: "2026-03-30" },
  { now: "2026-10-25T00:00:00+02:00", hours: 25, next: "2026-10-26" },
]) {
  test(`refreshes after a ${hours}-hour local day`, (t) => {
    const { dates } = setup(t, now);
    t.mock.timers.tick(hours * 60 * 60 * 1000 - 1);
    assert.equal(dates.length, 1);
    t.mock.timers.tick(1);
    assert.equal(dates.at(-1), next);
    assert.equal(dates.length, 2);
  });
}

test("catches up on focus and visibility, and removes timers and listeners on cleanup", (t) => {
  const { window, document, dates, stop } = setup(t, "2026-09-21T12:00:00+02:00");
  // Advance the clock without running timers, as with a suspended tab.
  t.mock.timers.setTime(new Date("2026-09-23T12:00:00+02:00").getTime());
  window.dispatchEvent(new Event("focus"));
  assert.equal(dates.at(-1), "2026-09-23");

  t.mock.timers.setTime(new Date("2026-09-24T12:00:00+02:00").getTime());
  document.visibilityState = "hidden";
  document.dispatchEvent(new Event("visibilitychange"));
  assert.equal(dates.length, 2);
  document.visibilityState = "visible";
  document.dispatchEvent(new Event("visibilitychange"));
  assert.equal(dates.at(-1), "2026-09-24");

  t.mock.timers.tick(12 * 60 * 60 * 1000);
  assert.deepEqual(dates, ["2026-09-21", "2026-09-23", "2026-09-24", "2026-09-25"]);
  stop();
  window.dispatchEvent(new Event("focus"));
  document.dispatchEvent(new Event("visibilitychange"));
  t.mock.timers.tick(24 * 60 * 60 * 1000);
  assert.equal(dates.length, 4);
});
