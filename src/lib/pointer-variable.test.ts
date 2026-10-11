import assert from "node:assert/strict";
import { test } from "node:test";

import { lineText } from "./c-syntax.ts";
import {
  EXAMPLE_PROGRAM,
  LINE,
  editProgram,
  programLines,
  runSnapshots,
} from "./pointer-variable.ts";

test("the code is valid C built from the definition", () => {
  assert.deepEqual(programLines(EXAMPLE_PROGRAM).map(lineText), [
    "#include <stdio.h>",
    "",
    "int main() {",
    "    int angka = 10;",
    "    int *ptr = &angka;",
    "    return 0;",
    "}",
  ]);
});

test("the variable exists before the Pointer, and &angka comes before the Pointer holds it", () => {
  const run = runSnapshots(EXAMPLE_PROGRAM);
  assert.deepEqual(
    run.map((step) => [
      step.phase,
      step.isDeclared,
      step.address,
      step.pointerValue,
    ]),
    [
      ["start", false, null, null],
      ["declare", true, null, null],
      ["address", true, 1000, null],
      ["pointer", true, 1000, 1000],
    ],
  );
  const lines = programLines(EXAMPLE_PROGRAM).map(lineText);
  for (const step of run) {
    assert.ok(step.part === null || lines[step.line]?.includes(step.part));
  }
  assert.equal(run[1]?.line, LINE.declare);
});

test("the Pointer holds the Address, never the Value", () => {
  for (const value of [10, 1000, -5]) {
    const last = runSnapshots({ ...EXAMPLE_PROGRAM, value }).at(-1);
    assert.equal(last?.pointerValue, 1000);
  }
});

test("renames keep every reference and the two names apart", () => {
  const renamed = editProgram(EXAMPLE_PROGRAM, {
    kind: "rename",
    target: "name",
    name: "skor",
  });
  assert.equal(
    lineText(programLines(renamed?.program ?? EXAMPLE_PROGRAM)[4] ?? ""),
    "    int *ptr = &skor;",
  );
  assert.equal(
    runSnapshots(renamed?.program ?? EXAMPLE_PROGRAM)[2]?.part,
    "&skor",
  );
  const pointer = editProgram(EXAMPLE_PROGRAM, {
    kind: "rename",
    target: "pointer",
    name: "p",
  });
  assert.equal(
    runSnapshots(pointer?.program ?? EXAMPLE_PROGRAM)[3]?.part,
    "int *p",
  );
  assert.equal(
    editProgram(EXAMPLE_PROGRAM, {
      kind: "rename",
      target: "pointer",
      name: "angka",
    }),
    null,
  );
  assert.equal(
    editProgram(EXAMPLE_PROGRAM, {
      kind: "rename",
      target: "name",
      name: "ptr",
    }),
    null,
  );
  assert.equal(
    editProgram(EXAMPLE_PROGRAM, {
      kind: "rename",
      target: "name",
      name: "main",
    }),
    null,
  );
});

test("value edits: same or invalid ones change nothing", () => {
  assert.equal(
    editProgram(EXAMPLE_PROGRAM, { kind: "value", value: 10 }),
    null,
  );
  assert.equal(
    editProgram(EXAMPLE_PROGRAM, { kind: "value", value: 1.5 }),
    null,
  );
  assert.equal(
    lineText(
      programLines(
        editProgram(EXAMPLE_PROGRAM, { kind: "value", value: -4 })?.program ??
          EXAMPLE_PROGRAM,
      )[3] ?? "",
    ),
    "    int angka = -4;",
  );
  assert.equal(editProgram(EXAMPLE_PROGRAM, { kind: "restore" }), null);
});
