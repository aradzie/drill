import { Marked } from "marked";
import { mathExtension } from "./marked-math.ts";
import type { MathRenderer } from "./math-renderer.ts";

export function formatField(value: string, math: MathRenderer): string {
  return new Marked().use(mathExtension(math)).parse(value.trim(), { async: false }).trim();
}
