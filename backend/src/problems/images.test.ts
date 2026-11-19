import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import { rewriteImageUrls } from "./images.ts";

const root = path.resolve("/content");
const note = path.join(root, "calculus", "limits.note");

function rewrite(markdown: string): string {
  return rewriteImageUrls(markdown, note, root);
}

test("rewrites relative paths against the note directory", () => {
  assert.equal(rewrite("![a](img/f.svg)"), "![a](/api/assets/calculus/img/f.svg)");
  assert.equal(rewrite("![a](./img/f.png)"), "![a](/api/assets/calculus/img/f.png)");
  assert.equal(rewrite("![a](../shared/f.jpg)"), "![a](/api/assets/shared/f.jpg)");
});

test("decodes and re-encodes path escapes and keeps the query and fragment", () => {
  assert.equal(rewrite("![a](img/figure%201.png)"), "![a](/api/assets/calculus/img/figure%201.png)");
  assert.equal(rewrite("![a](img/f.svg?v=2#part)"), "![a](/api/assets/calculus/img/f.svg?v=2#part)");
});

test("leaves absolute, scheme, fragment and host URLs alone", () => {
  for (const text of [
    "![a](https://example.com/f.png)",
    "![a](data:image/png;base64,AAAA)",
    "![a](/api/assets/f.svg)",
    "![a](//example.com/f.png)",
    "![a](#figure)",
  ]) {
    assert.equal(rewrite(text), text);
  }
});

test("leaves unsupported types, malformed escapes and paths outside the root alone", () => {
  for (const text of ["![a](img/f.gif)", "![a](img/f%zz.png)", "![a](img/%2F.png)", "![a](../../outside.png)"]) {
    assert.equal(rewrite(text), text);
  }
});

test("accepts balanced brackets in alt text at any depth", () => {
  assert.equal(rewrite("![on [-2, 2]](f.svg)"), "![on [-2, 2]](/api/assets/calculus/f.svg)");
  assert.equal(rewrite("![a [b [c]]](f.svg)"), "![a [b [c]]](/api/assets/calculus/f.svg)");
});

test("ignores unbalanced brackets, titles, empty URLs and line breaks", () => {
  for (const text of [
    "![a]b](f.svg)",
    "![a]](f.svg)",
    "![a[b](f.svg)",
    '![a](f.svg "t")',
    "![a]()",
    "![a\nb](f.svg)",
  ]) {
    assert.equal(rewrite(text), text);
  }
});

test("rewrites several images and keeps surrounding text", () => {
  assert.equal(
    rewrite("x ![a](a.svg) y ![bad](https://e.com/b.png) z ![c](c.png)"),
    "x ![a](/api/assets/calculus/a.svg) y ![bad](https://e.com/b.png) z ![c](/api/assets/calculus/c.png)",
  );
});
