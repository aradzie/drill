import assert from "node:assert/strict";
import test from "node:test";
import { themeColor } from "./theme-color.ts";

test("swaps black and white with the SVG color scheme", () => {
  assert.equal(themeColor("#000000"), "light-dark(#000, #fff)");
  assert.equal(themeColor(" WHITE "), "light-dark(#fff, #000)");
});

test("brightens hex palette colors only in dark mode", () => {
  assert.equal(themeColor("#00F"), "light-dark(#00f, oklch(from #00f max(l, 0.7) c h))");
  assert.equal(themeColor("#595959"), "light-dark(#595959, oklch(from #595959 max(l, 0.7) c h))");
});

test("preserves SVG paint references and keywords", () => {
  for (const value of ["none", "currentColor", "url(#gradient)", "transparent", "var(--color)"]) {
    assert.equal(themeColor(value), value);
  }
});
