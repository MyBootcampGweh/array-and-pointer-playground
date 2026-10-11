import { type CodeLine, type CodePart } from "./c-syntax.ts";
import {
  BODY_LINE,
  type EditResult,
  type Run,
  type Step,
  type TerminalPiece,
  accepted,
  clampLength,
  mainProgram,
  validName,
} from "./program.ts";

/** Everything the student can change in Module 2; the code and the run both come from it. */
export type LoopInputProgram = { arrayName: string; length: number };

export const EXAMPLE_PROGRAM: LoopInputProgram = {
  arrayName: "nilai",
  length: 5,
};

/** Names the program already uses, so a renamed array still compiles. */
export const TAKEN_NAMES: readonly string[] = ["i", "main", "scanf"];

/** Zero-based lines of the generated program that the run stops on. */
export const LINE = {
  main: 2,
  declare: BODY_LINE,
  loop: BODY_LINE + 1,
  scan: BODY_LINE + 2,
  end: BODY_LINE + 4,
} as const;

/** The loop bound is the array's own length, so the two can never disagree. */
export function programLines({
  arrayName,
  length,
}: LoopInputProgram): CodeLine[] {
  const name: CodePart = { text: arrayName, role: "variable" };
  return mainProgram([
    ["int ", name, `[${length}];`],
    `for (int i = 0; i < ${length}; i++) {`,
    ['    scanf("%d", &', name, "[", { text: "i", role: "index" }, "]);"],
    "}",
  ]);
}

/** The loop's condition as it appears in the code. */
export function condition(length: number): string {
  return `i < ${length}`;
}

export type LoopInputPhase =
  | "start"
  | "declare"
  | "init"
  | "check"
  | "input"
  | "store"
  | "increment"
  | "end";

export type LoopInputStep = Step & {
  phase: LoopInputPhase;
  /** `null` until the declaration runs; then each element, `null` while unassigned. */
  cells: readonly (number | null)[] | null;
  /** `i`, once `int i = 0` has run. */
  i: number | null;
  /** What this step's check gave. */
  condition: boolean | null;
  /** The element scanf waits for or has just filled. */
  activeIndex: number | null;
};

/**
 * The run, in the order C runs a `for`: init once, then check → scanf → i++
 * until the check is false. scanf stops the run on the first input the
 * student has not typed yet, so it never makes a Value up.
 */
export function runSnapshots(
  program: LoopInputProgram,
  inputs: readonly number[],
): Run<LoopInputStep> {
  const { length } = program;
  const check = condition(length);
  let cells: readonly (number | null)[] | null = null;
  let terminal: readonly TerminalPiece[] = [];
  const at = (
    step: Pick<LoopInputStep, "phase" | "line" | "i"> & Partial<LoopInputStep>,
  ): LoopInputStep => ({
    part: null,
    inputSlot: null,
    condition: null,
    activeIndex: null,
    cells,
    terminal,
    ...step,
  });

  const steps: [LoopInputStep, ...LoopInputStep[]] = [
    at({ phase: "start", line: LINE.main, i: null }),
  ];
  cells = Array.from({ length }, () => null);
  steps.push(at({ phase: "declare", line: LINE.declare, i: null }));
  steps.push(at({ phase: "init", line: LINE.loop, part: "int i = 0", i: 0 }));
  for (let i = 0; i < length; i++) {
    steps.push(
      at({ phase: "check", line: LINE.loop, part: check, i, condition: true }),
    );
    steps.push(
      at({
        phase: "input",
        line: LINE.scan,
        i,
        activeIndex: i,
        inputSlot: i,
      }),
    );
    const value = inputs[i];
    if (value === undefined) {
      return steps;
    }
    cells = cells.map((cell, index) => (index === i ? value : cell));
    terminal = [...terminal, { kind: "input", text: `${value}\n` }];
    steps.push(at({ phase: "store", line: LINE.scan, i, activeIndex: i }));
    steps.push(
      at({ phase: "increment", line: LINE.loop, part: "i++", i: i + 1 }),
    );
  }
  steps.push(
    at({
      phase: "check",
      line: LINE.loop,
      part: check,
      i: length,
      condition: false,
    }),
  );
  steps.push(at({ phase: "end", line: LINE.end, i: length }));
  return steps;
}

export type LoopInputEdit =
  | { kind: "rename"; name: string }
  | { kind: "resize"; length: number }
  | { kind: "restore" };

/** Applies one edit; `null` when it is invalid or changes nothing. */
export function editProgram(
  program: LoopInputProgram,
  edit: LoopInputEdit,
): EditResult<LoopInputProgram> | null {
  switch (edit.kind) {
    case "rename": {
      const name = validName(edit.name, TAKEN_NAMES);
      return accepted(
        program,
        name === null ? null : { ...program, arrayName: name },
      );
    }
    case "resize":
      return accepted(program, {
        ...program,
        length: clampLength(edit.length),
      });
    case "restore":
      return accepted(program, EXAMPLE_PROGRAM);
  }
}
