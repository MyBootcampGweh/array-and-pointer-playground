import { type CodeLine, type CodePart } from "./c-syntax.ts";
import {
  MAX_ARRAY_LENGTH,
  MIN_ARRAY_LENGTH,
  clamp,
  isInBounds,
} from "./memory.ts";
import {
  INT_MAX,
  INT_MIN,
  type ParseResult,
  parseIntInput,
  validateIdentifier,
} from "./validation.ts";

/** Everything the student can change in Module 1; the code and the run both come from it. */
export type ArrayIndexingProgram = {
  arrayName: string;
  values: readonly number[];
  /** The Index read into `x`; always inside the array. */
  index: number;
};

export const EXAMPLE_PROGRAM: ArrayIndexingProgram = {
  arrayName: "nilai",
  values: [12, 45, 78, 34, 99],
  index: 2,
};

/** The variable that receives `nilai[index]`. */
export const RESULT_NAME = "x";

/** Names the program already uses, so a renamed array still compiles. */
export const TAKEN_NAMES: readonly string[] = [RESULT_NAME, "main", "printf"];

/** Zero-based lines of the generated program that the run stops on. */
export const LINE = { main: 2, declare: 3, access: 4, print: 5 } as const;

/**
 * The whole program as code lines. The array name and Index are marked with
 * their roles; the read Value only once the run has read it, so the code
 * never gives the answer away early.
 */
export function programLines(
  program: ArrayIndexingProgram,
  isRead: boolean,
): CodeLine[] {
  const { arrayName, values, index } = program;
  const name: CodePart = { text: arrayName, role: "variable" };
  const at: CodePart = { text: String(index), role: "index" };
  const initialiser = values.flatMap((value, i): CodePart[] => [
    ...(i > 0 ? [", "] : []),
    isRead && i === index
      ? { text: String(value), role: "value" }
      : String(value),
  ]);
  return [
    "#include <stdio.h>",
    "",
    "int main() {",
    ["    int ", name, `[${values.length}] = {`, ...initialiser, "};"],
    [`    int ${RESULT_NAME} = `, name, "[", at, "];"],
    [`    printf("${arrayName}[%d] = %d\\n", `, at, `, ${RESULT_NAME});`],
    "    return 0;",
    "}",
  ];
}

export type RunPhase = "start" | "declare" | "read" | "print";

/** The complete state after one step, so stepping back just shows an older one. */
export type RunSnapshot = {
  phase: RunPhase;
  line: number;
  /** False until the declaration runs: before that the array is not in Memory. */
  isDeclared: boolean;
  /** The Index the running program has read, once `x = nilai[i]` has run. */
  readIndex: number | null;
  /** `x`, once assigned. */
  result: number | null;
  output: string;
};

/** The run, one snapshot per step: always the same steps for the same program. */
export function runSnapshots(
  program: ArrayIndexingProgram,
): [RunSnapshot, ...RunSnapshot[]] {
  const { arrayName, values, index } = program;
  const value = values[index] ?? null;
  const read = { readIndex: index, result: value };
  return [
    {
      phase: "start",
      line: LINE.main,
      isDeclared: false,
      readIndex: null,
      result: null,
      output: "",
    },
    {
      phase: "declare",
      line: LINE.declare,
      isDeclared: true,
      readIndex: null,
      result: null,
      output: "",
    },
    { phase: "read", line: LINE.access, isDeclared: true, ...read, output: "" },
    {
      phase: "print",
      line: LINE.print,
      isDeclared: true,
      ...read,
      output: `${arrayName}[${index}] = ${value}`,
    },
  ];
}

export type ProgramEdit =
  | { kind: "rename"; name: string }
  | { kind: "resize"; length: number }
  | { kind: "value"; index: number; value: number }
  | { kind: "select"; index: number }
  | { kind: "restore" };

export type EditResult = {
  program: ArrayIndexingProgram;
  /** Set when shrinking the array pulled the Index back inside it. */
  movedIndex: { from: number; to: number } | null;
};

/**
 * Applies one edit. Returns `null` when nothing would change, or when the edit
 * is invalid, so the caller keeps both the program and the run as they are.
 */
export function editProgram(
  program: ArrayIndexingProgram,
  edit: ProgramEdit,
): EditResult | null {
  const next = editedProgram(program, edit);
  if (next === null || isSameProgram(program, next)) {
    return null;
  }
  const movedIndex =
    edit.kind === "resize" && next.index !== program.index
      ? { from: program.index, to: next.index }
      : null;
  return { program: next, movedIndex };
}

function editedProgram(
  program: ArrayIndexingProgram,
  edit: ProgramEdit,
): ArrayIndexingProgram | null {
  const { values } = program;
  switch (edit.kind) {
    case "rename": {
      const name = validateIdentifier(edit.name, TAKEN_NAMES);
      return name.ok ? { ...program, arrayName: name.value } : null;
    }
    case "resize": {
      const length = clamp(
        Math.trunc(edit.length),
        MIN_ARRAY_LENGTH,
        MAX_ARRAY_LENGTH,
      );
      // Kept Values stay; each new element gets its own explicit Value
      // (50, 60, …), so the initialiser never leaves one to C's default.
      const resized = Array.from({ length }, (_, i) => values[i] ?? i * 10);
      return {
        ...program,
        values: resized,
        index: Math.min(program.index, length - 1),
      };
    }
    case "value":
      return isInBounds(edit.index, values.length) &&
        Number.isInteger(edit.value) &&
        edit.value >= INT_MIN &&
        edit.value <= INT_MAX
        ? {
            ...program,
            values: values.map((old, i) =>
              i === edit.index ? edit.value : old,
            ),
          }
        : null;
    case "select":
      return isInBounds(edit.index, values.length)
        ? { ...program, index: edit.index }
        : null;
    case "restore":
      return EXAMPLE_PROGRAM;
  }
}

function isSameProgram(
  a: ArrayIndexingProgram,
  b: ArrayIndexingProgram,
): boolean {
  return (
    a.arrayName === b.arrayName &&
    a.index === b.index &&
    a.values.length === b.values.length &&
    a.values.every((value, i) => value === b.values[i])
  );
}

/**
 * Reads the Index field. Out of range is refused, but the message still says
 * what C would do, since that is the lesson here.
 */
export function parseIndex(raw: string, length: number): ParseResult<number> {
  const parsed = parseIntInput(raw);
  if (!parsed.ok || isInBounds(parsed.value, length)) {
    return parsed;
  }
  const range = length === 1 ? "cuma 0" : `0 sampai ${length - 1}`;
  return {
    ok: false,
    error: `Index ${parsed.value} di luar array (Index-nya ${range}). Di C, akses kayak gini itu undefined behavior.`,
  };
}
