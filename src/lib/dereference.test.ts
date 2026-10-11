import assert from "node:assert/strict";
import { test } from "node:test";

import { lineText } from "./c-syntax.ts";
import {
  EXAMPLE_PROGRAM,
  LINE,
  editProgram,
  programLines,
  runSnapshots,
} from "./dereference.ts";

const output = (step: { terminal: readonly { text: string }[] } | undefined) =>
  (step?.terminal ?? []).map((piece) => piece.text).join("");

test("the code is valid C built from the definition", () => {
  assert.deepEqual(programLines(EXAMPLE_PROGRAM).map(lineText), [
    "#include <stdio.h>",
    "",
    "int main() {",
    "    int angka = 10;",
    "    int *ptr = &angka;",
    '    printf("%d\\n", *ptr);',
    "    *ptr = 20;",
    '    printf("%d\\n", angka);',
    "    return 0;",
    "}",
  ]);
});

test("reading *ptr: the Address first, then the Value, then printf", () => {
  const run = runSnapshots(EXAMPLE_PROGRAM);
  const byPhase = new Map(run.map((step) => [step.phase, step]));
  assert.equal(byPhase.get("read-address")?.part, "*ptr");
  assert.equal(output(byPhase.get("read-address")), "");
  assert.equal(output(byPhase.get("read-value")), "10\n");
  assert.equal(byPhase.get("pointer")?.part, "int *ptr");
});

test("*ptr = … changes the target's Value and never the Pointer", () => {
  const run = runSnapshots(EXAMPLE_PROGRAM);
  const pointerValues = run.map((step) => step.pointerValue);
  assert.deepEqual(pointerValues, [null, null, 1000, 1000, 1000, 1000, 1000]);
  assert.deepEqual(
    run.map((step) => step.value),
    [10, 10, 10, 10, 10, 20, 20],
  );
  assert.equal(output(run.at(-1)), "10\n20\n");
});

test("each step stops on the line it describes", () => {
  const lines = programLines(EXAMPLE_PROGRAM).map(lineText);
  const run = runSnapshots(EXAMPLE_PROGRAM);
  for (const step of run) {
    assert.ok(
      step.part === null || lines[step.line]?.includes(step.part),
      step.phase,
    );
  }
  assert.equal(run.find((step) => step.phase === "write")?.line, LINE.write);
  assert.equal(run.at(-1)?.line, LINE.printName);
});

test("edits keep references valid and names apart", () => {
  const renamed = editProgram(EXAMPLE_PROGRAM, {
    kind: "rename",
    target: "pointer",
    name: "p",
  });
  const lines = programLines(renamed?.program ?? EXAMPLE_PROGRAM).map(lineText);
  assert.equal(lines[LINE.printTarget], '    printf("%d\\n", *p);');
  assert.equal(lines[LINE.write], "    *p = 20;");
  assert.equal(
    runSnapshots(renamed?.program ?? EXAMPLE_PROGRAM).find(
      (s) => s.phase === "write",
    )?.part,
    "*p = 20",
  );
  assert.equal(
    editProgram(EXAMPLE_PROGRAM, {
      kind: "rename",
      target: "name",
      name: "printf",
    }),
    null,
  );
  assert.equal(
    editProgram(EXAMPLE_PROGRAM, {
      kind: "value",
      target: "newValue",
      value: 20,
    }),
    null,
  );
  const written = editProgram(EXAMPLE_PROGRAM, {
    kind: "value",
    target: "newValue",
    value: -1,
  });
  assert.equal(
    output(runSnapshots(written?.program ?? EXAMPLE_PROGRAM).at(-1)),
    "10\n-1\n",
  );
  assert.equal(editProgram(EXAMPLE_PROGRAM, { kind: "restore" }), null);
});
