import assert from "node:assert/strict";
import { test } from "node:test";

import { arrayDeclaration, sliceTokens, tokenise } from "./c-syntax.ts";

const kinds = (line: string) =>
  tokenise(line)
    .filter((token) => token.kind !== "plain")
    .map((token) => `${token.kind}:${token.text}`);

test("tokenise marks types and keywords, nothing else in plain code", () => {
  assert.deepEqual(kinds("for (int i = 0; i < ukuran_array; i++) {"), [
    "keyword:for",
    "keyword:int",
  ]);
  assert.deepEqual(kinds("int *ptr = &angka;"), ["keyword:int"]);
});

test("tokenise keeps keywords inside strings, comments and longer names", () => {
  assert.deepEqual(kinds('printf("%d for int", nilai[2]); // 30'), [
    'string:"%d for int"',
    "comment:// 30",
  ]);
  assert.deepEqual(kinds("int interval = sizeof(x);"), [
    "keyword:int",
    "keyword:sizeof",
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

test("arrayDeclaration spells the C and marks the name and each Value", () => {
  const text = (parts: ReturnType<typeof arrayDeclaration>) =>
    parts.map((part) => (typeof part === "string" ? part : part.text)).join("");
  assert.equal(text(arrayDeclaration("nilai", 5)), "int nilai[5];");
  const filled = arrayDeclaration("skor", 3, [10, -7, 30]);
  assert.equal(text(filled), "int skor[3] = {10, -7, 30};");
  assert.deepEqual(
    filled.flatMap((part) => (typeof part === "string" ? [] : [part.role])),
    ["variable", "value", "value", "value"],
  );
});

test("sliceTokens cuts tokens at the slice edges", () => {
  const line = "for (int i = 0; i < 5; i++) {";
  const start = line.indexOf("int i = 0");
  const part = sliceTokens(tokenise(line), start, start + "int i".length);
  assert.deepEqual(part, [
    { kind: "keyword", text: "int" },
    { kind: "plain", text: " i" },
  ]);
  assert.deepEqual(sliceTokens(tokenise("int x;"), 1, 2), [
    { kind: "keyword", text: "n" },
  ]);
});
