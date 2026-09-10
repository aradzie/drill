import { test } from "node:test";
import { equal } from "rich-assert";
import { formatField } from "./format-field.ts";
import type { MathRenderer } from "./math-renderer.ts";

// Delimiter-preserving stub: this test is about formatField's markdown wrapping, not about how
// math itself gets rendered.
const stubMath: MathRenderer = (code, type) => {
  switch (type) {
    case "displayMathBlock":
    case "displayAltMathBlock":
      return `\n<p>\\[ ${code} \\]</p>\n`;
    case "displayMath":
    case "displayAltMath":
      return `\\[ ${code} \\]`;
    case "inlineMath":
    case "inlineAltMath":
      return `\\( ${code} \\)`;
  }
};

test("format", () => {
  equal(formatField("", stubMath), "");
  equal(formatField("\t\r\n", stubMath), "");
  equal(formatField("Hello", stubMath), "<p>Hello</p>");
  equal(formatField("# Hello", stubMath), "<h1>Hello</h1>");
  equal(formatField("- Hello", stubMath), "<ul>\n<li>Hello</li>\n</ul>");
  equal(formatField("\\[x=1\\]", stubMath), "<p>\\[ x=1 \\]</p>");
});
