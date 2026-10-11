import assert from "node:assert/strict";
import { test } from "node:test";

import {
  EXAMPLE_PROGRAM,
  LINE,
  editProgram,
  parseIndex,
  programLines,
  runSnapshots,
} from "./array-indexing.ts";
import { type CodeLine } from "./c-syntax.ts";

const text = (line: CodeLine | undefined) =>
  typeof line === "string"
    ? line
    : (line ?? [])
        .map((part) => (typeof part === "string" ? part : part.text))
        .join("");

const roles = (line: CodeLine | undefined) =>
  typeof line === "string"
    ? []
    : (line ?? []).flatMap((part) =>
        typeof part === "string" ? [] : [`${part.role}:${part.text}`],
      );

test("the program spells valid C from the definition", () => {
  const lines = programLines(EXAMPLE_PROGRAM, false).map(text);
  assert.deepEqual(lines, [
    "#include <stdio.h>",
    "",
    "int main() {",
    "    int nilai[5] = {12, 45, 78, 34, 99};",
    "    int x = nilai[2];",
    '    printf("nilai[%d] = %d\\n", 2, x);',
    "    return 0;",
    "}",
  ]);
});

test("the read Value is marked in the code only once the run has read it", () => {
  const before = programLines(EXAMPLE_PROGRAM, false);
  const after = programLines(EXAMPLE_PROGRAM, true);
  assert.deepEqual(roles(before[LINE.declare]), ["variable:nilai"]);
  assert.deepEqual(roles(after[LINE.declare]), ["variable:nilai", "value:78"]);
  assert.deepEqual(roles(after[LINE.access]), ["variable:nilai", "index:2"]);
});

test("each step stops on the line it describes", () => {
  const lines = programLines(EXAMPLE_PROGRAM, false).map(text);
  const stops = runSnapshots(EXAMPLE_PROGRAM).map((step) => lines[step.line]);
  assert.match(stops[0] ?? "", /int main\(\)/);
  assert.match(stops[1] ?? "", /int nilai\[5\]/);
  assert.match(stops[2] ?? "", /int x = nilai\[2\]/);
  assert.match(stops[3] ?? "", /printf/);
});

test("nothing is declared, read or printed before its step", () => {
  const [start, declare, read, print] = runSnapshots(EXAMPLE_PROGRAM);
  assert.deepEqual(
    [start, declare, read, print].map((step) => [
      step?.isDeclared,
      step?.readIndex,
      step?.result,
      step?.output,
    ]),
    [
      [false, null, null, ""],
      [true, null, null, ""],
      [true, 2, 78, ""],
      [true, 2, 78, "nilai[2] = 78"],
    ],
  );
});

test("the same program always gives the same run", () => {
  assert.deepEqual(
    runSnapshots(EXAMPLE_PROGRAM),
    runSnapshots({ ...EXAMPLE_PROGRAM }),
  );
});

test("an edit that changes nothing returns null, so the run keeps going", () => {
  assert.equal(
    editProgram(EXAMPLE_PROGRAM, { kind: "value", index: 2, value: 78 }),
    null,
  );
  assert.equal(
    editProgram(EXAMPLE_PROGRAM, { kind: "select", index: 2 }),
    null,
  );
  assert.equal(
    editProgram(EXAMPLE_PROGRAM, { kind: "rename", name: " nilai " }),
    null,
  );
  assert.equal(
    editProgram(EXAMPLE_PROGRAM, { kind: "resize", length: 5 }),
    null,
  );
  assert.equal(editProgram(EXAMPLE_PROGRAM, { kind: "restore" }), null);
});

test("invalid edits are refused and leave the program alone", () => {
  for (const name of ["", "2nilai", "int", "x", "printf", "nilai skor"]) {
    assert.equal(
      editProgram(EXAMPLE_PROGRAM, { kind: "rename", name }),
      null,
      name,
    );
  }
  assert.equal(
    editProgram(EXAMPLE_PROGRAM, { kind: "select", index: 5 }),
    null,
  );
  assert.equal(
    editProgram(EXAMPLE_PROGRAM, { kind: "select", index: -1 }),
    null,
  );
  assert.equal(
    editProgram(EXAMPLE_PROGRAM, { kind: "value", index: 9, value: 1 }),
    null,
  );
  assert.equal(
    editProgram(EXAMPLE_PROGRAM, { kind: "value", index: 0, value: 1.5 }),
    null,
  );
  assert.equal(
    editProgram(EXAMPLE_PROGRAM, { kind: "value", index: 0, value: 2 ** 31 }),
    null,
  );
});

test("a real edit returns the new program", () => {
  assert.deepEqual(
    editProgram(EXAMPLE_PROGRAM, { kind: "value", index: 0, value: -7 })
      ?.program.values,
    [-7, 45, 78, 34, 99],
  );
  assert.equal(
    editProgram(EXAMPLE_PROGRAM, { kind: "rename", name: "skor" })?.program
      .arrayName,
    "skor",
  );
  assert.equal(
    editProgram(EXAMPLE_PROGRAM, { kind: "select", index: 4 })?.program.index,
    4,
  );
  const edited = { ...EXAMPLE_PROGRAM, arrayName: "skor" };
  assert.deepEqual(
    editProgram(edited, { kind: "restore" })?.program,
    EXAMPLE_PROGRAM,
  );
});

test("growing keeps every Value and gives each new element its own", () => {
  const grown = editProgram(EXAMPLE_PROGRAM, { kind: "resize", length: 8 });
  assert.deepEqual(grown?.program.values, [12, 45, 78, 34, 99, 50, 60, 70]);
  assert.equal(grown?.program.index, 2);
  assert.equal(grown?.movedIndex, null);
  assert.equal(
    text(programLines(grown?.program ?? EXAMPLE_PROGRAM, false)[LINE.declare]),
    "    int nilai[8] = {12, 45, 78, 34, 99, 50, 60, 70};",
  );
});

test("shrinking keeps the first Values and pulls the Index back inside", () => {
  const atEnd = { ...EXAMPLE_PROGRAM, index: 4 };
  const shrunk = editProgram(atEnd, { kind: "resize", length: 3 });
  assert.deepEqual(shrunk?.program.values, [12, 45, 78]);
  assert.equal(shrunk?.program.index, 2);
  assert.deepEqual(shrunk?.movedIndex, { from: 4, to: 2 });
  assert.equal(
    editProgram(EXAMPLE_PROGRAM, { kind: "resize", length: 3 })?.movedIndex,
    null,
  );
});

test("the length stays between 1 and 8", () => {
  assert.equal(
    editProgram(EXAMPLE_PROGRAM, { kind: "resize", length: 0 })?.program.values
      .length,
    1,
  );
  assert.equal(
    editProgram(EXAMPLE_PROGRAM, { kind: "resize", length: 20 })?.program.values
      .length,
    8,
  );
});

test("parseIndex accepts the array's Indexes and explains the rest", () => {
  assert.deepEqual(parseIndex(" 4 ", 5), { ok: true, value: 4 });
  const outside = parseIndex("5", 5);
  assert.equal(outside.ok, false);
  assert.match(
    outside.ok ? "" : outside.error,
    /0 sampai 4.*undefined behavior/,
  );
  const single = parseIndex("-1", 1);
  assert.match(single.ok ? "" : single.error, /Index-nya cuma 0\)/);
  assert.equal(parseIndex("", 5).ok, false);
  assert.equal(parseIndex("2.5", 5).ok, false);
});
