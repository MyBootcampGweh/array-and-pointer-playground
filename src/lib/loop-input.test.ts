import assert from "node:assert/strict";
import { test } from "node:test";

import { lineText } from "./c-syntax.ts";
import {
  EXAMPLE_PROGRAM,
  LINE,
  editProgram,
  programLines,
  runSnapshots,
} from "./loop-input.ts";
import { withInput } from "./program.ts";

const typed = (length: number) =>
  Array.from({ length }, (_, i) => (i + 1) * 10);

test("the code is valid C and the loop bound is the array's length", () => {
  assert.deepEqual(programLines(EXAMPLE_PROGRAM).map(lineText), [
    "#include <stdio.h>",
    "",
    "int main() {",
    "    int nilai[5];",
    "    for (int i = 0; i < 5; i++) {",
    '        scanf("%d", &nilai[i]);',
    "    }",
    "    return 0;",
    "}",
  ]);
  const lines = programLines({ arrayName: "skor", length: 3 }).map(lineText);
  assert.equal(lines[LINE.declare], "    int skor[3];");
  assert.equal(lines[LINE.loop], "    for (int i = 0; i < 3; i++) {");
});

test("a full run: init once, check → scanf → i++ per element, then a false check", () => {
  for (const length of [1, 2, 5, 8]) {
    const run = runSnapshots({ ...EXAMPLE_PROGRAM, length }, typed(length));
    const phases = run.map((step) => step.phase);
    assert.deepEqual(phases.slice(0, 4), ["start", "declare", "init", "check"]);
    assert.equal(run.length, 3 + 4 * length + 2);
    assert.deepEqual(phases.slice(-2), ["check", "end"]);
    const last = run.at(-2);
    assert.equal(last?.i, length);
    assert.equal(last?.condition, false);
    assert.deepEqual(run.at(-1)?.cells, typed(length));
  }
});

test("scanf only ever writes Index 0 … length − 1", () => {
  for (const length of [1, 5, 8]) {
    const run = runSnapshots({ ...EXAMPLE_PROGRAM, length }, typed(length));
    const written = run
      .filter((step) => step.phase === "store")
      .map((step) => step.activeIndex);
    assert.deepEqual(
      written,
      Array.from({ length }, (_, i) => i),
    );
    assert.ok(run.every((step) => (step.cells?.length ?? length) === length));
  }
});

test("each step stops on the line it describes", () => {
  const lines = programLines(EXAMPLE_PROGRAM).map(lineText);
  for (const step of runSnapshots(EXAMPLE_PROGRAM, typed(5))) {
    const line = lines[step.line] ?? "";
    assert.ok(step.part === null || line.includes(step.part), step.phase);
    if (step.phase === "input" || step.phase === "store") {
      assert.match(line, /scanf/);
    }
  }
});

test("nothing exists before its step: no array before the declaration, no i before init", () => {
  const [start, declare, init] = runSnapshots(EXAMPLE_PROGRAM, []);
  assert.equal(start.cells, null);
  assert.deepEqual(declare?.cells, [null, null, null, null, null]);
  assert.equal(declare?.i, null);
  assert.equal(init?.i, 0);
});

test("the run waits at the first scanf nobody has answered, and makes no Value up", () => {
  const waiting = runSnapshots(EXAMPLE_PROGRAM, [7, 8]);
  const last = waiting.at(-1);
  assert.equal(last?.phase, "input");
  assert.equal(last?.inputSlot, 2);
  assert.equal(last?.activeIndex, 2);
  assert.deepEqual(last?.cells, [7, 8, null, null, null]);
  assert.deepEqual(
    last?.terminal.map((piece) => piece.text),
    ["7\n", "8\n"],
  );
  assert.equal(runSnapshots(EXAMPLE_PROGRAM, []).at(-1)?.inputSlot, 0);
});

test("answers become history: the run before a scanf stays, a new answer replays after it", () => {
  const first = runSnapshots(EXAMPLE_PROGRAM, typed(5));
  const slot = 1;
  const changed = withInput(typed(5), slot, 99);
  assert.deepEqual(changed, [10, 99]);
  const replay = runSnapshots(EXAMPLE_PROGRAM, changed);
  const inputAt = first.findIndex(
    (step) => step.phase === "input" && step.inputSlot === slot,
  );
  assert.deepEqual(replay.slice(0, inputAt + 1), first.slice(0, inputAt + 1));
  assert.deepEqual(replay[inputAt + 1]?.cells, [10, 99, null, null, null]);
  assert.equal(replay.at(-1)?.inputSlot, 2);
  // The same answer keeps the rest of the run.
  assert.equal(withInput(typed(5), slot, 20).length, 5);
});

test("edits: unchanged or invalid ones return null, real ones the new program", () => {
  assert.equal(
    editProgram(EXAMPLE_PROGRAM, { kind: "resize", length: 5 }),
    null,
  );
  assert.equal(
    editProgram(EXAMPLE_PROGRAM, { kind: "rename", name: "nilai" }),
    null,
  );
  assert.equal(editProgram(EXAMPLE_PROGRAM, { kind: "restore" }), null);
  for (const name of ["", "i", "scanf", "int", "2x"]) {
    assert.equal(editProgram(EXAMPLE_PROGRAM, { kind: "rename", name }), null);
  }
  assert.equal(
    editProgram(EXAMPLE_PROGRAM, { kind: "resize", length: 12 })?.program
      .length,
    8,
  );
  assert.equal(
    editProgram(EXAMPLE_PROGRAM, { kind: "rename", name: "skor" })?.program
      .arrayName,
    "skor",
  );
  assert.deepEqual(
    editProgram({ arrayName: "skor", length: 2 }, { kind: "restore" })?.program,
    EXAMPLE_PROGRAM,
  );
});
