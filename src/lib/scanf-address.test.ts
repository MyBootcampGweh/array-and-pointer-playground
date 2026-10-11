import assert from "node:assert/strict";
import { test } from "node:test";

import { lineText } from "./c-syntax.ts";
import { withInput } from "./program.ts";
import {
  EXAMPLE_PROGRAM,
  editProgram,
  programLines,
  runSnapshots,
} from "./scanf-address.ts";

const terminal = (
  step: { terminal: readonly { text: string }[] } | undefined,
) => (step?.terminal ?? []).map((piece) => piece.text).join("");

test("the code is valid C and scanf gets the variable's Address", () => {
  assert.deepEqual(programLines(EXAMPLE_PROGRAM).map(lineText), [
    "#include <stdio.h>",
    "",
    "int main() {",
    "    int angka;",
    '    scanf("%d", &angka);',
    '    printf("angka = %d\\n", angka);',
    "    return 0;",
    "}",
  ]);
  const scan = programLines(EXAMPLE_PROGRAM)[4];
  assert.ok(
    typeof scan !== "string" &&
      scan?.some(
        (part) =>
          typeof part !== "string" &&
          part.role === "address" &&
          part.text === "&angka",
      ),
  );
});

test("declared is not initialised: the box exists with no Value until scanf stores one", () => {
  const [start, declare, address, input] = runSnapshots(EXAMPLE_PROGRAM, []);
  assert.deepEqual(
    [start, declare, address, input].map((step) => [
      step?.phase,
      step?.isDeclared,
      step?.value,
      step?.hasDestination,
    ]),
    [
      ["start", false, null, false],
      ["declare", true, null, false],
      ["address", true, null, true],
      ["input", true, null, true],
    ],
  );
  assert.equal(address?.part, "&angka");
});

test("without an answer the run waits at scanf", () => {
  const run = runSnapshots(EXAMPLE_PROGRAM, []);
  assert.equal(run.length, 4);
  assert.equal(run.at(-1)?.inputSlot, 0);
});

test("an answer is stored, echoed, then printed", () => {
  const run = runSnapshots(EXAMPLE_PROGRAM, [42]);
  const [store, print] = run.slice(-2);
  assert.equal(store?.value, 42);
  assert.equal(terminal(store), "42\n");
  assert.equal(print?.value, 42);
  assert.equal(terminal(print), "42\nangka = 42\n");
  assert.equal(print?.hasDestination, false);
});

test("a new answer replays the run; the same answer keeps it", () => {
  const changed = withInput([42], 0, -7);
  assert.deepEqual(changed, [-7]);
  assert.equal(
    terminal(runSnapshots(EXAMPLE_PROGRAM, changed).at(-1)),
    "-7\nangka = -7\n",
  );
  const same = [42];
  assert.equal(withInput(same, 0, 42), same);
});

test("a rename reaches the declaration, &name and printf", () => {
  const result = editProgram(EXAMPLE_PROGRAM, { kind: "rename", name: "umur" });
  const lines = programLines(result?.program ?? EXAMPLE_PROGRAM).map(lineText);
  assert.equal(lines[3], "    int umur;");
  assert.equal(lines[4], '    scanf("%d", &umur);');
  assert.equal(lines[5], '    printf("umur = %d\\n", umur);');
  assert.equal(
    runSnapshots(result?.program ?? EXAMPLE_PROGRAM, [])[2]?.part,
    "&umur",
  );
  for (const name of ["", "scanf", "printf", "int", "angka"]) {
    assert.equal(editProgram(EXAMPLE_PROGRAM, { kind: "rename", name }), null);
  }
  assert.equal(editProgram(EXAMPLE_PROGRAM, { kind: "restore" }), null);
});
