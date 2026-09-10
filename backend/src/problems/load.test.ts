import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";
import { ParseError } from "./error.ts";
import { loadProblems } from "./load.ts";

test("loads streamed notes and reports parser and validation errors", async (t) => {
  const directory = await mkdtemp(path.join(tmpdir(), "drill-notes-"));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const file = path.join(directory, "example.note");
  await writeFile(
    file,
    "!type: Problem\r\n!delete: old\r\n!id: one\r\n!front: Prompt\r\ncontinued\r\n!back: Answer\r\n~~~",
  );
  const loaded = await loadProblems([directory]);
  assert.deepEqual(loaded.errors, []);
  assert.deepEqual(loaded.problems, [
    { id: "one", deck: "Default", tags: [], body: "Prompt\ncontinued", answer: "Answer", hint: null },
  ]);

  await writeFile(file, "!type: Problem\n!id: one\n!ID: two\n!front: Prompt\n!back: Answer\n~~~\n");
  const invalid = await loadProblems([directory]);
  assert.deepEqual(invalid.errors, [new ParseError(file, 3, "Duplicate field 'id'.")]);
  assert.deepEqual(invalid.problems, []);

  await writeFile(file, "outside\n!type: Problem\n!type: Basic\n!front: Prompt");
  const malformed = await loadProblems([directory]);
  assert.deepEqual(malformed.errors, [
    new ParseError(file, 1, "Unexpected text outside a multiline field."),
    new ParseError(file, 3, "Duplicate property 'type'."),
    new ParseError(file, 5, "Unterminated note. Expected a closing '~~~' line."),
  ]);
  assert.deepEqual(malformed.problems, []);
});
