import type { ErrorMessage } from "shared";

export class ParseError implements ErrorMessage {
  readonly path: string;
  readonly line: number;
  readonly message: string;

  constructor(path: string, line: number, message: string) {
    this.path = path;
    this.line = line;
    this.message = message;
  }
}
