import assert from "node:assert/strict";
import { test } from "node:test";
import { hotkey, hotkeyId } from "./hotkey.ts";

test("parses modifiers and descriptions into immutable definitions", () => {
  const shortcut = hotkey(" Ctrl + Shift + F ", "Find something.");
  assert.deepEqual(shortcut, {
    key: "f",
    ctrl: true,
    alt: false,
    shift: true,
    meta: false,
    description: "Find something.",
  });
  assert.equal(Object.isFrozen(shortcut), true);
  assert.equal(hotkeyId(shortcut), hotkeyId(hotkey("shift+ctrl+f", "Another description.")));
  assert.deepEqual(hotkey("Alt+Meta+x"), { key: "x", ctrl: false, alt: true, shift: false, meta: true });
});

test("accepts named keys, function keys, printable characters, Space and Plus", () => {
  for (const key of ["Enter", "Escape", "Backspace", "PageUp", "ArrowDown", "F1", "F24", "1", "?", "ą"]) {
    assert.equal(hotkey(key).key, key);
  }
  assert.equal(hotkey("Space").key, " ");
  assert.equal(hotkey("Ctrl+Plus").key, "+");
  assert.equal(hotkey("Ctrl+?").shift, false);
  assert.equal(hotkey("Ctrl+Shift+?").shift, true);
});

test("rejects malformed shortcuts, unknown names, repeated modifiers and modifier-only bindings", () => {
  for (const spec of [
    "",
    " ",
    "Ctrl",
    "Shift",
    "Ctrl+",
    "+",
    "Ctrl++",
    "Ctrl+Ctrl+x",
    "ctrl+CTRL+x",
    "Crtl+x",
    "Ctrl+Shfit+x",
    "Escape+x",
    "Escpae",
    "F0",
    "F25",
    "hello",
    "Ctrl+\n",
  ]) {
    assert.throws(() => hotkey(spec), /hotkey/);
  }
});
