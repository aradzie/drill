import assert from "node:assert/strict";
import { test } from "node:test";
import { katexDisplay, katexInline } from "./katex.ts";

test("errors", () => {
  // Sometimes KaTeX throws errors even if throwOnError is false.
  // In such a case we should handle the errors ourselves.
  assert.match(katexDisplay(`\\begin{ }`, { throwOnError: false }), /KaTeX parse error: No such environment/);
  assert.match(katexInline(`\\begin{ }`, { throwOnError: false }), /KaTeX parse error: No such environment/);
});

test("wraps rendered output with the original LaTeX source in data-tex", () => {
  assert.match(katexDisplay(`\\sin x`, {}), /^<span data-tex="\\sin x">/);
  assert.match(katexInline(`\\sin x`, {}), /^<span data-tex="\\sin x">/);
});

test("escapes attribute-breaking characters in data-tex", () => {
  assert.match(katexInline(`a < b`, {}), /^<span data-tex="a &lt; b">/);
});
