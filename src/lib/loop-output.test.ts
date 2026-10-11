import assert from "node:assert/strict";
import { test } from "node:test";

import { lineText } from "./c-syntax.ts";
import {
  EXAMPLE_PROGRAM,
  LINE,
  editProgram,
  programLines,
  runSnapshots,
} from "./loop-output.ts";

const output = (step: { terminal: readonly { text: string }[] } | undefined) =>
  (step?.terminal ?? []).map((piece) => piece.text).join("");

test("the code is valid C and the loop bound is the array's length", () => {
  assert.deepEqual(programLines(EXAMPLE_PROGRAM, null).map(lineText), [
    "#include <stdio.h>",
    "",
    "int main() {",
    "    int nilai[5] = {10, 20, 30, 40, 50};",
    "    for (int i = 0; i < 5; i++) {",
    '        printf("%d ", nilai[i]);',
    "    }",
    "    return 0;",
    "}",
  ]);
});

test("a full run: init, check → printf → i++ per element, then a false check", () => {
  for (const length of [1, 2, 5, 8]) {
    const values = Array.from({ length }, (_, i) => i * 3);
    const run = runSnapshots({ arrayName: "a", values });
    assert.equal(run.length, 3 + 3 * length + 2);
    assert.deepEqual(
      run.slice(-2).map((step) => [step.phase, step.i, step.condition]),
      [
        ["check", length, false],
        ["end", length, null],
      ],
    );
    assert.deepEqual(
      run.filter((step) => step.phase === "print").map((s) => s.readIndex),
      values.map((_, i) => i),
    );
  }
});

test("Output grows by one Value per printf, and a step back shows it shorter", () => {
  const run = runSnapshots(EXAMPLE_PROGRAM);
  const prints = run
    .map((step, at) => [step, at] as const)
    .filter(([step]) => step.phase === "print");
  assert.deepEqual(
    prints.map(([step]) => output(step)),
    ["10 ", "10 20 ", "10 20 30 ", "10 20 30 40 ", "10 20 30 40 50 "],
  );
  const [, second] = prints[1] ?? [];
  assert.equal(output(run[(second ?? 0) - 1]), "10 ");
  assert.equal(output(run[0]), "");
  assert.equal(output(run.at(-1)), "10 20 30 40 50 ");
});

test("reading never changes the array; the code marks the Value being read", () => {
  const run = runSnapshots(EXAMPLE_PROGRAM);
  assert.ok(run.every((step) => step.line !== LINE.declare || step.isDeclared));
  assert.equal(run[0].isDeclared, false);
  const line = programLines(EXAMPLE_PROGRAM, 3)[LINE.declare];
  const marked =
    typeof line === "string" || line === undefined
      ? []
      : line.filter(
          (part) => typeof part !== "string" && part.role === "value",
        );
  assert.deepEqual(marked, [{ text: "40", role: "value" }]);
});

test("each step stops on the line it describes", () => {
  const lines = programLines(EXAMPLE_PROGRAM, null).map(lineText);
  for (const step of runSnapshots(EXAMPLE_PROGRAM)) {
    const line = lines[step.line] ?? "";
    assert.ok(step.part === null || line.includes(step.part), step.phase);
    if (step.phase === "print") {
      assert.match(line, /printf/);
    }
  }
});

test("edits: unchanged or invalid ones return null, real ones the new program", () => {
  assert.equal(
    editProgram(EXAMPLE_PROGRAM, { kind: "value", index: 1, value: 20 }),
    null,
  );
  assert.equal(
    editProgram(EXAMPLE_PROGRAM, { kind: "value", index: 5, value: 1 }),
    null,
  );
  assert.equal(
    editProgram(EXAMPLE_PROGRAM, { kind: "value", index: 0, value: 0.5 }),
    null,
  );
  assert.equal(
    editProgram(EXAMPLE_PROGRAM, { kind: "rename", name: "printf" }),
    null,
  );
  assert.equal(
    editProgram(EXAMPLE_PROGRAM, { kind: "resize", length: 5 }),
    null,
  );
  const grown = editProgram(EXAMPLE_PROGRAM, { kind: "resize", length: 7 });
  assert.deepEqual(grown?.program.values, [10, 20, 30, 40, 50, 50, 60]);
  assert.equal(
    lineText(
      programLines(grown?.program ?? EXAMPLE_PROGRAM, null)[LINE.loop] ?? "",
    ),
    "    for (int i = 0; i < 7; i++) {",
  );
  assert.deepEqual(
    editProgram(EXAMPLE_PROGRAM, { kind: "resize", length: 2 })?.program.values,
    [10, 20],
  );
  const renamed = editProgram(EXAMPLE_PROGRAM, {
    kind: "rename",
    name: "skor",
  });
  assert.match(
    lineText(
      programLines(renamed?.program ?? EXAMPLE_PROGRAM, null)[LINE.print] ?? "",
    ),
    /printf\("%d ", skor\[i\]\);/,
  );
});
