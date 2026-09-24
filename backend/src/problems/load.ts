import type { Problem } from "shared";
import { ParseError } from "./error.ts";
import { findFiles } from "./files.ts";
import { NoteParser } from "./note-parser.ts";
import { LoadState, type ParsedField, type ParsedNote } from "./state.ts";

/** Loads every Math Problem note below the given Notatki problem-directories. */
export async function loadProblems(directories: Iterable<string>): Promise<{
  errors: ParseError[];
  problems: Problem[];
}> {
  const state = new LoadState();
  await findFiles(directories, state);
  for (const file of state.files) {
    NoteParser.parse(state, file);
  }
  for (const note of state.notes) {
    const problem = noteToProblem(state, note);
    if (problem) {
      if (state.has(problem.id)) {
        state.addError(new ParseError(note.path, note.line, `Duplicate problem id '${problem.id}'.`));
      } else {
        if (problem.tags.includes("TODO") || problem.answer === "TODO") {
          continue;
        }
        state.addProblem(problem);
      }
    }
  }
  return {
    errors: [...state.errors],
    problems: [...state.problems],
  };
}

function noteToProblem(state: LoadState, note: ParsedNote): Problem | null {
  const errors: ParseError[] = [];

  if (note.type !== "Problem") {
    errors.push(new ParseError(note.path, note.line, `Expected !type: Problem, but found '${note.type}'.`));
  }

  const fieldNames = new Set<string>();
  for (const field of note.fields) {
    if (fieldNames.has(field.name)) {
      errors.push(new ParseError(field.path, field.line, `Duplicate field '${field.name}'.`));
    }
    fieldNames.add(field.name);
  }

  const id = getField(note.fields, "id");
  if (!id) {
    errors.push(new ParseError(note.path, note.line, `Missing required field 'id'.`));
  }
  const front = getField(note.fields, "front");
  if (!front) {
    errors.push(new ParseError(note.path, note.line, `Missing required field 'front'.`));
  }
  const back = getField(note.fields, "back");
  if (!back) {
    errors.push(new ParseError(note.path, note.line, `Missing required field 'back'.`));
  }
  const hint = getField(note.fields, "hint");

  if (errors.length > 0) {
    for (const error of errors) {
      state.addError(error);
    }
    return null;
  }

  return {
    id: id!.value,
    deck: note.deck,
    tags: note.tags ? note.tags.split(/\s+/) : [],
    body: front!.value,
    answer: back!.value,
    hint: hint?.value ?? null,
  };
}

function getField(fields: readonly ParsedField[], name: string): ParsedField | undefined {
  return fields.find((field) => field.name === name);
}
