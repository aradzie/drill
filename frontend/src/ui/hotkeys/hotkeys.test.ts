import assert from "node:assert/strict";
import { test } from "node:test";
import { hotkey } from "./hotkey.ts";
import { Hotkeys } from "./hotkeys.ts";

function keydown(key: string, options: Partial<KeyboardEvent> = {}, path: EventTarget[] = []): KeyboardEvent {
  return Object.assign(
    new Event("keydown", { cancelable: true }),
    { key, repeat: false, ctrlKey: false, altKey: false, metaKey: false, shiftKey: false, isComposing: false },
    options,
    { composedPath: () => path },
  ) as KeyboardEvent;
}

function element(tagName: string, isContentEditable = false): EventTarget {
  return Object.assign(new EventTarget(), { tagName, isContentEditable });
}

test("aliases invoke one handler and only matching keys prevent the default", () => {
  const hotkeys = new Hotkeys();
  let calls = 0;
  hotkeys.register([hotkey("f"), hotkey("1"), hotkey("f")], () => calls++);

  for (const key of ["f", "1"]) {
    const event = keydown(key);
    hotkeys.onKeyDown(event);
    assert.equal(event.defaultPrevented, true);
  }
  assert.equal(calls, 2);

  const unrelated = keydown("p");
  hotkeys.onKeyDown(unrelated);
  assert.equal(unrelated.defaultPrevented, false);
  assert.equal(calls, 2);
});

test("cleanup removes every alias and stale cleanup cannot remove a newer registration", () => {
  const hotkeys = new Hotkeys();
  let calls = 0;
  const handler = () => calls++;
  const unregister = hotkeys.register([hotkey("b"), hotkey("Backspace")], handler);
  unregister();

  for (const key of ["b", "Backspace"]) {
    const event = keydown(key);
    hotkeys.onKeyDown(event);
    assert.equal(event.defaultPrevented, false);
  }
  assert.equal(calls, 0);

  hotkeys.register([hotkey("b")], handler);
  unregister();
  hotkeys.onKeyDown(keydown("b"));
  assert.equal(calls, 1);
});

test("duplicate registrations throw without partially registering aliases", () => {
  const hotkeys = new Hotkeys();
  let originalCalls = 0;
  hotkeys.register([hotkey("h")], () => originalCalls++);

  assert.throws(() => hotkeys.register([hotkey("x"), hotkey("h")], () => assert.fail()), /already registered/);
  const event = keydown("x");
  hotkeys.onKeyDown(event);
  assert.equal(event.defaultPrevented, false);
  assert.doesNotThrow(() => hotkeys.register([hotkey("x")], () => {}));

  hotkeys.onKeyDown(keydown("h"));
  assert.equal(originalCalls, 1);
});

test("replacing a registration uses the new callback", () => {
  const hotkeys = new Hotkeys();
  const calls: string[] = [];
  const unregister = hotkeys.register([hotkey("w")], () => calls.push("start"));
  hotkeys.onKeyDown(keydown("w"));
  unregister();
  hotkeys.register([hotkey("w")], () => calls.push("stop"));
  hotkeys.onKeyDown(keydown("w"));
  assert.deepEqual(calls, ["start", "stop"]);
});

test("repeats, modifiers, composition and already-handled events are ignored", () => {
  const hotkeys = new Hotkeys();
  hotkeys.register([hotkey("h")], () => assert.fail("Ignored event invoked a handler"));

  for (const property of ["repeat", "ctrlKey", "altKey", "shiftKey", "metaKey", "isComposing"] as const) {
    const event = keydown("h", { [property]: true });
    hotkeys.onKeyDown(event);
    assert.equal(event.defaultPrevented, false, property);
  }

  const prevented = keydown("h");
  prevented.preventDefault();
  hotkeys.onKeyDown(prevented);
});

test("Shift is explicit and letter case does not change the binding", () => {
  const hotkeys = new Hotkeys();
  let calls = 0;
  hotkeys.register([hotkey("h")], () => calls++);
  const uppercase = keydown("H", { shiftKey: true });
  hotkeys.onKeyDown(uppercase);
  assert.equal(calls, 0);
  assert.equal(uppercase.defaultPrevented, false);

  hotkeys.register([hotkey("Shift+h")], () => calls++);
  hotkeys.onKeyDown(uppercase);
  assert.equal(calls, 1);

  // Caps Lock changes event.key but must not select the Shift shortcut.
  hotkeys.onKeyDown(keydown("H"));
  assert.equal(calls, 2);
  hotkeys.onKeyDown(keydown("h", { shiftKey: true }));
  assert.equal(calls, 3);
});

test("form fields and editable content suppress hotkeys throughout the event path", () => {
  const hotkeys = new Hotkeys();
  hotkeys.register([hotkey("h"), hotkey("Backspace"), hotkey("Space")], () => assert.fail("Typing invoked a hotkey"));

  const targets = [element("INPUT"), element("TEXTAREA"), element("SELECT"), element("DIV", true)];
  for (const target of targets) {
    for (const key of ["h", "Backspace", " "]) {
      const event = keydown(key, {}, [element("SPAN"), target, new EventTarget()]);
      hotkeys.onKeyDown(event);
      assert.equal(event.defaultPrevented, false);
    }
  }
});

test("Space and Enter preserve control activation while letter shortcuts still work", () => {
  const hotkeys = new Hotkeys();
  let calls = 0;
  hotkeys.register([hotkey("Space"), hotkey("Enter"), hotkey("h")], () => calls++);

  for (const tagName of ["BUTTON", "A", "SUMMARY"]) {
    const path = [element("SPAN"), element(tagName)];
    for (const key of [" ", "Enter"]) {
      const event = keydown(key, {}, path);
      hotkeys.onKeyDown(event);
      assert.equal(event.defaultPrevented, false);
    }
    hotkeys.onKeyDown(keydown("h", {}, path));
  }
  assert.equal(calls, 3);

  hotkeys.onKeyDown(keydown(" ", {}, [element("DIV"), new EventTarget()]));
  assert.equal(calls, 4);
});

test("every modifier combination has a distinct registration and requires an exact match", () => {
  const hotkeys = new Hotkeys();
  const calls: number[] = [];
  const names = ["Ctrl", "Alt", "Shift", "Meta"];
  for (let mask = 0; mask < 16; mask++) {
    const spec = [...names.filter((_, bit) => mask & (1 << bit)), "x"].join("+");
    hotkeys.register([hotkey(spec)], () => calls.push(mask));
  }
  for (let mask = 0; mask < 16; mask++) {
    const event = keydown("x", {
      ctrlKey: Boolean(mask & 1),
      altKey: Boolean(mask & 2),
      shiftKey: Boolean(mask & 4),
      metaKey: Boolean(mask & 8),
    });
    hotkeys.onKeyDown(event);
    assert.equal(event.defaultPrevented, true);
    assert.deepEqual(
      calls,
      Array.from({ length: mask + 1 }, (_, index) => index),
    );
  }
});

test("equivalent definitions conflict atomically regardless of modifier order or description", () => {
  const hotkeys = new Hotkeys();
  let calls = 0;
  const unregister = hotkeys.register([hotkey("Ctrl+Shift+F"), hotkey("Shift+Ctrl+f", "Alias")], () => calls++);
  assert.throws(() => hotkeys.register([hotkey("x"), hotkey("shift+ctrl+F")], () => {}), /already registered/);
  const unrelated = keydown("x");
  hotkeys.onKeyDown(unrelated);
  assert.equal(unrelated.defaultPrevented, false);
  hotkeys.onKeyDown(keydown("F", { ctrlKey: true, shiftKey: true }));
  assert.equal(calls, 1);
  unregister();
  hotkeys.register([hotkey("Shift+Ctrl+f")], () => calls++);
  unregister();
  hotkeys.onKeyDown(keydown("F", { ctrlKey: true, shiftKey: true }));
  assert.equal(calls, 2);
});

test("punctuation requires explicit modifiers and extra modifiers do not match", () => {
  const hotkeys = new Hotkeys();
  let calls = 0;
  hotkeys.register([hotkey("Ctrl+Shift+?"), hotkey("Ctrl+Shift+Plus")], () => calls++);
  for (const key of ["?", "+"]) {
    for (const options of [{ ctrlKey: true }, { ctrlKey: true, shiftKey: true, altKey: true }]) {
      const event = keydown(key, options);
      hotkeys.onKeyDown(event);
      assert.equal(event.defaultPrevented, false);
    }
    const event = keydown(key, { ctrlKey: true, shiftKey: true });
    hotkeys.onKeyDown(event);
    assert.equal(event.defaultPrevented, true);
  }
  assert.equal(calls, 2);
});

test("modified shortcuts still respect typing, composition, repeats and native activation", () => {
  const hotkeys = new Hotkeys();
  hotkeys.register([hotkey("Ctrl+x"), hotkey("Shift+Space"), hotkey("Ctrl+Enter")], () => assert.fail());
  for (const target of [element("INPUT"), element("TEXTAREA"), element("SELECT"), element("DIV", true)]) {
    const event = keydown("x", { ctrlKey: true }, [element("SPAN"), target]);
    hotkeys.onKeyDown(event);
    assert.equal(event.defaultPrevented, false);
  }
  for (const property of ["repeat", "isComposing"] as const) {
    const event = keydown("x", { ctrlKey: true, [property]: true });
    hotkeys.onKeyDown(event);
    assert.equal(event.defaultPrevented, false);
  }
  const prevented = keydown("x", { ctrlKey: true });
  prevented.preventDefault();
  hotkeys.onKeyDown(prevented);
  for (const tag of ["BUTTON", "A", "SUMMARY"]) {
    for (const event of [
      keydown(" ", { shiftKey: true }, [element(tag)]),
      keydown("Enter", { ctrlKey: true }, [element(tag)]),
    ]) {
      hotkeys.onKeyDown(event);
      assert.equal(event.defaultPrevented, false);
    }
  }
});
