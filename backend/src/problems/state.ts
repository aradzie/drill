import type { Problem } from "shared";
import type { ETag } from "../io/etag.ts";
import type { ParseError } from "./error.ts";

export class SourceFile {
  readonly #path: string;
  readonly #etag: ETag;
  readonly #text: string;

  constructor(path: string, etag: ETag, text: string) {
    this.#path = path;
    this.#etag = etag;
    this.#text = text;
  }

  get path(): string {
    return this.#path;
  }

  get etag(): ETag {
    return this.#etag;
  }

  get text(): string {
    return this.#text;
  }
}

export type SourceLocation = {
  path: string;
  line: number;
};

export type ParsedField = SourceLocation & {
  name: string;
  value: string;
};

export type ParsedNote = SourceLocation & {
  type: string;
  deck: string;
  tags: string[];
  fields: ParsedField[];
};

export class LoadState {
  readonly #errors: ParseError[] = [];
  readonly #files: Map<string, SourceFile> = new Map();
  readonly #notes: ParsedNote[] = [];
  readonly #problems: Problem[] = [];
  readonly #problemsById: Map<string, Problem> = new Map();

  addError(error: ParseError): void {
    this.#errors.push(error);
  }

  get errors(): readonly ParseError[] {
    return this.#errors;
  }

  addFile(file: SourceFile): void {
    this.#files.set(file.path, file);
  }

  get files(): SourceFile[] {
    return [...this.#files.values()].sort((a, b) => a.path.localeCompare(b.path));
  }

  addNote(note: ParsedNote): void {
    this.#notes.push(note);
  }

  get notes(): readonly ParsedNote[] {
    return this.#notes;
  }

  addProblem(problem: Problem): void {
    this.#problems.push(problem);
    this.#problemsById.set(problem.id, problem);
  }

  get problems(): readonly Problem[] {
    return this.#problems;
  }

  has(problemId: string): boolean {
    return this.#problemsById.has(problemId);
  }

  get(problemId: string): Problem | undefined {
    return this.#problemsById.get(problemId);
  }
}
