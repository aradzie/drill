import assert from "node:assert/strict";
import test from "node:test";
import { themeColor } from "./theme-color.ts";

test("swaps black and white with the SVG color scheme", () => {
  assert.equal(themeColor("#000000"), "light-dark(#000000, #ffffff)");
  assert.equal(themeColor(" WHITE "), "light-dark(#ffffff, #000000)");
});

test("brightens hex palette colors only in dark mode", () => {
  assert.equal(themeColor("#00F"), "light-dark(#0000ff, oklch(from #0000ff max(l, 0.7) c h))");
  assert.equal(themeColor("#abc8"), "light-dark(#aabbcc88, oklch(from #aabbcc88 max(l, 0.7) c h))");
});

test("inverts grayscale hex colors in dark mode and preserves alpha", () => {
  assert.equal(themeColor("#595959"), "light-dark(#595959, #a6a6a6)");
  assert.equal(themeColor("#888"), "light-dark(#888888, #777777)");
  assert.equal(themeColor("#777a"), "light-dark(#777777aa, #888888aa)");
  assert.equal(themeColor("#80808080"), "light-dark(#80808080, #7f7f7f80)");
});

test("preserves SVG paint references and keywords", () => {
  for (const value of [
    "none",
    "currentColor",
    "url(#gradient)",
    "transparent",
    "var(--color)",
    "#1234567",
    "rgb(invalid)",
    "rgb(1, 2, nope)",
    "rgb(1 2 3 4)",
    "rgb(1 2 3 / nope)",
  ]) {
    assert.equal(themeColor(value), value);
  }
});
