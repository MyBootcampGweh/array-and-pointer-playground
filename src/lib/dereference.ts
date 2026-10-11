import { type CodeLine, type CodePart } from "./c-syntax.ts";
import { BASE_ADDRESS } from "./memory.ts";
import {
  BODY_LINE,
  type EditResult,
  type Run,
  type Step,
  type TerminalPiece,
  accepted,
  isIntValue,
  mainProgram,
  validName,
} from "./program.ts";

/** Everything the student can change in Module 7; the code and the run both come from it. */
export type DereferenceProgram = {
  name: string;
  pointer: string;
  value: number;
  /** What `*ptr = …` writes. */
  newValue: number;
};

export const EXAMPLE_PROGRAM: DereferenceProgram = {
  name: "angka",
  pointer: "ptr",
  value: 10,
  newValue: 20,
};

/** Names the program uses besides the two the student picks. */
export const RESERVED_NAMES: readonly string[] = ["main", "printf"];

/** Where the variable lives in this simulation. */
export const ADDRESS = BASE_ADDRESS;

/** Zero-based lines of the generated program that the run stops on. */
export const LINE = {
  main: 2,
  declare: BODY_LINE,
  pointer: BODY_LINE + 1,
  printTarget: BODY_LINE + 2,
  write: BODY_LINE + 3,
  printName: BODY_LINE + 4,
} as const;

export function programLines({
  name,
  pointer,
  value,
  newValue,
}: DereferenceProgram): CodeLine[] {
  const variable: CodePart = { text: name, role: "variable" };
  const deref: CodePart = { text: `*${pointer}`, role: "pointer" };
  return mainProgram([
    ["int ", variable, " = ", { text: String(value), role: "value" }, ";"],
    [
      "int *",
      { text: pointer, role: "pointer" },
      " = ",
      { text: `&${name}`, role: "address" },
      ";",
    ],
    ['printf("%d\\n", ', deref, ");"],
    [deref, " = ", { text: String(newValue), role: "value" }, ";"],
    ['printf("%d\\n", ', variable, ");"],
  ]);
}

export type DereferencePhase =
  | "start"
  | "declare"
  | "pointer"
  | "read-address"
  | "read-value"
  | "write"
  | "print-name";

export type DereferenceStep = Step & {
  phase: DereferencePhase;
  isDeclared: boolean;
  /** What the Pointer holds once it exists; `*ptr = …` never changes it. */
  pointerValue: number | null;
  /** The variable's Value after this step. */
  value: number;
};

/**
 * The run. Reading `*ptr` takes two hops, so it gets two steps: the Address
 * in `ptr`, then the Value at that Address. Writing through `*ptr` changes
 * the variable and leaves `ptr` alone.
 */
export function runSnapshots(
  program: DereferenceProgram,
): Run<DereferenceStep> {
  const { pointer, value, newValue } = program;
  const deref = `*${pointer}`;
  const before = { inputSlot: null, isDeclared: true, value } as const;
  const printed: TerminalPiece = { kind: "output", text: `${value}\n` };
  const held = { pointerValue: ADDRESS } as const;
  return [
    {
      ...before,
      phase: "start",
      line: LINE.main,
      part: null,
      terminal: [],
      isDeclared: false,
      pointerValue: null,
    },
    {
      ...before,
      phase: "declare",
      line: LINE.declare,
      part: null,
      terminal: [],
      pointerValue: null,
    },
    {
      ...before,
      ...held,
      phase: "pointer",
      line: LINE.pointer,
      part: `int *${pointer}`,
      terminal: [],
    },
    {
      ...before,
      ...held,
      phase: "read-address",
      line: LINE.printTarget,
      part: deref,
      terminal: [],
    },
    {
      ...before,
      ...held,
      phase: "read-value",
      line: LINE.printTarget,
      part: deref,
      terminal: [printed],
    },
    {
      ...held,
      phase: "write",
      line: LINE.write,
      part: `${deref} = ${newValue}`,
      inputSlot: null,
      terminal: [printed],
      isDeclared: true,
      value: newValue,
    },
    {
      ...held,
      phase: "print-name",
      line: LINE.printName,
      part: null,
      inputSlot: null,
      terminal: [printed, { kind: "output", text: `${newValue}\n` }],
      isDeclared: true,
      value: newValue,
    },
  ];
}

export type DereferenceEdit =
  | { kind: "rename"; target: "name" | "pointer"; name: string }
  | { kind: "value"; target: "value" | "newValue"; value: number }
  | { kind: "restore" };

/** Every name in the program except the one being renamed. */
export function takenNames(
  program: DereferenceProgram,
  target: "name" | "pointer",
): string[] {
  return [
    ...RESERVED_NAMES,
    target === "name" ? program.pointer : program.name,
  ];
}

/** Applies one edit; `null` when it is invalid or changes nothing. */
export function editProgram(
  program: DereferenceProgram,
  edit: DereferenceEdit,
): EditResult<DereferenceProgram> | null {
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
