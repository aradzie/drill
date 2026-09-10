import assert from "node:assert/strict";
import { test } from "node:test";
import { randomUuid } from "./random-uuid.ts";

test("generates UUID v4 command IDs when crypto.randomUUID is unavailable", (t) => {
  let fill = 0;
  t.mock.getter(globalThis, "crypto", () => ({
    getRandomValues(bytes: Uint8Array) {
      assert.equal(bytes.length, 16);
      return bytes.fill(fill);
    },
  }));

  assert.equal(randomUuid(), "00000000-0000-4000-8000-000000000000");
  fill = 0xff;
  assert.equal(randomUuid(), "ffffffff-ffff-4fff-bfff-ffffffffffff");
});

test("generates UUID v4 with the runtime random source", () => {
  assert.match(randomUuid(), /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
});
