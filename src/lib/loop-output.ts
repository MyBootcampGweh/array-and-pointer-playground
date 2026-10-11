import { type CodeLine, type CodePart } from "./c-syntax.ts";
import { isInBounds } from "./memory.ts";
import {
  BODY_LINE,
  type EditResult,
  type Run,
  type Step,
  type TerminalPiece,
  accepted,
  isIntValue,
  mainProgram,
  resizeValues,
  validName,
} from "./program.ts";

/** Everything the student can change in Module 3; the code and the run both come from it. */
export type LoopOutputProgram = {
  arrayName: string;
  values: readonly number[];
};

export const EXAMPLE_PROGRAM: LoopOutputProgram = {
  arrayName: "nilai",
  values: [10, 20, 30, 40, 50],
};

/** Names the program already uses, so a renamed array still compiles. */
export const TAKEN_NAMES: readonly string[] = ["i", "main", "printf"];

/** Zero-based lines of the generated program that the run stops on. */
export const LINE = {
  main: 2,
  declare: BODY_LINE,
  loop: BODY_LINE + 1,
  print: BODY_LINE + 2,
  end: BODY_LINE + 4,
} as const;

/**
 * The program as code lines. The loop bound is the array's own length. The
 * Value being printed is marked in the initialiser, so the code and the strip
 * point at the same element.
 */
export function programLines(
  { arrayName, values }: LoopOutputProgram,
  readIndex: number | null,
): CodeLine[] {
  const name: CodePart = { text: arrayName, role: "variable" };
  const initialiser = values.flatMap((value, i): CodePart[] => [
    ...(i > 0 ? [", "] : []),
    i === readIndex ? { text: String(value), role: "value" } : String(value),
  ]);
  return mainProgram([
    ["int ", name, `[${values.length}] = {`, ...initialiser, "};"],
    `for (int i = 0; i < ${values.length}; i++) {`,
    ['    printf("%d ", ', name, "[", { text: "i", role: "index" }, "]);"],
    "}",
  ]);
}

export function condition(length: number): string {
  return `i < ${length}`;
}

export type LoopOutputPhase =
  "start" | "declare" | "init" | "check" | "print" | "increment" | "end";

export type LoopOutputStep = Step & {
  phase: LoopOutputPhase;
  /** False until the declaration runs: before that the array is not in Memory. */
  isDeclared: boolean;
  /** `i`, once `int i = 0` has run. */
  i: number | null;
  /** What this step's check gave. */
  condition: boolean | null;
  /** The element printf reads on this step; reading never changes it. */
  readIndex: number | null;
};

/**
 * The run, in the order C runs a `for`: init once, then check → printf → i++
 * until the check is false. Each printf appends one Value and a space.
 */
export function runSnapshots(program: LoopOutputProgram): Run<LoopOutputStep> {
  const { values } = program;
  const check = condition(values.length);
  let isDeclared = false;
  let terminal: readonly TerminalPiece[] = [];
  const at = (
    step: Pick<LoopOutputStep, "phase" | "line" | "i"> &
      Partial<LoopOutputStep>,
  ): LoopOutputStep => ({
    part: null,
    inputSlot: null,
    condition: null,
    readIndex: null,
    isDeclared,
    terminal,
    ...step,
  });

  const steps: [LoopOutputStep, ...LoopOutputStep[]] = [
    at({ phase: "start", line: LINE.main, i: null }),
  ];
  isDeclared = true;
  steps.push(at({ phase: "declare", line: LINE.declare, i: null }));
  steps.push(at({ phase: "init", line: LINE.loop, part: "int i = 0", i: 0 }));
  values.forEach((value, i) => {
    steps.push(
      at({ phase: "check", line: LINE.loop, part: check, i, condition: true }),
    );
    terminal = [...terminal, { kind: "output", text: `${value} ` }];
    steps.push(at({ phase: "print", line: LINE.print, i, readIndex: i }));
    steps.push(
      at({ phase: "increment", line: LINE.loop, part: "i++", i: i + 1 }),
    );
  });
  steps.push(
    at({
      phase: "check",
      line: LINE.loop,
      part: check,
      i: values.length,
      condition: false,
    }),
  );
  steps.push(at({ phase: "end", line: LINE.end, i: values.length }));
  return steps;
}

export type LoopOutputEdit =
  | { kind: "rename"; name: string }
  | { kind: "resize"; length: number }
  | { kind: "value"; index: number; value: number }
  | { kind: "restore" };

/** Applies one edit; `null` when it is invalid or changes nothing. */
export function editProgram(
  program: LoopOutputProgram,
  edit: LoopOutputEdit,
): EditResult<LoopOutputProgram> | null {
  const { values } = program;
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
        values: resizeValues(values, edit.length),
      });
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
    case "restore":
      return accepted(program, EXAMPLE_PROGRAM);
  }
}
