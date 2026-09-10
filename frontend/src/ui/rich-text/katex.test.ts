import { test } from "node:test";
import { match } from "rich-assert";
import { katexDisplay, katexInline } from "./katex.ts";

test("errors", () => {
  // Sometimes KaTeX throws errors even if throwOnError is false.
  // In such a case we should handle the errors ourselves.
  match(katexDisplay(`\\begin{ }`, { throwOnError: false }), /KaTeX parse error: No such environment/);
  match(katexInline(`\\begin{ }`, { throwOnError: false }), /KaTeX parse error: No such environment/);
});

test("wraps rendered output with the original LaTeX source in data-tex", () => {
  match(katexDisplay(`\\sin x`, {}), /^<span data-tex="\\sin x">/);
  match(katexInline(`\\sin x`, {}), /^<span data-tex="\\sin x">/);
});

test("escapes attribute-breaking characters in data-tex", () => {
  match(katexInline(`a < b`, {}), /^<span data-tex="a &lt; b">/);
});
