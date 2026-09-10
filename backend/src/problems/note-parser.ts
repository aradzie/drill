import { ParseError } from "./error.ts";
import type { LoadState, ParsedField, SourceFile, SourceLocation } from "./state.ts";

const fieldName = "[-_A-Za-z0-9]+(?:[ \\t]+[-_A-Za-z0-9]+)*";
const fieldPattern = new RegExp(`^!(?<name>${fieldName}):(?<value>.*)$`);
const endPattern = /^~~~[ \t]*$/;

function collapseWhitespace(text: string): string {
  return text.trim().replaceAll(/\s+/g, " ");
}

type ParsedProperty = SourceLocation & {
  name: "type" | "deck" | "tags";
  value: string;
};

type NoteInProgress = {
  location: SourceLocation | undefined;
  type: ParsedProperty | undefined;
  deck: ParsedProperty | undefined;
  tags: ParsedProperty | undefined;
  fields: ParsedField[];
  currentField: ParsedField | undefined;
};

function emptyNote(): NoteInProgress {
  return {
    location: undefined,
    type: undefined,
    deck: undefined,
    tags: undefined,
    fields: [],
    currentField: undefined,
  };
}

/**
 * Feed one line at a time with push(), then call finish() at EOF.
 * Completed notes and recoverable errors are available between pushes.
 * Properties carry forward to later notes; tombstones are recognized but ignored.
 */
export class NoteParser {
  static parse(state: LoadState, file: SourceFile): void {
    new NoteParser(state, file.path).parse(file.text);
  }

  readonly #state: LoadState;
  readonly #path: string;
  #line = 1;
  #note = emptyNote();
  #inheritedType = "Basic";
  #inheritedDeck = "Default";
  #inheritedTags = "";

  constructor(state: LoadState, path: string) {
    this.#state = state;
    this.#path = path;
  }

  parse(text: string): void {
    const lines = text.split("\n");
    for (const line of lines) {
      this.push(line);
    }
    this.finish();
  }

  push(line: string): void {
    line = line.trimEnd();
    const field = fieldPattern.exec(line);
    if (field) {
      this.#handleFieldLike(field);
    } else if (endPattern.test(line)) {
      this.#handleEnd();
    } else {
      this.#handleText(line);
    }
    this.#line += 1;
  }

  finish(): void {
    const note = this.#note;
    if (note.type || note.deck || note.tags || note.fields.length > 0) {
      this.#error("Unterminated note. Expected a closing '~~~' line.");
    }
  }

  #handleText(line: string): void {
    const field = this.#note.currentField;
    if (field) {
      field.value = field.value ? `${field.value}\n${line}` : line;
    } else if (line) {
      this.#error("Unexpected text outside a multiline field.");
    }
  }

  #handleEnd(): void {
    const note = this.#note;
    const location = note.location
      ? { path: note.location.path, line: note.location.line }
      : { path: this.#path, line: this.#line };
    if (note.type) this.#inheritedType = note.type.value;
    if (note.deck) this.#inheritedDeck = note.deck.value;
    if (note.tags) this.#inheritedTags = note.tags.value;
    this.#state.addNote({
      ...location,
      type: this.#inheritedType,
      deck: this.#inheritedDeck,
      tags: this.#inheritedTags,
      fields: note.fields,
    });
    this.#note = emptyNote();
  }

  #handleFieldLike(match: RegExpExecArray): void {
    const note = this.#note;
    note.currentField = undefined;
    const name = collapseWhitespace(match.groups!.name).toLowerCase();
    const value = match.groups!.value;

    if (name === "type" || name === "deck" || name === "tags") {
      if (note[name]) {
        this.#error(`Duplicate property '${name}'.`);
        return;
      }
      if (note.fields.length > 0) {
        this.#error(`Unexpected property '${name}'.`);
        return;
      }
      note[name] = {
        path: this.#path,
        line: this.#line,
        name,
        value: collapseWhitespace(value),
      };
      return;
    }

    if (name === "delete") {
      if (note.fields.length > 0) {
        this.#error("'delete' is a reserved field name.");
      }
      return;
    }

    const field: ParsedField = {
      path: this.#path,
      line: this.#line,
      name,
      value: value.trim(),
    };
    note.location ??= field;
    note.currentField = field;
    note.fields.push(field);
  }

  #error(message: string): void {
    this.#state.addError(new ParseError(this.#path, this.#line, message));
  }
}
