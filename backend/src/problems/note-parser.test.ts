import assert from "node:assert/strict";
import { test } from "node:test";
import { ParseError } from "./error.ts";
import { NoteParser } from "./note-parser.ts";
import { LoadState } from "./state.ts";

function parseNotes(path: string, text: string): LoadState {
  const state = new LoadState();
  new NoteParser(state, path).parse(text);
  return state;
}

test("parses inherited properties and multiline fields", () => {
  const text = [
    "!type: Math Problem",
    "!deck: Math Problems",
    "!tags: Problem   Integral",
    "",
    "!id: first",
    "!front: First line",
    "second line",
    "!back: Answer",
    "~~~",
    "",
    "!id: second",
    "!front: Prompt",
    "!back:",
    "First answer line",
    "Second answer line",
    "~~~",
    "",
  ].join("\n");
  const state = parseNotes("example.note", text);

  assert.deepEqual(state.errors, []);
  assert.deepEqual(state.notes, [
    {
      path: "example.note",
      line: 5,
      type: "Math Problem",
      deck: "Math Problems",
      tags: "Problem Integral",
      fields: [
        { path: "example.note", line: 5, name: "id", value: "first" },
        { path: "example.note", line: 6, name: "front", value: "First line\nsecond line" },
        { path: "example.note", line: 8, name: "back", value: "Answer" },
      ],
    },
    {
      path: "example.note",
      line: 11,
      type: "Math Problem",
      deck: "Math Problems",
      tags: "Problem Integral",
      fields: [
        { path: "example.note", line: 11, name: "id", value: "second" },
        { path: "example.note", line: 12, name: "front", value: "Prompt" },
        { path: "example.note", line: 13, name: "back", value: "First answer line\nSecond answer line" },
      ],
    },
  ]);
});

test("preserves duplicate fields for validation", () => {
  const state = parseNotes("example.note", "!id: one\n!ID: two\n~~~\n");
  assert.deepEqual(state.errors, []);
  assert.deepEqual(state.notes[0].fields, [
    { path: "example.note", line: 1, name: "id", value: "one" },
    { path: "example.note", line: 2, name: "id", value: "two" },
  ]);
});

test("resumes at every line boundary with independent parser instances", async () => {
  const lines = ["!type: Problem", "!deck: Math", "!front: First", "continued", "~~~", "!front: Second", "~~~"];
  const expected = parseNotes("example.note", lines.join("\n"));
  assert.deepEqual(expected.errors, []);
  for (let split = 0; split <= lines.length; split += 1) {
    const state = new LoadState();
    const parser = new NoteParser(state, "example.note");
    for (const line of lines.slice(0, split)) {
      parser.push(line);
    }
    assert.equal(state.notes.length, split < 5 ? 0 : split < 7 ? 1 : 2);
    assert.deepEqual(state.errors, []);
    await Promise.resolve();
    const other = parseNotes("other.note", "~~~");
    assert.deepEqual(other.errors, []);
    assert.equal(other.notes[0].type, "Basic");
    for (const line of lines.slice(split)) {
      parser.push(line);
    }
    parser.finish();
    assert.deepEqual(state.errors, []);
    assert.deepEqual(state.notes, expected.notes);
  }
});

test("collects errors and recovers at fields and note boundaries", () => {
  const state = new LoadState();
  const parser = new NoteParser(state, "example.note");
  for (const line of [
    "outside",
    "!type: Problem",
    "!type: Basic",
    "!front: Prompt",
    "!type: Basic",
    "!deck: Late",
    "not field content",
    "!delete: old",
    "!back: Answer",
    "~~~",
    "!front: Next",
    "~~~",
  ]) {
    parser.push(line);
  }
  parser.finish();
  assert.deepEqual(state.errors, [
    new ParseError("example.note", 1, "Unexpected text outside a multiline field."),
    new ParseError("example.note", 3, "Duplicate property 'type'."),
    new ParseError("example.note", 5, "Duplicate property 'type'."),
    new ParseError("example.note", 6, "Unexpected property 'deck'."),
    new ParseError("example.note", 7, "Unexpected text outside a multiline field."),
    new ParseError("example.note", 8, "'delete' is a reserved field name."),
  ]);
  assert.equal(state.notes.length, 2);
  assert.equal(state.notes[0].fields[0].value, "Prompt");
  assert.equal(state.notes[1].type, "Problem");
});

test("ignores tombstones including empty IDs and directives among properties", () => {
  const tombstones = parseNotes("example.note", "!delete: old\n!DELETE:\n");
  assert.deepEqual(tombstones.errors, []);
  assert.deepEqual(tombstones.notes, []);
  const state = parseNotes(
    "example.note",
    [
      "!type: Problem",
      "!delete: old",
      "!deck: Math",
      "!front: Prompt",
      "~~~",
      "!delete: another",
      "!front: Next",
      "~~~",
    ].join("\n"),
  );
  assert.deepEqual(state.errors, []);
  assert.equal(state.notes.length, 2);
  assert.deepEqual(
    state.notes.map((note) => [note.line, note.type, note.deck, note.fields.length]),
    [
      [4, "Problem", "Math", 1],
      [7, "Problem", "Math", 1],
    ],
  );
});

test("normalizes names and properties while preserving multiline indentation and blank lines", () => {
  const state = parseNotes(
    "example.note",
    [
      "!TYPE:  Math\t Problem  \r",
      "!Tags: One\t  Two\r",
      "!Extra \t FIELD:  first  \r",
      "  indented   \r",
      "\r",
      "last\r",
      "~~~ \t\r",
      "!tags:\r",
      "~~~\r",
      "~~~\r",
      "",
    ].join("\n"),
  );
  assert.deepEqual(state.errors, []);
  assert.deepEqual(state.notes[0], {
    path: "example.note",
    line: 3,
    type: "Math Problem",
    deck: "Default",
    tags: "One Two",
    fields: [{ path: "example.note", line: 3, name: "extra field", value: "first\n  indented\n\nlast" }],
  });
  assert.deepEqual(
    state.notes.slice(1).map((note) => [note.line, note.type, note.tags, note.fields]),
    [
      [9, "Math Problem", "", []],
      [10, "Math Problem", "", []],
    ],
  );
});

test("finish reports unfinished notes at the next line without emitting them", () => {
  for (const text of ["!front: Prompt", "!front: Prompt\n", "!type: Problem", "!type: Problem\n"]) {
    const state = parseNotes("example.note", text);
    assert.deepEqual(state.errors, [
      new ParseError("example.note", text.endsWith("\n") ? 3 : 2, "Unterminated note. Expected a closing '~~~' line."),
    ]);
    assert.deepEqual(state.notes, []);
  }
  const state = new LoadState();
  const parser = new NoteParser(state, "example.note");
  parser.push("!front: Prompt");
  assert.deepEqual(state.errors, []);
  parser.finish();
  assert.deepEqual(state.errors, [
    new ParseError("example.note", 2, "Unterminated note. Expected a closing '~~~' line."),
  ]);
  assert.deepEqual(state.notes, []);
  for (const text of ["", "\n"]) {
    const state = parseNotes("example.note", text);
    assert.deepEqual(state.errors, []);
    assert.deepEqual(state.notes, []);
  }
});
