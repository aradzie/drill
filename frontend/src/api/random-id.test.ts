import assert from "node:assert/strict";
import { test } from "node:test";
import { randomId } from "./random-id.ts";

test("generates distinct alphanumeric IDs with the default length", () => {
  const ids = Array.from({ length: 100 }, () => randomId());
  for (const id of ids) {
    assert.match(id, /^[a-zA-Z0-9]{10}$/);
  }
  assert.equal(new Set(ids).size, ids.length);
});

test("refills the buffer for long IDs and after rejecting a whole batch", (t) => {
  let fills = 0;
  t.mock.getter(globalThis, "crypto", () => ({
    getRandomValues(bytes: Uint8Array) {
      assert.ok(bytes.byteLength <= 1024);
      fills += 1;
      return bytes.fill(fills === 1 ? 255 : 0);
    },
  }));

  assert.equal(randomId(65_537), "a".repeat(65_537));
  assert.ok(fills > 2);
});
