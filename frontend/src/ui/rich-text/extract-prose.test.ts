import assert from "node:assert/strict";
import { test } from "node:test";
import { normalizeSearchText } from "../../filter/search.ts";
import { extractProse } from "./extract-prose.ts";

const prose = (text: string) => normalizeSearchText(extractProse(text));

test("nested inline formatting preserves adjacency without duplicating text", () => {
  assert.equal(prose("co**sine** and *nested **bold** words* ~~gone~~"), "cosine and nested bold words gone");
  assert.equal(prose("[chain **rule**](https://secret.test 'hidden')"), "chain rule");
  assert.equal(prose("![a **diagram** &amp; label](secret.png 'hidden')"), "a diagram & label");
  assert.equal(prose("<https://visible.test>"), "https://visible.test");
});

test("structural boundaries and line breaks separate prose", () => {
  assert.equal(
    prose("# Heading\n\n> quote\n\n- first\n- second\n\nlast\nline  \nend"),
    "heading quote first second last line end",
  );
  assert.equal(prose("| first | second |\n| --- | --- |\n| third | fourth |"), "first second third fourth");
  assert.equal(prose("- [x] first\n- [ ] second\n\n---\n\nend"), "first second end");
});

test("entities decode once, with literal code and escaped punctuation protected", () => {
  assert.equal(prose("A &amp; B &#233; &amp;amp; &lt;b&gt;"), "a & b é &amp; <b>");
  assert.equal(prose("`&amp; <b> $formula$`"), "&amp; <b> $formula$");
  assert.equal(prose("```hidden-language\n&amp; <b> \\(formula\\)\n```"), "&amp; <b> \\(formula\\)");
  assert.equal(prose("    &amp; code\n"), "& code"); // formatField trims input before lexing.
  assert.equal(prose("before\n\n    &amp; code\n"), "before &amp; code");
  assert.equal(prose(String.raw`\&amp; \<b> &**amp;**`), "&amp; <b> &amp;");
});

test("raw HTML uses structured extraction with inline adjacency and block boundaries", () => {
  assert.equal(prose('co<span title="secret">si</span>ne<!-- hidden -->'), "cosine");
  assert.equal(prose("<div>first<br>second</div><div>third &amp; &amp;amp;</div>"), "first second third & &amp;");
  assert.equal(prose("<table><tr><td>first</td><td>second</td></tr></table>"), "first second");
  assert.equal(prose('a<script src="secret">hidden <b>words</b></script>b<style>hidden</style>c'), "abc");
  assert.equal(prose("<div><script>hidden</script>visible<style>hidden</style></div>"), "visible");
  assert.equal(prose("<div>raw $formula$ \\(other\\) &lt;tag&gt;</div>"), "raw $formula$ \\(other\\) <tag>");
  // The existing math extension claims inline math even within inline HTML code tags.
  assert.equal(prose("a<code>$formula$ &amp;</code>b"), "a &b");
});

test("all six custom math tokens are omitted with separating spaces", () => {
  for (const math of [String.raw`\(hidden\)`, "$hidden$", String.raw`\[hidden\]`, "$$hidden$$"]) {
    assert.equal(prose(`before ${math} after`), "before after", math);
  }
  for (const math of ["\\[hidden\n# hidden\n\\]", "$$hidden\n# hidden\n$$"]) {
    assert.equal(prose(`before\n${math}\nafter`), "before after", math);
    assert.equal(prose(math), "", math);
  }
  assert.equal(prose(String.raw`foo\(x\)bar`), "foo bar");
  assert.equal(prose(String.raw`continuous \(\text{secret}\) function`), "continuous function");
  assert.equal(prose("$hidden$"), "");
});

test("escaped, incomplete, and unrecognized math follows ordinary Markdown rules", () => {
  assert.equal(prose(String.raw`\$literal\$`), "$literal$");
  assert.equal(prose(String.raw`\\(literal\\)`), String.raw`\(literal\)`);
  assert.equal(prose("$ spaced $"), "$ spaced $");
  assert.equal(prose("$unclosed"), "$unclosed");
  assert.equal(prose("\\(first\nsecond\\)"), "(first second)");
  assert.equal(prose("`\\(literal\\)`"), "\\(literal\\)");
});
