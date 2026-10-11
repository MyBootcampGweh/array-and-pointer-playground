import { type CodeLine, type CodePart } from "./c-syntax.ts";
import { addressOf, isInBounds } from "./memory.ts";
import {
  BODY_LINE,
  type EditResult,
  type Run,
  type Step,
  accepted,
  isIntValue,
  mainProgram,
  resizeValues,
  validName,
} from "./program.ts";

/** Everything the student can change in Module 4; the code and the run both come from it. */
export type ArrayMemoryProgram = {
  arrayName: string;
  values: readonly number[];
  /** The Index printf reads; always inside the array. */
  index: number;
};

export const EXAMPLE_PROGRAM: ArrayMemoryProgram = {
  arrayName: "nilai",
  values: [10, 20, 30, 40, 50],
  index: 2,
};

/** Names the program already uses, so a renamed array still compiles. */
export const TAKEN_NAMES: readonly string[] = ["main", "printf"];

/** Zero-based lines of the generated program that the run stops on. */
export const LINE = {
  main: 2,
  declare: BODY_LINE,
  print: BODY_LINE + 1,
} as const;

/**
 * The program as code lines. The read Value is marked only once the run has
 * read it, so the code never gives the answer away early.
 */
export function programLines(
  { arrayName, values, index }: ArrayMemoryProgram,
  isRead: boolean,
): CodeLine[] {
  const name: CodePart = { text: arrayName, role: "variable" };
  const initialiser = values.flatMap((value, i): CodePart[] => [
    ...(i > 0 ? [", "] : []),
    isRead && i === index
      ? { text: String(value), role: "value" }
      : String(value),
  ]);
  return mainProgram([
    ["int ", name, `[${values.length}] = {`, ...initialiser, "};"],
    [
      'printf("%d\\n", ',
      name,
      "[",
      { text: String(index), role: "index" },
      "]);",
    ],
  ]);
}

export type ArrayMemoryPhase = "start" | "declare" | "locate" | "print";

export type ArrayMemoryStep = Step & {
  phase: ArrayMemoryPhase;
  /** False until the declaration runs: no boxes and no Addresses before it. */
  isDeclared: boolean;
  /** The Address of the read element, once the run has worked it out. */
  address: number | null;
  /** The Value read from that Address, once read. */
  result: number | null;
};

/**
 * The run, one snapshot per step. To read `nilai[2]` the program first works
 * out where element 2 sits (start Address + Index × 4), then reads the
 * Value there and prints it.
 */
export function runSnapshots(
  program: ArrayMemoryProgram,
): Run<ArrayMemoryStep> {
  const { arrayName, values, index } = program;
  const value = values[index] ?? null;
  const address = addressOf(index);
  const base = { inputSlot: null, terminal: [] } as const;
  const access = `${arrayName}[${index}]`;
  return [
    {
      ...base,
      phase: "start",
      line: LINE.main,
      part: null,
      isDeclared: false,
      address: null,
      result: null,
    },
    {
      ...base,
      phase: "declare",
      line: LINE.declare,
      part: null,
      isDeclared: true,
      address: null,
      result: null,
    },
    {
      ...base,
      phase: "locate",
      line: LINE.print,
      part: access,
      isDeclared: true,
      address,
      result: null,
    },
    {
      phase: "print",
      line: LINE.print,
      part: null,
      inputSlot: null,
      isDeclared: true,
      address,
      result: value,
      terminal: [{ kind: "output", text: `${value}\n` }],
    },
  ];
}

export type ArrayMemoryEdit =
  | { kind: "rename"; name: string }
  | { kind: "resize"; length: number }
  | { kind: "value"; index: number; value: number }
  | { kind: "select"; index: number }
  | { kind: "restore" };

/**
 * Applies one edit; `null` when it is invalid or changes nothing. Shrinking
 * past the chosen Index pulls it back inside, and the note says so.
 */
export function editProgram(
  program: ArrayMemoryProgram,
  edit: ArrayMemoryEdit,
): EditResult<ArrayMemoryProgram> | null {
  const { values } = program;
  switch (edit.kind) {
    case "rename": {
      const name = validName(edit.name, TAKEN_NAMES);
      return accepted(
        program,
        name === null ? null : { ...program, arrayName: name },
      );
    }
    case "resize": {
      const resized = resizeValues(values, edit.length);
      const index = Math.min(program.index, resized.length - 1);
      return accepted(
        program,
        { ...program, values: resized, index },
        index === program.index
          ? null
          : `Index pindah ke ${index}, soalnya array-nya sekarang cuma ${resized.length} elemen.`,
      );
    }
    case "value":
      return accepted(
        program,
        isInBounds(edit.index, values.length) && isIntValue(edit.value)
          ? {
              ...program,
              values: values.map((old, i) =>
                i === edit.index ? edit.value : old,
              ),
            }
          : null,
      );
    case "select":
      return accepted(
        program,
        isInBounds(edit.index, values.length)
          ? { ...program, index: edit.index }
          : null,
      );
    case "restore":
      return accepted(program, EXAMPLE_PROGRAM);
  }
}
