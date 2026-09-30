import assert from "node:assert/strict";
import { test } from "node:test";
import { Marked } from "marked";
import { mathExtension } from "./marked-math.ts";

test("smoke test", () => {
  assert.equal(render(""), "");
});

test("ignored in html comments", () => {
  assert.equal(render("<!-- \\(x\\) -->"), "<!-- \\(x\\) -->");
  assert.equal(render("<!-- \\[x\\] -->"), "<!-- \\[x\\] -->");
  assert.equal(render("<!-- $x$ -->"), "<!-- $x$ -->");
  assert.equal(render("<!-- $$x$$ -->"), "<!-- $$x$$ -->");
});

test("ignored in html elements", () => {
  assert.equal(render("<div>\\(x\\)</div>"), "<div>\\(x\\)</div>");
  assert.equal(render("<div>\\[x\\]</div>"), "<div>\\[x\\]</div>");
  assert.equal(render("<div>$x$</div>"), "<div>$x$</div>");
  assert.equal(render("<div>$$x$$</div>"), "<div>$$x$$</div>");
});

test.todo("ignored in indented code blocks", () => {
  // todo indented code blocks
});

test("ignored in fenced code blocks", () => {
  assert.equal(render("```\n\\(x\\)\n```"), "<pre><code>\\(x\\)\n</code></pre>");
  assert.equal(render("```\n\\[x\\]\n```"), "<pre><code>\\[x\\]\n</code></pre>");
  assert.equal(render("```\n$x$\n```"), "<pre><code>$x$\n</code></pre>");
  assert.equal(render("```\n$$x$$\n```"), "<pre><code>$$x$$\n</code></pre>");
});

test("ignored in code spans", () => {
  assert.equal(render("`\\(x\\)`"), "<p><code>\\(x\\)</code></p>");
  assert.equal(render("`\\[x\\]`"), "<p><code>\\[x\\]</code></p>");
  assert.equal(render("`$x$`"), "<p><code>$x$</code></p>");
  assert.equal(render("`$$x$$`"), "<p><code>$$x$$</code></p>");
});

test("parsed inside headers", () => {
  assert.equal(render("# a \\(x\\) b"), "<h1>a <im>x</im> b</h1>");
  assert.equal(render("# a \\[x\\] b"), "<h1>a <dm>x</dm> b</h1>");
  assert.equal(render("# a $x$ b"), "<h1>a <im>x</im> b</h1>");
  assert.equal(render("# a $$x$$ b"), "<h1>a <dm>x</dm> b</h1>");
});

test("parsed inside paragraphs", () => {
  assert.equal(render("a \\(x\\) b"), "<p>a <im>x</im> b</p>");
  assert.equal(render("a \\[x\\] b"), "<p>a <dm>x</dm> b</p>");
  assert.equal(render("a $x$ b"), "<p>a <im>x</im> b</p>");
  assert.equal(render("a $$x$$ b"), "<p>a <dm>x</dm> b</p>");
});

test("parsed inside lists", () => {
  assert.equal(render("- a \\(x\\) b"), "<ul>\n<li>a <im>x</im> b</li>\n</ul>");
  assert.equal(render("- a \\[x\\] b"), "<ul>\n<li>a <dm>x</dm> b</li>\n</ul>");
  assert.equal(render("- a $x$ b"), "<ul>\n<li>a <im>x</im> b</li>\n</ul>");
  assert.equal(render("- a $$x$$ b"), "<ul>\n<li>a <dm>x</dm> b</li>\n</ul>");
});

test("parsed inside blockquotes", () => {
  assert.equal(render("> a \\(x\\) b"), "<blockquote>\n<p>a <im>x</im> b</p>\n</blockquote>");
  assert.equal(render("> a \\[x\\] b"), "<blockquote>\n<p>a <dm>x</dm> b</p>\n</blockquote>");
  assert.equal(render("> a $x$ b"), "<blockquote>\n<p>a <im>x</im> b</p>\n</blockquote>");
  assert.equal(render("> a $$x$$ b"), "<blockquote>\n<p>a <dm>x</dm> b</p>\n</blockquote>");
});

test("inline math", () => {
  assert.equal(render("\\(x\\)"), "<p><im>x</im></p>");
  assert.equal(render("a\\(x\\)b"), "<p>a<im>x</im>b</p>");
  assert.equal(render("a\\(x\\)\\(y\\)b"), "<p>a<im>x</im><im>y</im>b</p>");
});

test("inline alt math", () => {
  assert.equal(render("$x$"), "<p><im>x</im></p>");
  assert.equal(render("a$x$b"), "<p>a<im>x</im>b</p>");
  assert.equal(render("a$x$$y$b"), "<p>a<im>x</im><im>y</im>b</p>");
});

test("inline alt math rejects surrounding whitespace", () => {
  assert.equal(render("$ x $"), "<p>$ x $</p>");
  assert.equal(render("$x $"), "<p>$x $</p>");
  assert.equal(render("$ x$"), "<p>$ x$</p>");
  assert.equal(render("$ $"), "<p>$ $</p>");
  assert.equal(render("the $ symbol and the $ sign"), "<p>the $ symbol and the $ sign</p>");
});

test("display math", () => {
  assert.equal(render("\\[x\\]"), "<p><dm>x</dm></p>");
  assert.equal(render("a\\[x\\]b"), "<p>a<dm>x</dm>b</p>");
  assert.equal(render("a\\[x\\]\\[y\\]b"), "<p>a<dm>x</dm><dm>y</dm>b</p>");
});

test("display alt math", () => {
  assert.equal(render("$$x$$"), "<p><dm>x</dm></p>");
  assert.equal(render("a$$x$$b"), "<p>a<dm>x</dm>b</p>");
  assert.equal(render("a$$x$$$$y$$b"), "<p>a<dm>x</dm><dm>y</dm>b</p>");
});

test("ignore escaped", () => {
  assert.equal(render("\\\\(x\\)"), "<p>\\(x)</p>");
  assert.equal(render("\\\\[x\\]"), "<p>\\[x]</p>");
  assert.equal(render("\\\\(x\\\\)"), "<p>\\(x\\)</p>");
  assert.equal(render("\\\\[x\\\\]"), "<p>\\[x\\]</p>");
});

test("ignore escaped alt", () => {
  assert.equal(render("\\$x$"), "<p>$x$</p>");
  assert.equal(render("\\$x\\$"), "<p>$x$</p>");
  assert.equal(render("\\$\\$x$$"), "<p>$$x$$</p>");
  assert.equal(render("\\$\\$x\\$\\$"), "<p>$$x$$</p>");
});

test("ambiguous alt", () => {
  assert.equal(render("$"), "<p>$</p>");
  assert.equal(render("$$"), "<p>$$</p>");
  assert.equal(render("$$$"), "<p>$$$</p>");
  assert.equal(render("$$$$"), "<p>$$$$</p>");
  assert.equal(render("$$$$$"), "<p>$$$$$</p>");
  assert.equal(render("$x"), "<p>$x</p>");
  assert.equal(render("x$"), "<p>x$</p>");
  assert.equal(render("$$x"), "<p>$$x</p>");
  assert.equal(render("x$$"), "<p>x$$</p>");
  assert.equal(render("$$x$"), "<p>$<im>x</im></p>");
  assert.equal(render("$x$$"), "<p><im>x</im>$</p>");
  assert.equal(render("$$$x$"), "<p>$$<im>x</im></p>");
  assert.equal(render("$x$$$"), "<p><im>x</im>$$</p>");
  assert.equal(render("$$$x$$"), "<p>$<dm>x</dm></p>");
  // A standalone line starting with `$$` is claimed by the top-priority display-math block rule
  // before the ambiguous dollar-counting inline logic ever runs. Since the block rule requires
  // its closing `$$` to be followed by nothing but whitespace, the only viable closing position
  // is the last two `$`s, pulling the middle `$` into the captured content.
  assert.equal(render("$$x$$$"), "<p><dm>x$</dm></p>");
  assert.equal(render("$$$x$$$"), "<p>$<dm>x</dm>$</p>");
  assert.equal(render("$$$$x$$$$"), "<p>$$<dm>x</dm>$$</p>");
});

test("display math spans newlines", () => {
  assert.equal(render("\\[x\ny\\]"), "<p><dm>x\ny</dm></p>");
  assert.equal(render("$$x\ny$$"), "<p><dm>x\ny</dm></p>");
});

test("mid-line multiline display math is no longer parsed as math", () => {
  assert.equal(render("a \\[x\ny\\] b"), "<p>a [x\ny] b</p>");
  assert.equal(render("a $$x\ny$$ b"), "<p>a $$x\ny$$ b</p>");
});

test("multiline display math block survives embedded block-syntax lines", () => {
  assert.equal(render("\\[\nx\n=\ny\n\\]"), "<p><dm>x\n=\ny</dm></p>");
  assert.equal(render("\\[\n- x\n\\]"), "<p><dm>- x</dm></p>");
  assert.equal(render("\\[\n> x\n\\]"), "<p><dm>> x</dm></p>");
});

test("multiline display math block interrupts a preceding paragraph without a blank line", () => {
  assert.equal(render("intro\n\\[\nx\n\\]"), "<p>intro</p>\n<p><dm>x</dm></p>");
});

test("display math block requires only whitespace after the closing delimiter", () => {
  // Trailing whitespace on the closing line is fine.
  assert.equal(render("\\[\nx\n\\]  "), "<p><dm>x</dm></p>");
  assert.equal(render("$$\nx\n$$  "), "<p><dm>x</dm></p>");
  // Trailing non-whitespace text disqualifies it as a block. For a multi-line span, that means
  // no rule claims it at all (inline forbids newlines, block requires a clean closing line), so
  // it falls through to ordinary paragraph text.
  assert.equal(render("\\[\nx\n\\] omg"), "<p>[\nx\n] omg</p>");
  assert.equal(render("$$\nx\n$$ omg"), "<p>$$\nx\n$$ omg</p>");
  // For a single-line span, the (still newline-forbidding) inline rule picks it up instead.
  assert.equal(render("\\[x\\] omg"), "<p><dm>x</dm> omg</p>");
  assert.equal(render("$$x$$ omg"), "<p><dm>x</dm> omg</p>");
});

test("inline math does not span newlines", () => {
  assert.equal(render("a \\(x\ny\\) b"), "<p>a (x\ny) b</p>");
  assert.equal(render("a $x\ny$ b"), "<p>a $x\ny$ b</p>");
});

test("math content is not re-tokenized as markdown", () => {
  assert.equal(render("\\(**bold**\\)"), "<p><im>**bold**</im></p>");
  assert.equal(render("$**bold**$"), "<p><im>**bold**</im></p>");
  assert.equal(render("\\[**bold**\\]"), "<p><dm>**bold**</dm></p>");
  assert.equal(render("$$**bold**$$"), "<p><dm>**bold**</dm></p>");
  assert.equal(render("\\[\n**bold**\n\\]"), "<p><dm>**bold**</dm></p>");
  assert.equal(render("$$\n**bold**\n$$"), "<p><dm>**bold**</dm></p>");
  assert.equal(
    render("\\[\n`code` and _em_ and [link](http://x)\n\\]"),
    "<p><dm>`code` and _em_ and [link](http://x)</dm></p>",
  );
});

function render(markdown: string): string {
  return new Marked()
    .use(
      mathExtension((code, type) => {
        switch (type) {
          case "displayMathBlock":
          case "displayAltMathBlock":
            return `<p><dm>${code.trim()}</dm></p>`;
          case "displayMath":
          case "displayAltMath":
            return `<dm>${code.trim()}</dm>`;
          case "inlineMath":
          case "inlineAltMath":
            return `<im>${code.trim()}</im>`;
        }
      }),
    )
    .parse(markdown, { async: false })
    .trim();
}
