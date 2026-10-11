import assert from "node:assert/strict";
import { test } from "node:test";

import { lineText } from "./c-syntax.ts";
import {
  ADDRESSES,
  EXAMPLE_PROGRAM,
  LINE,
  editProgram,
  programLines,
  runSnapshots,
} from "./pointer-target.ts";

test("the code is valid C built from the definition", () => {
  assert.deepEqual(programLines(EXAMPLE_PROGRAM).map(lineText), [
    "#include <stdio.h>",
    "",
    "int main() {",
    "    int angkaA = 10;",
    "    int angkaB = 25;",
    "    int *ptr = &angkaA;",
    "    ptr = &angkaB;",
    "    *ptr = 30;",
    '    printf("%d %d\\n", angkaA, angkaB);',
    "    return 0;",
    "}",
  ]);
});

test("the two variables have their own Addresses", () => {
  assert.equal(ADDRESSES.a, 1000);
  assert.equal(ADDRESSES.b, 1004);
});

test("redirecting changes only the Pointer; writing changes only the target", () => {
  const run = runSnapshots(EXAMPLE_PROGRAM);
  const steps = new Map(run.map((step) => [step.phase, step]));
  const point = steps.get("point");
  const redirect = steps.get("redirect");
  const write = steps.get("write");
  assert.equal(point?.target, "a");
  assert.equal(redirect?.target, "b");
  // ptr = &angkaB: both Values stay.
  assert.deepEqual(redirect?.values, point?.values);
  assert.deepEqual(redirect?.values, { a: 10, b: 25 });
  // *ptr = 30: the target changes, the Pointer does not.
  assert.equal(write?.target, "b");
  assert.deepEqual(write?.values, { a: 10, b: 30 });
  assert.equal(
    run
      .at(-1)
      ?.terminal.map((piece) => piece.text)
      .join(""),
    "10 30\n",
  );
});

test("nothing exists before its declaration, and the Pointer comes after both", () => {
  const run = runSnapshots(EXAMPLE_PROGRAM);
  assert.deepEqual(
    run.map((step) => [step.declared, step.target]),
    [
      [0, null],
      [1, null],
      [2, null],
      [2, "a"],
      [2, "b"],
      [2, "b"],
      [2, "b"],
    ],
  );
  const lines = programLines(EXAMPLE_PROGRAM).map(lineText);
  for (const step of run) {
    assert.ok(
      step.part === null || lines[step.line]?.includes(step.part),
      step.phase,
    );
  }
  assert.equal(run[4]?.line, LINE.redirect);
});

test("renames follow A and B, and keep all three names apart", () => {
  const renamed = editProgram(EXAMPLE_PROGRAM, {
    kind: "rename",
    target: "nameB",
    name: "skor",
  });
  const program = renamed?.program ?? EXAMPLE_PROGRAM;
  const lines = programLines(program).map(lineText);
  assert.equal(lines[LINE.redirect], "    ptr = &skor;");
  assert.equal(lines[LINE.print], '    printf("%d %d\\n", angkaA, skor);');
  assert.equal(runSnapshots(program)[4]?.part, "ptr = &skor");
  for (const name of ["angkaA", "ptr", "printf", "main"]) {
    assert.equal(
      editProgram(EXAMPLE_PROGRAM, { kind: "rename", target: "nameB", name }),
      null,
      name,
    );
  }
  assert.equal(
    editProgram(EXAMPLE_PROGRAM, {
      kind: "value",
      target: "valueA",
      value: 10,
    }),
    null,
  );
  const written = editProgram(EXAMPLE_PROGRAM, {
    kind: "value",
    target: "newValue",
    value: -2,
  });
  assert.deepEqual(
    runSnapshots(written?.program ?? EXAMPLE_PROGRAM).at(-1)?.values,
    {
      a: 10,
      b: -2,
    },
  );
  assert.equal(editProgram(EXAMPLE_PROGRAM, { kind: "restore" }), null);
});
