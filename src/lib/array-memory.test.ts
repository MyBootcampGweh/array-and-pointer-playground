import assert from "node:assert/strict";
import { test } from "node:test";

import {
  EXAMPLE_PROGRAM,
  LINE,
  editProgram,
  programLines,
  runSnapshots,
} from "./array-memory.ts";
import { lineText } from "./c-syntax.ts";
import { addressOf } from "./memory.ts";

test("the code is valid C built from the definition", () => {
  assert.deepEqual(programLines(EXAMPLE_PROGRAM, false).map(lineText), [
    "#include <stdio.h>",
    "",
    "int main() {",
    "    int nilai[5] = {10, 20, 30, 40, 50};",
    '    printf("%d\\n", nilai[2]);',
    "    return 0;",
    "}",
  ]);
});

test("Addresses are contiguous, 4 bytes apart, and never overlap", () => {
  for (const length of [1, 5, 8]) {
    const addresses = Array.from({ length }, (_, i) => addressOf(i));
    assert.equal(new Set(addresses).size, length);
    addresses.forEach((address, i) => {
      assert.equal(address, 1000 + 4 * i);
      // Each int's 4 bytes end right where the next one starts.
      const next = addresses[i + 1];
      if (next !== undefined) assert.equal(address + 4, next);
    });
  }
});

test("the run works out the Address first, then reads and prints", () => {
  const [start, declare, locate, print] = runSnapshots(EXAMPLE_PROGRAM);
  assert.deepEqual(
    [start, declare, locate, print].map((step) => [
      step?.phase,
      step?.isDeclared,
      step?.address,
      step?.result,
      step?.terminal.map((piece) => piece.text).join(""),
    ]),
    [
      ["start", false, null, null, ""],
      ["declare", true, null, null, ""],
      ["locate", true, 1008, null, ""],
      ["print", true, 1008, 30, "30\n"],
    ],
  );
  const lines = programLines(EXAMPLE_PROGRAM, false).map(lineText);
  assert.match(lines[locate?.line ?? 0] ?? "", /nilai\[2\]/);
  assert.equal(locate?.part, "nilai[2]");
});

test("the Address follows the Index and stays right after resizing", () => {
  const last = editProgram(EXAMPLE_PROGRAM, { kind: "select", index: 4 });
  assert.equal(
    runSnapshots(last?.program ?? EXAMPLE_PROGRAM)[2]?.address,
    1016,
  );
  const shrunk = editProgram(last?.program ?? EXAMPLE_PROGRAM, {
    kind: "resize",
    length: 2,
  });
  assert.equal(shrunk?.program.index, 1);
  assert.equal(
    shrunk?.notice,
    "Index pindah ke 1, soalnya array-nya sekarang cuma 2 elemen.",
  );
  assert.equal(
    runSnapshots(shrunk?.program ?? EXAMPLE_PROGRAM)[2]?.address,
    1004,
  );
  const grown = editProgram(EXAMPLE_PROGRAM, { kind: "resize", length: 8 });
  assert.equal(grown?.notice, null);
  assert.deepEqual(grown?.program.values, [10, 20, 30, 40, 50, 50, 60, 70]);
});

test("the code marks the read Value only after it was read", () => {
  const roles = (isRead: boolean) => {
    const line = programLines(EXAMPLE_PROGRAM, isRead)[LINE.declare];
    return typeof line === "string" || line === undefined
      ? []
      : line.flatMap((part) =>
          typeof part === "string" ? [] : [`${part.role}:${part.text}`],
        );
  };
  assert.deepEqual(roles(false), ["variable:nilai"]);
  assert.deepEqual(roles(true), ["variable:nilai", "value:30"]);
});

test("edits: unchanged or invalid ones return null", () => {
  assert.equal(
    editProgram(EXAMPLE_PROGRAM, { kind: "select", index: 2 }),
    null,
  );
  assert.equal(
    editProgram(EXAMPLE_PROGRAM, { kind: "select", index: 5 }),
    null,
  );
  assert.equal(
    editProgram(EXAMPLE_PROGRAM, { kind: "select", index: -1 }),
    null,
  );
  assert.equal(
    editProgram(EXAMPLE_PROGRAM, { kind: "value", index: 2, value: 30 }),
    null,
  );
  assert.equal(
    editProgram(EXAMPLE_PROGRAM, { kind: "rename", name: "printf" }),
    null,
  );
  assert.equal(editProgram(EXAMPLE_PROGRAM, { kind: "restore" }), null);
  assert.equal(
    editProgram(EXAMPLE_PROGRAM, { kind: "value", index: 2, value: 7 })?.program
      .values[2],
    7,
  );
});
