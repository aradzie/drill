import assert from "node:assert/strict";
import { mkdir, mkdtemp, readdir, readFile, rm, symlink, utimes, writeFile } from "node:fs/promises";
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

test("serves rewritten problem images without exposing other files or external symlinks", async (t) => {
  const directory = await mkdtemp(path.join(tmpdir(), "drill-images-"));
  const outside = await mkdtemp(path.join(tmpdir(), "drill-outside-"));
  t.after(async () => {
    await rm(directory, { recursive: true, force: true });
    await rm(outside, { recursive: true, force: true });
  });
  await mkdir(path.join(directory, "calculus", "img"), { recursive: true });
  await writeFile(
    path.join(directory, "calculus", "example.note"),
    "!type: Problem\n!id: one\n!front: ![Figure](img/figure.png)\n!back: Answer\n~~~",
  );
  await writeFile(path.join(directory, "calculus", "img", "figure.png"), "image bytes");
  await writeFile(path.join(directory, "calculus", "img", "hidden.txt"), "private text");
  await writeFile(path.join(outside, "outside.png"), "outside image");
  await symlink(path.join(outside, "outside.png"), path.join(directory, "calculus", "img", "outside.png"));

  const app = await buildServer(directory);
  t.after(() => app.close());
  const catalog = await app.inject({ method: "GET", url: "/api/problems" });
  assert.equal(catalog.statusCode, 200);
  assert.equal(catalog.json()[0].body, "![Figure](/api/assets/calculus/img/figure.png)");

  const image = await app.inject({ method: "GET", url: "/api/assets/calculus/img/figure.png" });
  assert.equal(image.statusCode, 200);
  assert.equal(image.headers["content-type"], "image/png");
  assert.equal(image.body, "image bytes");
  await writeFile(path.join(directory, "calculus", "img", "new.svg"), '<svg xmlns="http://www.w3.org/2000/svg"/>');
  const svg = await app.inject({ method: "GET", url: "/api/assets/calculus/img/new.svg" });
  assert.equal(svg.statusCode, 200);
  assert.equal(svg.headers["content-security-policy"], "sandbox");
  assert.equal((await app.inject({ method: "GET", url: "/api/assets/calculus/img/hidden.txt" })).statusCode, 404);
  assert.equal((await app.inject({ method: "GET", url: "/api/assets/calculus/img/outside.png" })).statusCode, 404);
  assert.equal((await app.inject({ method: "GET", url: "/api/assets/../calculus/example.note" })).statusCode, 404);
});
