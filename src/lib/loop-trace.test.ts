import assert from "node:assert/strict";
import { test } from "node:test";

import { traceForLoop } from "./loop-trace.ts";

const lengths = [1, 2, 5, 8];

test("runs init, then check → body → increment, and ends on a false check", () => {
  for (const length of lengths) {
    const values = Array.from({ length }, (_, i) => (i + 1) * 10);
    const frames = traceForLoop("input", values);
    const phases = frames.map((frame) => frame.phase);

    assert.equal(frames.length, 3 * length + 3);
    assert.deepEqual(phases.slice(0, 4), [
      "init",
      "check",
      "body",
      "increment",
    ]);
    assert.deepEqual(phases.slice(-2), ["check", "done"]);

    const finalCheck = frames.at(-2);
    assert.equal(finalCheck?.i, length);
    assert.equal(finalCheck?.condition, false);
  }
});

test("the body never touches index ukuran_array", () => {
  for (const length of lengths) {
    const values = Array.from({ length }, (_, i) => i);
    for (const kind of ["input", "output"] as const) {
      const touched = traceForLoop(kind, values)
        .filter((frame) => frame.phase === "body")
        .map((frame) => frame.activeIndex);
      assert.deepEqual(
        touched,
        values.map((_, i) => i),
      );
    }
  }
});

test("input loop fills one element per body step", () => {
  const frames = traceForLoop("input", [10, 20, 30]);
  assert.deepEqual(frames[0]?.cells, [null, null, null]);
  const bodies = frames.filter((frame) => frame.phase === "body");
  assert.deepEqual(bodies[0]?.cells, [10, null, null]);
  assert.deepEqual(frames.at(-1)?.cells, [10, 20, 30]);
});

test('output loop prints exactly what printf("%d ") would', () => {
  const frames = traceForLoop("output", [10, 20, 30, 40, 50]);
  assert.equal(frames[0]?.output, "");
  const bodies = frames.filter((frame) => frame.phase === "body");
  assert.equal(bodies[1]?.output, "10 20 ");
  assert.equal(frames.at(-1)?.output, "10 20 30 40 50 ");
});
