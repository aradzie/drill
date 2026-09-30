import assert from "node:assert/strict";
import { test } from "node:test";
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
  assert.equal(formatField("", stubMath), "");
  assert.equal(formatField("\t\r\n", stubMath), "");
  assert.equal(formatField("Hello", stubMath), "<p>Hello</p>");
  assert.equal(formatField("# Hello", stubMath), "<h1>Hello</h1>");
  assert.equal(formatField("- Hello", stubMath), "<ul>\n<li>Hello</li>\n</ul>");
  assert.equal(formatField("\\[x=1\\]", stubMath), "<p>\\[ x=1 \\]</p>");
});

test("math in image descriptions stays literal", () => {
  assert.equal(
    formatField("Outside $S$ ![Let $S$ be...](image-url.png)", stubMath),
    '<p>Outside \\( S \\) <img src="image-url.png" alt="Let $S$ be..."></p>',
  );
  assert.equal(
    formatField("![**Let \\(S\\)** be...](image-url.png)", stubMath),
    '<p><img src="image-url.png" alt="Let \\(S\\) be..."></p>',
  );
  assert.equal(
    formatField('![A "$S$" & < B](image-url.png)', stubMath),
    '<p><img src="image-url.png" alt="A &quot;$S$&quot; &amp; &lt; B"></p>',
  );
});
