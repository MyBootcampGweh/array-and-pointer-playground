import assert from "node:assert/strict";
import { test } from "node:test";

import {
  INT_MAX,
  INT_MIN,
  parseIntInput,
  validateIdentifier,
} from "./validation.ts";

test("parseIntInput accepts integers across the whole int range", () => {
  assert.deepEqual(parseIntInput(" 42 "), { ok: true, value: 42 });
  assert.deepEqual(parseIntInput("-7"), { ok: true, value: -7 });
  assert.deepEqual(parseIntInput("+3"), { ok: true, value: 3 });
  assert.deepEqual(parseIntInput("-0"), { ok: true, value: 0 });
  assert.deepEqual(parseIntInput(String(INT_MIN)), {
    ok: true,
    value: INT_MIN,
  });
  assert.deepEqual(parseIntInput(String(INT_MAX)), {
    ok: true,
    value: INT_MAX,
  });
});

test("parseIntInput rejects text, decimals, blanks and overflow", () => {
  for (const raw of ["", "  ", "abc", "1.5", "1e3", "12a", "--1"]) {
    assert.equal(parseIntInput(raw).ok, false, raw);
  }
  assert.equal(parseIntInput(String(INT_MAX + 1)).ok, false);
  assert.equal(parseIntInput(String(INT_MIN - 1)).ok, false);
});

test("validateIdentifier follows C naming rules", () => {
  for (const name of ["nilai", "skor_ujian", "_tmp", "a1", "angkaB"]) {
    assert.deepEqual(validateIdentifier(name, []), { ok: true, value: name });
  }
  for (const name of ["", "1nilai", "nilai ujian", "nilai-ujian", "int"]) {
    assert.equal(validateIdentifier(name, []).ok, false, name);
  }
  assert.equal(validateIdentifier("__x", []).ok, false);
  assert.equal(validateIdentifier("_Abc", []).ok, false);
  assert.equal(validateIdentifier("a".repeat(17), []).ok, false);
});

test("validateIdentifier rejects names the snippet already uses", () => {
  assert.equal(validateIdentifier("printf", ["printf", "i"]).ok, false);
  assert.equal(validateIdentifier("i", ["printf", "i"]).ok, false);
  assert.equal(validateIdentifier("ptr", ["printf", "i"]).ok, true);
});
