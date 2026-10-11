import { type CodeLine, type CodePart } from "./c-syntax.ts";
import { BASE_ADDRESS } from "./memory.ts";
import {
  BODY_LINE,
  type EditResult,
  type Run,
  type Step,
  accepted,
  mainProgram,
  validName,
} from "./program.ts";

/** Everything the student can change in Module 5; the code and the run both come from it. */
export type ScanfProgram = { name: string };

export const EXAMPLE_PROGRAM: ScanfProgram = { name: "angka" };

/** Names the program already uses, so a renamed variable still compiles. */
export const TAKEN_NAMES: readonly string[] = ["main", "scanf", "printf"];

/** Where the variable lives in this simulation. */
export const ADDRESS = BASE_ADDRESS;

/** Zero-based lines of the generated program that the run stops on. */
export const LINE = {
  main: 2,
  declare: BODY_LINE,
  scan: BODY_LINE + 1,
  print: BODY_LINE + 2,
} as const;

export function programLines({ name }: ScanfProgram): CodeLine[] {
  const variable: CodePart = { text: name, role: "variable" };
  return mainProgram([
    ["int ", variable, ";"],
    ['scanf("%d", ', { text: `&${name}`, role: "address" }, ");"],
    [`printf("${name} = %d\\n", `, variable, ");"],
  ]);
}

export type ScanfPhase =
  "start" | "declare" | "address" | "input" | "store" | "print";

export type ScanfStep = Step & {
  phase: ScanfPhase;
  /** False until `int angka;` runs. */
  isDeclared: boolean;
  /** `null` while the variable holds nothing the program put there. */
  value: number | null;
  /** True while scanf holds `&angka`, the Address it writes to. */
  hasDestination: boolean;
};

/**
 * The run. scanf gets `&angka` first, then waits for the student; without
 * an answer the run stops there, so no Value is ever made up.
 */
export function runSnapshots(
  program: ScanfProgram,
  inputs: readonly number[],
): Run<ScanfStep> {
  const { name } = program;
  const base = { part: null, inputSlot: null, terminal: [] } as const;
  const steps: [ScanfStep, ...ScanfStep[]] = [
    {
      ...base,
      phase: "start",
      line: LINE.main,
      isDeclared: false,
      value: null,
      hasDestination: false,
    },
    {
      ...base,
      phase: "declare",
      line: LINE.declare,
      isDeclared: true,
      value: null,
      hasDestination: false,
    },
    {
      ...base,
      phase: "address",
      line: LINE.scan,
      part: `&${name}`,
      isDeclared: true,
      value: null,
      hasDestination: true,
    },
    {
      ...base,
      phase: "input",
      line: LINE.scan,
      inputSlot: 0,
      isDeclared: true,
      value: null,
      hasDestination: true,
    },
  ];
  const typed = inputs[0];
  if (typed === undefined) {
    return steps;
  }
  const echo = { kind: "input", text: `${typed}\n` } as const;
  steps.push(
    {
      phase: "store",
      line: LINE.scan,
      part: null,
      inputSlot: null,
      terminal: [echo],
      isDeclared: true,
      value: typed,
      hasDestination: true,
    },
    {
      phase: "print",
      line: LINE.print,
      part: null,
      inputSlot: null,
      terminal: [echo, { kind: "output", text: `${name} = ${typed}\n` }],
      isDeclared: true,
      value: typed,
      hasDestination: false,
    },
  );
  return steps;
}

export type ScanfEdit = { kind: "rename"; name: string } | { kind: "restore" };

/** Applies one edit; `null` when it is invalid or changes nothing. */
export function editProgram(
  program: ScanfProgram,
  edit: ScanfEdit,
): EditResult<ScanfProgram> | null {
  switch (edit.kind) {
    case "rename": {
      const name = validName(edit.name, TAKEN_NAMES);
      return accepted(program, name === null ? null : { name });
    }
    case "restore":
      return accepted(program, EXAMPLE_PROGRAM);
  }
}
