import { type CodeLine, type CodePart } from "./c-syntax.ts";
import { BASE_ADDRESS } from "./memory.ts";
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

/** Everything the student can change in Module 6; the code and the run both come from it. */
export type PointerVariableProgram = {
  name: string;
  pointer: string;
  value: number;
};

export const EXAMPLE_PROGRAM: PointerVariableProgram = {
  name: "angka",
  pointer: "ptr",
  value: 10,
};

/** Names the program uses besides the two the student picks. */
export const RESERVED_NAMES: readonly string[] = ["main"];

/** Where the variable lives in this simulation. */
export const ADDRESS = BASE_ADDRESS;

/** Zero-based lines of the generated program that the run stops on. */
export const LINE = {
  main: 2,
  declare: BODY_LINE,
  pointer: BODY_LINE + 1,
} as const;

export function programLines({
  name,
  pointer,
  value,
}: PointerVariableProgram): CodeLine[] {
  const variable: CodePart = { text: name, role: "variable" };
  return mainProgram([
    ["int ", variable, " = ", { text: String(value), role: "value" }, ";"],
    [
      "int *",
      { text: pointer, role: "pointer" },
      " = ",
      { text: `&${name}`, role: "address" },
      ";",
    ],
  ]);
}

export type PointerVariablePhase = "start" | "declare" | "address" | "pointer";

export type PointerVariableStep = Step & {
  phase: PointerVariablePhase;
  /** False until `int angka = …;` runs. */
  isDeclared: boolean;
  /** The Address `&angka` gave, once worked out. */
  address: number | null;
  /** What the Pointer holds, once it exists: an Address, never a Value. */
  pointerValue: number | null;
};

/**
 * The run: the variable first, then `&angka`, then the Pointer that stores
 * that Address. The Value is never copied into the Pointer.
 */
export function runSnapshots(
  program: PointerVariableProgram,
): Run<PointerVariableStep> {
  const { name, pointer } = program;
  const base = { inputSlot: null, terminal: [] } as const;
  return [
    {
      ...base,
      phase: "start",
      line: LINE.main,
      part: null,
      isDeclared: false,
      address: null,
      pointerValue: null,
    },
    {
      ...base,
      phase: "declare",
      line: LINE.declare,
      part: null,
      isDeclared: true,
      address: null,
      pointerValue: null,
    },
    {
      ...base,
      phase: "address",
      line: LINE.pointer,
      part: `&${name}`,
      isDeclared: true,
      address: ADDRESS,
      pointerValue: null,
    },
    {
      ...base,
      phase: "pointer",
      line: LINE.pointer,
      part: `int *${pointer}`,
      isDeclared: true,
      address: ADDRESS,
      pointerValue: ADDRESS,
    },
  ];
}

export type PointerVariableEdit =
  | { kind: "rename"; target: "name" | "pointer"; name: string }
  | { kind: "value"; value: number }
  | { kind: "restore" };

/** Every name in the program except the one being renamed. */
export function takenNames(
  program: PointerVariableProgram,
  target: "name" | "pointer",
): string[] {
  return [
    ...RESERVED_NAMES,
    target === "name" ? program.pointer : program.name,
  ];
}

/** Applies one edit; `null` when it is invalid or changes nothing. */
export function editProgram(
  program: PointerVariableProgram,
  edit: PointerVariableEdit,
): EditResult<PointerVariableProgram> | null {
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
        isIntValue(edit.value) ? { ...program, value: edit.value } : null,
      );
    case "restore":
      return accepted(program, EXAMPLE_PROGRAM);
  }
}
