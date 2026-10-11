import { type CodeLine } from "./c-syntax.ts";
import { MAX_ARRAY_LENGTH, MIN_ARRAY_LENGTH, clamp } from "./memory.ts";
import { INT_MAX, INT_MIN, validateIdentifier } from "./validation.ts";

/** What one step printed with printf, or what the student typed for scanf. */
export type TerminalPiece = { kind: "output" | "input"; text: string };

/** What every module's run records for each step, besides its own state. */
export type Step = {
  /** Zero-based code line the step runs. */
  line: number;
  /** The piece of that line being evaluated, ringed in the code. */
  part: string | null;
  /** Everything on the terminal after this step. */
  terminal: readonly TerminalPiece[];
  /** On a step where scanf waits: which input of the run (0, 1, …) it reads. */
  inputSlot: number | null;
};

/** A run is never empty: it always has at least its start. */
export type Run<S extends Step> = readonly [S, ...S[]];

/** An accepted edit, plus a short note when it had to adjust something. */
export type EditResult<P> = { program: P; notice: string | null };

/** Body line `n` of {@link mainProgram} is code line `n + BODY_LINE`. */
export const BODY_LINE = 3;

/** `body` inside `#include <stdio.h>` and `int main() { … return 0; }`. */
export function mainProgram(body: readonly CodeLine[]): CodeLine[] {
  return [
    "#include <stdio.h>",
    "",
    "int main() {",
    ...body.map((line): CodeLine =>
      typeof line !== "string"
        ? ["    ", ...line]
        : line === ""
          ? ""
          : `    ${line}`,
    ),
    "    return 0;",
    "}",
  ];
}

/**
 * `null` when the edit changes nothing, so the caller keeps the run where it
 * is; otherwise the new program and its note.
 */
export function accepted<P>(
  program: P,
  next: P | null,
  notice: string | null = null,
): EditResult<P> | null {
  // Programs are plain data built by spreading the same shape, so their JSON
  // compares them field by field.
  return next === null || JSON.stringify(next) === JSON.stringify(program)
    ? null
    : { program: next, notice };
}

/** The trimmed name when C and the program both accept it, else `null`. */
export function validName(
  raw: string,
  taken: readonly string[],
): string | null {
  const result = validateIdentifier(raw, taken);
  return result.ok ? result.value : null;
}

export function isIntValue(value: number): boolean {
  return Number.isInteger(value) && value >= INT_MIN && value <= INT_MAX;
}

/** A length C and the strip both allow: from `min` up to the maximum. */
export function clampLength(length: number, min = MIN_ARRAY_LENGTH): number {
  return clamp(Math.trunc(length), min, MAX_ARRAY_LENGTH);
}

/** Every length the editor offers, from `min` to the maximum. */
export function arrayLengths(min = MIN_ARRAY_LENGTH): number[] {
  return Array.from({ length: MAX_ARRAY_LENGTH - min + 1 }, (_, i) => min + i);
}

/**
 * Kept Values stay; each new element gets its own explicit Value (… 50, 60),
 * so an initialiser never leaves one to C's default.
 */
export function resizeValues(
  values: readonly number[],
  length: number,
  min = MIN_ARRAY_LENGTH,
): number[] {
  return Array.from(
    { length: clampLength(length, min) },
    (_, i) => values[i] ?? i * 10,
  );
}

/**
 * The run's inputs after the student answers input `slot`. The same answer
 * keeps the rest of the run; a new one drops every later input, since the run
 * after it no longer happened.
 */
export function withInput(
  inputs: readonly number[],
  slot: number,
  value: number,
): readonly number[] {
  return inputs[slot] === value ? inputs : [...inputs.slice(0, slot), value];
}
