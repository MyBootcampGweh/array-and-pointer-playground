import { type CodeLine, type CodePart } from "./c-syntax.ts";
import { addressOf } from "./memory.ts";
import {
  BODY_LINE,
  type EditResult,
  type Run,
  type Step,
  accepted,
  isIntValue,
  mainProgram,
  validName,
} from "./program.ts";

/**
 * Everything the student can change in Module 8; the code and the run both
 * come from it. The variables are keyed A and B, not by name, so a rename
 * never breaks what the Pointer points at.
 */
export type PointerTargetProgram = {
  nameA: string;
  nameB: string;
  pointer: string;
  valueA: number;
  valueB: number;
  /** What `*ptr = …` writes once the Pointer points at B. */
  newValue: number;
};

export const EXAMPLE_PROGRAM: PointerTargetProgram = {
  nameA: "angkaA",
  nameB: "angkaB",
  pointer: "ptr",
  valueA: 10,
  valueB: 25,
  newValue: 30,
};

export type Target = "a" | "b";
export type NameKey = "nameA" | "nameB" | "pointer";
export type ValueKey = "valueA" | "valueB" | "newValue";

/** Names the program uses besides the three the student picks. */
export const RESERVED_NAMES: readonly string[] = ["main", "printf"];

/** Two ints declared one after the other: 4 bytes apart in this simulation. */
export const ADDRESSES: Record<Target, number> = {
  a: addressOf(0),
  b: addressOf(1),
};

/** Zero-based lines of the generated program that the run stops on. */
export const LINE = {
  main: 2,
  declareA: BODY_LINE,
  declareB: BODY_LINE + 1,
  pointer: BODY_LINE + 2,
  redirect: BODY_LINE + 3,
  write: BODY_LINE + 4,
  print: BODY_LINE + 5,
} as const;

export function programLines(program: PointerTargetProgram): CodeLine[] {
  const { nameA, nameB, pointer, valueA, valueB, newValue } = program;
  const a: CodePart = { text: nameA, role: "variable" };
  const b: CodePart = { text: nameB, role: "variable" };
  const ptr: CodePart = { text: pointer, role: "pointer" };
  return mainProgram([
    ["int ", a, " = ", { text: String(valueA), role: "value" }, ";"],
    ["int ", b, " = ", { text: String(valueB), role: "value" }, ";"],
    ["int *", ptr, " = ", { text: `&${nameA}`, role: "address" }, ";"],
    [ptr, " = ", { text: `&${nameB}`, role: "address" }, ";"],
    [
      { text: `*${pointer}`, role: "pointer" },
      " = ",
      { text: String(newValue), role: "value" },
      ";",
    ],
    ['printf("%d %d\\n", ', a, ", ", b, ");"],
  ]);
}

export type PointerTargetPhase =
  | "start"
  | "declare-a"
  | "declare-b"
  | "point"
  | "redirect"
  | "write"
  | "print";

export type PointerTargetStep = Step & {
  phase: PointerTargetPhase;
  /** How many of the two variables exist yet: A first, then B. */
  declared: 0 | 1 | 2;
  /** The variable the Pointer points at, once it exists. */
  target: Target | null;
  values: Record<Target, number>;
};

/**
 * The run. Redirecting is a step of its own: `ptr = &angkaB` changes only
 * what `ptr` holds. `*ptr = …` then changes only the Value it points at.
 */
export function runSnapshots(
  program: PointerTargetProgram,
): Run<PointerTargetStep> {
  const { nameA, nameB, pointer, valueA, valueB, newValue } = program;
  const before = { a: valueA, b: valueB };
  const after = { a: valueA, b: newValue };
  const base = { inputSlot: null, terminal: [] } as const;
  return [
    {
      ...base,
      phase: "start",
      line: LINE.main,
      part: null,
      declared: 0,
      target: null,
      values: before,
    },
    {
      ...base,
      phase: "declare-a",
      line: LINE.declareA,
      part: null,
      declared: 1,
      target: null,
      values: before,
    },
    {
      ...base,
      phase: "declare-b",
      line: LINE.declareB,
      part: null,
      declared: 2,
      target: null,
      values: before,
    },
    {
      ...base,
      phase: "point",
      line: LINE.pointer,
      part: `&${nameA}`,
      declared: 2,
      target: "a",
      values: before,
    },
    {
      ...base,
      phase: "redirect",
      line: LINE.redirect,
      part: `${pointer} = &${nameB}`,
      declared: 2,
      target: "b",
      values: before,
    },
    {
      ...base,
      phase: "write",
      line: LINE.write,
      part: `*${pointer} = ${newValue}`,
      declared: 2,
      target: "b",
      values: after,
    },
    {
      phase: "print",
      line: LINE.print,
      part: null,
      inputSlot: null,
      terminal: [{ kind: "output", text: `${valueA} ${newValue}\n` }],
      declared: 2,
      target: "b",
      values: after,
    },
  ];
}

export type PointerTargetEdit =
  | { kind: "rename"; target: NameKey; name: string }
  | { kind: "value"; target: ValueKey; value: number }
  | { kind: "restore" };

const NAME_KEYS: readonly NameKey[] = ["nameA", "nameB", "pointer"];

/** Every name in the program except the one being renamed. */
export function takenNames(
  program: PointerTargetProgram,
  target: NameKey,
): string[] {
  return [
    ...RESERVED_NAMES,
    ...NAME_KEYS.filter((key) => key !== target).map((key) => program[key]),
  ];
}

/** Applies one edit; `null` when it is invalid or changes nothing. */
export function editProgram(
  program: PointerTargetProgram,
  edit: PointerTargetEdit,
): EditResult<PointerTargetProgram> | null {
  switch (edit.kind) {
    case "rename": {
      const name = validName(edit.name, takenNames(program, edit.target));
      return accepted(
        program,
        name === null ? null : { ...program, [edit.target]: name },
      );
    }
    case "value":
      return accepted(
        program,
        isIntValue(edit.value)
          ? { ...program, [edit.target]: edit.value }
          : null,
      );
    case "restore":
      return accepted(program, EXAMPLE_PROGRAM);
  }
}
