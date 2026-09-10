import assert from "node:assert/strict";
import { mkdtemp, rm, utimes, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";
import { CommandError } from "shared";
import { Db } from "./db.ts";
import { EventStore } from "./events.ts";

test("start saves the returned event in the store", async () => {
  const store = new EventStore(Db.open(":memory:"));
  const result = await store.processCommand({
    commandId: "start",
    problemId: "p1",
    expectedCommandId: null,
    action: { type: "start" },
  });
  assert.equal(result.outcome, "appended");
  assert.deepEqual(await store.events(), [result.event]);
});

test("starting an already-open problem is a noop with no new event", async () => {
  const store = new EventStore(Db.open(":memory:"));
  const first = await store.processCommand({
    commandId: "start",
    problemId: "p2",
    expectedCommandId: null,
    action: { type: "start" },
  });
  assert.equal(first.outcome, "appended");
  const second = await store.processCommand({
    commandId: "start-again",
    problemId: "p2",
    expectedCommandId: "start",
    action: { type: "start" },
  });
  assert.equal(second.outcome, "unchanged");
  assert.equal((await store.events()).length, 1);
});

test("reads preserve acceptance order rather than command id order", async () => {
  const store = new EventStore(Db.open(":memory:"));
  await store.processCommand({
    commandId: "z-start",
    problemId: "p7",
    expectedCommandId: null,
    action: { type: "start" },
  });
  await store.processCommand({
    commandId: "a-stop",
    problemId: "p7",
    expectedCommandId: "z-start",
    action: { type: "stop" },
  });
  assert.deepEqual(
    (await store.events()).map((event) => event.commandId),
    ["z-start", "a-stop"],
  );
});

test("simultaneous retries append exactly one event", async () => {
  const store = new EventStore(Db.open(":memory:"));
  const command = {
    commandId: "same",
    problemId: "p",
    expectedCommandId: null,
    action: { type: "start" },
  } as const;
  const results = await Promise.all([store.processCommand(command), store.processCommand(command)]);
  assert.deepEqual(
    results.map((result) => result.outcome),
    ["appended", "duplicate"],
  );
  assert.equal((await store.events()).length, 1);
});

test("concurrent commands against the same state conflict and the queue recovers", async () => {
  const store = new EventStore(Db.open(":memory:"));
  const command = {
    commandId: "first",
    problemId: "p",
    expectedCommandId: null,
    action: { type: "review", grade: "good" },
  } as const;
  const results = await Promise.allSettled([
    store.processCommand(command),
    store.processCommand({ ...command, commandId: "second" }),
  ]);
  assert.equal(results[0].status, "fulfilled");
  assert.equal(results[1].status, "rejected");
  assert.ok(
    results[1].status === "rejected" &&
      results[1].reason instanceof CommandError &&
      results[1].reason.code === "conflict",
  );
  assert.equal((await store.events()).length, 1);
  const next = await store.processCommand({ ...command, commandId: "third", expectedCommandId: "first" });
  assert.equal(next.outcome, "appended");
});

test("commands and reads use externally changed history", async (t) => {
  const directory = await mkdtemp(path.join(tmpdir(), "drill-events-"));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const filePath = path.join(directory, "reviews.jsonl");
  const store = new EventStore(Db.open(filePath));
  const command = {
    commandId: "start",
    problemId: "p1",
    expectedCommandId: null,
    action: { type: "start" },
  } as const;
  const event = { commandId: "start", problemId: "p1", occurredAt: 1000, type: "start" } as const;
  await writeFile(filePath, '["start","p1","1970-01-01T00:00:01.000Z","start"]\n');
  await utimes(filePath, 1000, 1000);
  assert.deepEqual(await store.processCommand(command), { outcome: "duplicate", event });
  assert.deepEqual(await store.events(), [event]);
  await assert.rejects(store.processCommand({ ...command, commandId: "stale" }), {
    code: "conflict",
  });
  const result = await store.processCommand({
    ...command,
    commandId: "stop",
    expectedCommandId: "start",
    action: { type: "stop" },
  });
  assert.equal(result.outcome, "appended");
  assert.deepEqual(await store.events(), [event, result.event]);
});
