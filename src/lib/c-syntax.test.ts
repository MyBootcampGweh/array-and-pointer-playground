import assert from "node:assert/strict";
import { test } from "node:test";

import { sliceTokens, tokenise } from "./c-syntax.ts";

const kinds = (line: string) =>
  tokenise(line)
    .filter((token) => token.kind !== "plain")
    .map((token) => `${token.kind}:${token.text}`);

test("tokenise colours a for header like MBG's editor", () => {
  assert.deepEqual(kinds("for (int i = 0; i < ukuran_array; i++) {"), [
    "keyword:for",
    "type:int",
    "definition:i",
    "number:0",
  ]);
});

test("tokenise handles declarations, calls and strings", () => {
  assert.deepEqual(kinds("int *ptr = &angka;"), ["type:int", "definition:ptr"]);
  assert.deepEqual(kinds('printf("%d for int", nilai[2]); // 30'), [
    "function:printf",
    'string:"%d for int"',
    "number:2",
    "comment:// 30",
  ]);
  assert.deepEqual(kinds("int nilai2[5];"), [
    "type:int",
    "definition:nilai2",
    "number:5",
  ]);
});

test("tokenise never loses characters", () => {
  const line = '    scanf("%d", &nilai[i]);';
  assert.equal(
    tokenise(line)
      .map((token) => token.text)
      .join(""),
    line,
  );
});

test("sliceTokens cuts tokens at the slice edges", () => {
  const line = "for (int i = 0; i < 5; i++) {";
  const start = line.indexOf("int i = 0");
  const part = sliceTokens(tokenise(line), start, start + "int i".length);
  assert.deepEqual(part, [
    { kind: "type", text: "int" },
    { kind: "plain", text: " " },
    { kind: "definition", text: "i" },
  ]);
  assert.deepEqual(sliceTokens(tokenise("int x;"), 1, 2), [
    { kind: "type", text: "n" },
  ]);
});
