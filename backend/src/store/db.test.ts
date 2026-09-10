import assert from "node:assert/strict";
import { mkdir, mkdtemp, readdir, readFile, rm, utimes, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { test, type TestContext } from "node:test";
import type { ProblemEvent } from "shared";
import { ETag } from "../io/etag.ts";
import { Db } from "./db.ts";

async function fixture(t: TestContext) {
  const directory = await mkdtemp(path.join(tmpdir(), "drill-db-"));
  t.after(() => rm(directory, { recursive: true, force: true }));
  return { directory, filePath: path.join(directory, "reviews.jsonl") };
}

const start = { commandId: "start", problemId: "p1", occurredAt: 1000, type: "start" } as const;

test("missing database starts empty; save creates parent directories and an empty JSONL file", async (t) => {
  const { directory } = await fixture(t);
  const filePath = path.join(directory, "nested", "reviews.jsonl");
  const db = Db.open(filePath);
  assert.deepEqual(await db.events(), []);
  await db.save();
  assert.equal(await readFile(filePath, "utf8"), "");
  assert.deepEqual(await Db.open(filePath).events(), []);
});

test("all event types round-trip numeric timestamps through UTC strings", async (t) => {
  const { directory, filePath } = await fixture(t);
  const db = Db.open(filePath);
  await db.append(start);
  await db.append({ ...start, commandId: "stop", type: "stop", occurredAt: 900 });
  await db.append({ ...start, commandId: "review", type: "review", grade: "good" });
  await db.append({ ...start, commandId: "easy", type: "review", grade: "easy" });
  const reopened = Db.open(filePath);
  assert.deepEqual(await reopened.events(), await db.events());
  const rows = [
    ["start", "p1", "1970-01-01T00:00:01.000Z", "start"],
    ["stop", "p1", "1970-01-01T00:00:00.900Z", "stop"],
    ["review", "p1", "1970-01-01T00:00:01.000Z", "review", "good"],
    ["easy", "p1", "1970-01-01T00:00:01.000Z", "review", "easy"],
  ];
  const contents = await readFile(filePath, "utf8");
  assert.deepEqual(
    contents
      .trimEnd()
      .split("\n")
      .map((line) => JSON.parse(line)),
    rows,
  );
  assert.equal(contents.trim().split("\n").length, rows.length);
  assert.deepEqual(await readdir(directory), ["reviews.jsonl"]);
  assert.deepEqual(await reopened.append({ ...start, commandId: "next" }), { ...start, commandId: "next" });
});

test("load and subsequent inserts preserve line order regardless of command ids or timestamps", async (t) => {
  const { filePath } = await fixture(t);
  const history = [
    { ...start, commandId: "z-first" },
    { ...start, commandId: "a-second", occurredAt: 900 },
  ];
  await writeFile(
    filePath,
    '["z-first","p1","1970-01-01T00:00:01.000Z","start"]\n["a-second","p1","1970-01-01T00:00:00.900Z","start"]\n',
  );
  const db = Db.open(filePath);
  assert.deepEqual(await db.events(), history);
  const next = await db.append({ ...start, commandId: "m-third", occurredAt: 900 });
  assert.deepEqual(await Db.open(filePath).events(), [...history, next]);
  assert.deepEqual(
    (await readFile(filePath, "utf8"))
      .trimEnd()
      .split("\n")
      .map((line) => JSON.parse(line)),
    [
      ["z-first", "p1", "1970-01-01T00:00:01.000Z", "start"],
      ["a-second", "p1", "1970-01-01T00:00:00.900Z", "start"],
      ["m-third", "p1", "1970-01-01T00:00:00.900Z", "start"],
    ],
  );
});

test("overlapping inserts and saves do not lose events or expose uncommitted data", async (t) => {
  const { filePath } = await fixture(t);
  const db = Db.open(filePath);
  const first = db.append(start);
  assert.deepEqual(await db.events(), [start]);
  const writes = Array.from({ length: 20 }, (_, i) => db.append({ ...start, commandId: `cmd-${i}` }));
  await Promise.all([first, ...writes, db.save()]);
  const stored = await Db.open(filePath).events();
  assert.equal(stored.length, 21);
  assert.deepEqual(
    stored.map((event) => event.commandId),
    ["start", ...Array.from({ length: 20 }, (_, i) => `cmd-${i}`)],
  );
});

test("read failures propagate and allow retry after the file is restored", async (t) => {
  const { directory, filePath } = await fixture(t);
  const db = Db.open(filePath);
  await db.append(start);
  const saved = await readFile(filePath, "utf8");
  // A directory in place of the destination makes refreshing fail.
  await rm(filePath);
  await mkdir(filePath);
  await utimes(filePath, 1000, 1000);
  await assert.rejects(db.append({ ...start, commandId: "retry" }));
  await assert.rejects(db.events());
  assert.deepEqual(await readdir(directory), ["reviews.jsonl"]);
  await rm(filePath, { recursive: true });
  await writeFile(filePath, saved);
  assert.deepEqual(await db.append({ ...start, commandId: "retry" }), { ...start, commandId: "retry" });
  assert.deepEqual(await Db.open(filePath).events(), await db.events());
});

test("malformed files are rejected on first read without being overwritten", async (t) => {
  const { filePath } = await fixture(t);
  const row = ["start", "p1", "1970-01-01T00:00:01.000Z", "start"];
  const invalid = [
    "{",
    "null",
    "{}",
    JSON.stringify(start),
    JSON.stringify([]),
    JSON.stringify([row]),
    JSON.stringify(row.slice(0, 3)),
    JSON.stringify([...row, "extra"]),
    JSON.stringify([...row, null, null]),
    JSON.stringify(["review", "p1", "1970-01-01T00:00:01.000Z", "review"]),
    JSON.stringify(["review", "p1", "1970-01-01T00:00:01.000Z", "review", "good", null]),
    JSON.stringify(["review", "p1", "1970-01-01T00:00:01.000Z", "review", "good", "unexpected"]),
    JSON.stringify(["review", "p1", "1970-01-01T00:00:01.000Z", "review", "good", null, "extra"]),
    JSON.stringify([null, "p1", "1970-01-01T00:00:01.000Z", "start"]),
    JSON.stringify(["start", null, "1970-01-01T00:00:01.000Z", "start"]),
    JSON.stringify(["start", "p1", "invalid", "start"]),
    JSON.stringify(["start", "p1", 1000, "start"]),
    JSON.stringify(["start", "p1", null, "start"]),
    JSON.stringify(["start", "p1", "1970-01-01T00:00:01.000Z", "unknown", null, null]),
    JSON.stringify(["start", "p1", "1970-01-01T00:00:01.000Z", "start", "good", null]),
    JSON.stringify(["start", "p1", "1970-01-01T00:00:01.000Z", "stop", null, "unexpected"]),
    JSON.stringify(["review", "p1", "1970-01-01T00:00:01.000Z", "review", "invalid"]),
    JSON.stringify(["review", "p1", "1970-01-01T00:00:01.000Z", "review", null]),
    JSON.stringify(["review", "p1", "1970-01-01T00:00:01.000Z", "review", "good", 1]),
    `${JSON.stringify(row)},`,
  ];
  for (const contents of invalid) {
    await writeFile(filePath, contents);
    await assert.rejects(Db.open(filePath).events(), { message: `Invalid JSONL database at ${filePath}:1` });
    assert.equal(await readFile(filePath, "utf8"), contents);
  }
});

test("I/O errors are deferred until first read and are not treated as an empty database", async (t) => {
  const { directory } = await fixture(t);
  await assert.rejects(Db.open(directory).events());
});

test("duplicate inserts preserve the last saved history", async (t) => {
  const { filePath } = await fixture(t);
  const db = Db.open(filePath);
  await db.append(start);
  const saved = await readFile(filePath, "utf8");
  await assert.rejects(db.append(start), /duplicate command id/);
  assert.equal(await readFile(filePath, "utf8"), saved);
  assert.equal((await db.events()).length, 1);
});

test("returned event arrays cannot mutate stored history", async () => {
  const db = Db.open(":memory:");
  await db.append(start);
  const events = (await db.events()) as ProblemEvent[];
  events.pop();
  assert.deepEqual(await db.events(), [start]);
  await db.save();
  assert.deepEqual(await Db.open(":memory:").events(), []);
});

test("five-column review rows preserve all grades", async (t) => {
  const { filePath } = await fixture(t);
  const rows = [
    ["fail", "p1", "1970-01-01T00:00:01.000Z", "review", "fail"],
    ["very-hard", "p1", "1970-01-01T00:00:01.000Z", "review", "very_hard"],
    ["hard", "p1", "1970-01-01T00:00:01.000Z", "review", "hard"],
    ["good", "p1", "1970-01-01T00:00:01.000Z", "review", "good"],
    ["easy", "p1", "1970-01-01T00:00:01.000Z", "review", "easy"],
  ];
  await writeFile(filePath, rows.map((row) => JSON.stringify(row)).join("\n") + "\n");
  const db = Db.open(filePath);
  assert.deepEqual(await db.events(), [
    { commandId: "fail", problemId: "p1", occurredAt: 1000, type: "review", grade: "fail" },
    { commandId: "very-hard", problemId: "p1", occurredAt: 1000, type: "review", grade: "very_hard" },
    { commandId: "hard", problemId: "p1", occurredAt: 1000, type: "review", grade: "hard" },
    { commandId: "good", problemId: "p1", occurredAt: 1000, type: "review", grade: "good" },
    { commandId: "easy", problemId: "p1", occurredAt: 1000, type: "review", grade: "easy" },
  ]);
  await db.save();
  assert.deepEqual(
    (await readFile(filePath, "utf8"))
      .trimEnd()
      .split("\n")
      .map((line) => JSON.parse(line)),
    rows,
  );
});

const startRow = '["start","p1","1970-01-01T00:00:01.000Z","start"]\n';
const stopRow = '["stop","p1","1970-01-01T00:00:02.000Z","stop"]\n';
const stop = { commandId: "stop", problemId: "p1", occurredAt: 2000, type: "stop" } as const;

async function replaceHistory(filePath: string, contents: string, seconds: number) {
  await writeFile(filePath, contents);
  await utimes(filePath, seconds, seconds);
}

test("reads reuse the snapshot until the ETag changes, including to an older timestamp", async (t) => {
  const { filePath } = await fixture(t);
  await replaceHistory(filePath, startRow, 2000);
  const db = Db.open(filePath);
  const first = await db.events();
  assert.equal((await db.events())[0], first[0]);

  // Content changes preserving both mtime and size do not invalidate the cache.
  const changedRow = startRow.replace('"p1"', '"p2"');
  await replaceHistory(filePath, changedRow, 2000);
  assert.equal((await db.events())[0], first[0]);
  await utimes(filePath, 1000, 1000);
  assert.deepEqual(await db.events(), [{ ...start, problemId: "p2" }]);
});

test("reads reload when size changes without an mtime change", async (t) => {
  const { filePath } = await fixture(t);
  await replaceHistory(filePath, startRow, 1000);
  const db = Db.open(filePath);
  assert.deepEqual(await db.events(), [start]);
  await replaceHistory(filePath, startRow + stopRow, 1000);
  assert.deepEqual(await db.events(), [start, stop]);
});

test("reads notice external creation, deletion, and recreation", async (t) => {
  const { filePath } = await fixture(t);
  const db = Db.open(filePath);
  assert.deepEqual(await db.events(), []);
  await replaceHistory(filePath, startRow, 1000);
  assert.deepEqual(await db.events(), [start]);
  await rm(filePath);
  assert.deepEqual(await db.events(), []);
  await replaceHistory(filePath, stopRow, 1000);
  assert.deepEqual(await db.events(), [stop]);
});

test("append and save refresh external history and install their own snapshots", async (t) => {
  const { filePath } = await fixture(t);
  const db = Db.open(filePath);
  await replaceHistory(filePath, startRow, 1000);
  await assert.rejects(db.append(start), /duplicate command id/);
  const appended = await db.append(stop);
  const history = await db.events();
  assert.deepEqual(history, [start, stop]);
  assert.equal(history[1], appended);
  assert.equal(await readFile(filePath, "utf8"), startRow + stopRow);

  await replaceHistory(filePath, stopRow, 2000);
  await db.save();
  assert.equal(await readFile(filePath, "utf8"), stopRow);
  assert.deepEqual(await db.events(), [stop]);
});

test("malformed external edits are cached as errors and block writes until the ETag changes", async (t) => {
  const { filePath } = await fixture(t);
  await replaceHistory(filePath, startRow, 1000);
  const db = Db.open(filePath);
  await replaceHistory(filePath, startRow + "{", 2000);
  let error: unknown;
  await assert.rejects(db.events(), (caught) => {
    error = caught;
    return caught instanceof Error && caught.message === `Invalid JSONL database at ${filePath}:2`;
  });
  await assert.rejects(db.events(), (caught) => caught === error);
  await assert.rejects(db.append(stop), (caught) => caught === error);
  await assert.rejects(db.save(), (caught) => caught === error);
  assert.equal(await readFile(filePath, "utf8"), startRow + "{");
  await replaceHistory(filePath, startRow + stopRow, 2000);
  assert.deepEqual(await db.events(), [start, stop]);
});

test("failed atomic replacement preserves the snapshot and removes the temporary file", async (t) => {
  const { directory, filePath } = await fixture(t);
  await replaceHistory(filePath, startRow, 1000);
  const db = Db.open(filePath);
  const history = await db.events();
  const etag = await ETag.read(filePath);
  // Replace the destination after checking its metadata, making rename fail.
  t.mock.method(
    ETag,
    "read",
    async (checkedPath: string) => {
      assert.equal(checkedPath, filePath);
      await rm(filePath);
      await mkdir(filePath);
      return etag;
    },
    { times: 1 },
  );
  await assert.rejects(db.append(stop));
  assert.deepEqual(await readdir(directory), ["reviews.jsonl"]);
  await rm(filePath, { recursive: true });
  await replaceHistory(filePath, startRow, 1000);
  assert.equal((await db.events())[0], history[0]);
  await db.append(stop);
  assert.deepEqual(await db.events(), [start, stop]);
});

test("opening a database defers loading history until the first read", async (t) => {
  const { filePath } = await fixture(t);
  await replaceHistory(filePath, startRow, 1000);
  const db = Db.open(filePath);
  // Keeping mtime and size unchanged distinguishes lazy loading from a startup snapshot.
  await replaceHistory(filePath, startRow.replace('"p1"', '"p2"'), 1000);
  assert.deepEqual(await db.events(), [{ ...start, problemId: "p2" }]);
});
