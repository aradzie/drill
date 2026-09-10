import assert from "node:assert/strict";
import { mkdir, mkdtemp, readdir, readFile, rm, utimes, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";
import { buildServer } from "./server.ts";

test("HTTP commands persist before success, survive restart, and recover from storage errors", async (t) => {
  const directory = await mkdtemp(path.join(tmpdir(), "drill-server-"));
  const previousPath = process.env.DB_PATH;
  process.env.DB_PATH = path.join(directory, "reviews.jsonl");
  const filePath = process.env.DB_PATH;
  t.after(async () => {
    if (previousPath === undefined) delete process.env.DB_PATH;
    else process.env.DB_PATH = previousPath;
    await rm(directory, { recursive: true, force: true });
  });
  const first = await buildServer();
  t.after(() => first.close());
  assert.deepEqual((await first.inject({ method: "GET", url: "/api/events" })).json(), []);
  const command = { commandId: "start", problemId: "p", expectedCommandId: null, action: { type: "start" } };
  const accepted = await first.inject({ method: "POST", url: "/api/problem-commands", payload: command });
  assert.equal(accepted.statusCode, 201);
  const event = accepted.json().event;
  assert.deepEqual(
    (await readFile(filePath, "utf8"))
      .trimEnd()
      .split("\n")
      .map((line) => JSON.parse(line)),
    [["start", "p", new Date(event.occurredAt).toISOString(), "start"]],
  );
  await first.close();

  const restarted = await buildServer();
  t.after(() => restarted.close());
  assert.deepEqual((await restarted.inject({ method: "GET", url: "/api/events" })).json(), [event]);
  const duplicate = await restarted.inject({ method: "POST", url: "/api/problem-commands", payload: command });
  assert.equal(duplicate.statusCode, 200);
  assert.deepEqual(duplicate.json(), { outcome: "duplicate", event });
  const stale = await restarted.inject({
    method: "POST",
    url: "/api/problem-commands",
    payload: { ...command, commandId: "stale" },
  });
  assert.equal(stale.statusCode, 409);
  const invalid = await restarted.inject({ method: "POST", url: "/api/problem-commands", payload: {} });
  assert.equal(invalid.statusCode, 400);

  const numericToken = await restarted.inject({
    method: "POST",
    url: "/api/problem-commands",
    payload: { ...command, expectedCommandId: 1 },
  });
  assert.equal(numericToken.statusCode, 400);

  const saved = await readFile(filePath, "utf8");
  await rm(filePath);
  await mkdir(filePath);
  await utimes(filePath, 1000, 1000);
  const stop = { ...command, commandId: "stop", expectedCommandId: event.commandId, action: { type: "stop" } };
  const failed = await restarted.inject({ method: "POST", url: "/api/problem-commands", payload: stop });
  assert.equal(failed.statusCode, 500);
  assert.equal((await restarted.inject({ method: "GET", url: "/api/events" })).statusCode, 500);
  assert.deepEqual(await readdir(directory), ["reviews.jsonl"]);
  await rm(filePath, { recursive: true });
  await writeFile(filePath, saved);
  const retried = await restarted.inject({ method: "POST", url: "/api/problem-commands", payload: stop });
  assert.equal(retried.statusCode, 201);
  assert.equal(retried.json().event.commandId, stop.commandId);
  assert.equal(Object.hasOwn(retried.json().event, "id"), false);
  assert.deepEqual(
    (await readFile(filePath, "utf8"))
      .trimEnd()
      .split("\n")
      .map((line) => JSON.parse(line)),
    [
      ["start", "p", new Date(event.occurredAt).toISOString(), "start"],
      ["stop", "p", new Date(retried.json().event.occurredAt).toISOString(), "stop"],
    ],
  );
});
