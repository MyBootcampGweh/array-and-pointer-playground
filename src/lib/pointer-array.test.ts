import assert from "node:assert/strict";
import { test } from "node:test";

import { lineText } from "./c-syntax.ts";
import { addressOf } from "./memory.ts";
import {
  EXAMPLE_PROGRAM,
  LINE,
  editProgram,
  maxOffset,
  parseOffset,
  programLines,
  runSnapshots,
} from "./pointer-array.ts";

const output = (step: { terminal: readonly { text: string }[] } | undefined) =>
  (step?.terminal ?? []).map((piece) => piece.text).join("");

test("the code is valid C built from the definition", () => {
  assert.deepEqual(programLines(EXAMPLE_PROGRAM, null).map(lineText), [
    "#include <stdio.h>",
    "",
    "int main() {",
    "    int nilai[5] = {10, 20, 30, 40, 50};",
    "    int *ptr = nilai;",
    '    printf("%d\\n", nilai[1]);',
    '    printf("%d\\n", *(ptr + 1));',
    "    ptr++;",
    '    printf("%d\\n", *(ptr + 1));',
    "    return 0;",
    "}",
  ]);
});

test("nilai[k] and *(ptr + k) read the same element only while ptr is at element 0", () => {
  const steps = new Map(
    runSnapshots(EXAMPLE_PROGRAM).map((step) => [step.phase, step]),
  );
  assert.equal(steps.get("point")?.pointerAt, 0);
  assert.equal(steps.get("index")?.readIndex, 1);
  assert.equal(steps.get("deref")?.readIndex, 1);
  assert.equal(steps.get("deref")?.pointerAt, 0);
  assert.equal(steps.get("increment")?.pointerAt, 1);
  assert.equal(steps.get("deref-moved")?.readIndex, 2);
  assert.equal(output(steps.get("deref-moved")), "20\n20\n30\n");
});

test("ptr + k moves k ints: 4 bytes each in this simulation", () => {
  for (const offset of [0, 1, 3]) {
    const program = { ...EXAMPLE_PROGRAM, offset };
    const run = runSnapshots(program);
    const deref = run.find((step) => step.phase === "deref");
    const moved = run.find((step) => step.phase === "deref-moved");
    assert.equal(addressOf(deref?.probe ?? -1), 1000 + offset * 4);
    assert.equal(addressOf(moved?.probe ?? -1), 1004 + offset * 4);
  }
  const increment = runSnapshots(EXAMPLE_PROGRAM).find(
    (step) => step.phase === "increment",
  );
  assert.equal(addressOf(increment?.pointerAt ?? -1), 1004);
});

test("every read stays inside the array, for every length and allowed k", () => {
  for (let length = 2; length <= 8; length++) {
    const values = Array.from({ length }, (_, i) => i);
    for (let offset = 0; offset <= maxOffset(length); offset++) {
      for (const step of runSnapshots({ ...EXAMPLE_PROGRAM, values, offset })) {
        if (step.readIndex !== null) {
          assert.ok(step.readIndex >= 0 && step.readIndex < length);
        }
        assert.ok(step.pointerAt === null || step.pointerAt < length);
      }
    }
  }
});

test("k past the end is refused; the message keeps one-past-the-end Pointers legal", () => {
  assert.deepEqual(parseOffset("3", 5, "ptr"), { ok: true, value: 3 });
  const tooFar = parseOffset("4", 5, "ptr");
  assert.equal(tooFar.ok, false);
  const error = tooFar.ok ? "" : tooFar.error;
  assert.match(error, /\*\(ptr \+ 4\) baca \[5\]/);
  assert.match(error, /undefined behavior/);
  assert.match(error, /boleh nunjuk satu langkah lewat ujung/);
  assert.equal(parseOffset("-1", 5, "ptr").ok, false);
  assert.equal(parseOffset("1.5", 5, "ptr").ok, false);
  assert.equal(parseOffset("0", 2, "p").ok, true);
  assert.equal(parseOffset("1", 2, "p").ok, false);
});

test("edits: shrinking pulls k back and says so; names stay apart", () => {
  const far = editProgram(EXAMPLE_PROGRAM, { kind: "offset", offset: 3 });
  assert.equal(far?.program.offset, 3);
  const shrunk = editProgram(far?.program ?? EXAMPLE_PROGRAM, {
    kind: "resize",
    length: 3,
  });
  assert.equal(shrunk?.program.offset, 1);
  assert.match(shrunk?.notice ?? "", /k pindah ke 1/);
  assert.equal(
    editProgram(EXAMPLE_PROGRAM, { kind: "resize", length: 1 })?.program.values
      .length,
    2,
  );
  assert.equal(
    editProgram(EXAMPLE_PROGRAM, { kind: "offset", offset: 4 }),
    null,
  );
  assert.equal(
    editProgram(EXAMPLE_PROGRAM, { kind: "offset", offset: 1 }),
    null,
  );
  assert.equal(
    editProgram(EXAMPLE_PROGRAM, {
      kind: "rename",
      target: "pointer",
      name: "nilai",
    }),
    null,
  );
  const renamed = editProgram(EXAMPLE_PROGRAM, {
    kind: "rename",
    target: "pointer",
    name: "p",
  });
  const lines = programLines(renamed?.program ?? EXAMPLE_PROGRAM, null).map(
    lineText,
  );
  assert.equal(lines[LINE.pointer], "    int *p = nilai;");
  assert.equal(lines[LINE.increment], "    p++;");
  assert.equal(
    runSnapshots(renamed?.program ?? EXAMPLE_PROGRAM).find(
      (s) => s.phase === "deref",
    )?.part,
    "*(p + 1)",
  );
  assert.equal(editProgram(EXAMPLE_PROGRAM, { kind: "restore" }), null);
});
