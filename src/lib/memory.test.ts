import assert from "node:assert/strict";
import { test } from "node:test";

import { addressOf, clamp, isInBounds } from "./memory.ts";

test("addresses start at 1000 and grow by sizeof(int)", () => {
  assert.deepEqual(
    [0, 1, 2, 3, 4].map(addressOf),
    [1000, 1004, 1008, 1012, 1016],
  );
});

test("bounds are 0 … length − 1", () => {
  assert.equal(isInBounds(0, 5), true);
  assert.equal(isInBounds(4, 5), true);
  assert.equal(isInBounds(5, 5), false);
  assert.equal(isInBounds(-1, 5), false);
  assert.equal(isInBounds(1.5, 5), false);
});

test("clamp keeps a value inside the range", () => {
  assert.equal(clamp(-2, 0, 4), 0);
  assert.equal(clamp(9, 0, 4), 4);
  assert.equal(clamp(3, 0, 4), 3);
});
