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
import { type ParseResult, parseIntInput } from "./validation.ts";

/** Everything the student can change in Module 9; the code and the run both come from it. */
export type PointerArrayProgram = {
  arrayName: string;
  pointer: string;
  values: readonly number[];
  /** The k in `*(ptr + k)`; every read it makes stays inside the array. */
  offset: number;
};

export const EXAMPLE_PROGRAM: PointerArrayProgram = {
  arrayName: "nilai",
  pointer: "ptr",
  values: [10, 20, 30, 40, 50],
  offset: 1,
};

/** `ptr++` and a read after it need a second element. */
export const MIN_LENGTH = 2;

/** Names the program uses besides the two the student picks. */
export const RESERVED_NAMES: readonly string[] = ["main", "printf"];

/** Zero-based lines of the generated program that the run stops on. */
export const LINE = {
  main: 2,
  declare: BODY_LINE,
  pointer: BODY_LINE + 1,
  index: BODY_LINE + 2,
  deref: BODY_LINE + 3,
  increment: BODY_LINE + 4,
  derefMoved: BODY_LINE + 5,
} as const;

/**
 * The program as code lines. The Value being read is marked in the
 * initialiser, so the code and the strip point at the same element.
 */
export function programLines(
  { arrayName, pointer, values, offset }: PointerArrayProgram,
  readIndex: number | null,
): CodeLine[] {
  const name: CodePart = { text: arrayName, role: "variable" };
  const ptr: CodePart = { text: pointer, role: "pointer" };
  const k: CodePart = { text: String(offset), role: "index" };
  const initialiser = values.flatMap((value, i): CodePart[] => [
    ...(i > 0 ? [", "] : []),
    i === readIndex ? { text: String(value), role: "value" } : String(value),
  ]);
  const deref: CodeLine = ['printf("%d\\n", *(', ptr, " + ", k, "));"];
  return mainProgram([
    ["int ", name, `[${values.length}] = {`, ...initialiser, "};"],
    ["int *", ptr, " = ", name, ";"],
    ['printf("%d\\n", ', name, "[", k, "]);"],
    deref,
    [ptr, "++;"],
    deref,
  ]);
}

export type PointerArrayPhase =
  | "start"
  | "declare"
  | "point"
  | "index"
  | "deref"
  | "increment"
  | "deref-moved";

export type PointerArrayStep = Step & {
  phase: PointerArrayPhase;
  isDeclared: boolean;
  /** The element the Pointer points at, once it exists. */
  pointerAt: number | null;
  /** The element `ptr + k` lands on while this step works it out. */
  probe: number | null;
  /** The element this step reads. */
  readIndex: number | null;
};

/**
 * The run. `nilai[k]` and `*(ptr + k)` read the same element while `ptr`
 * points at element 0; after `ptr++` the same expression reads one further.
 * Every read is inside the array, since the program only allows such a k.
 */
export function runSnapshots(
  program: PointerArrayProgram,
): Run<PointerArrayStep> {
  const { arrayName, pointer, values, offset } = program;
  const deref = `*(${pointer} + ${offset})`;
  const print = (index: number): TerminalPiece => ({
    kind: "output",
    text: `${values[index] ?? "?"}\n`,
  });
  const base = { inputSlot: null } as const;
  const empty = { probe: null, readIndex: null } as const;
  return [
    {
      ...base,
      ...empty,
      phase: "start",
      line: LINE.main,
      part: null,
      terminal: [],
      isDeclared: false,
      pointerAt: null,
    },
    {
      ...base,
      ...empty,
      phase: "declare",
      line: LINE.declare,
      part: null,
      terminal: [],
      isDeclared: true,
      pointerAt: null,
    },
    {
      ...base,
      ...empty,
      phase: "point",
      line: LINE.pointer,
      part: `${pointer} = ${arrayName}`,
      terminal: [],
      isDeclared: true,
      pointerAt: 0,
    },
    {
      ...base,
      phase: "index",
      line: LINE.index,
      part: `${arrayName}[${offset}]`,
      terminal: [print(offset)],
      isDeclared: true,
      pointerAt: 0,
      probe: null,
      readIndex: offset,
    },
    {
      ...base,
      phase: "deref",
      line: LINE.deref,
      part: deref,
      terminal: [print(offset), print(offset)],
      isDeclared: true,
      pointerAt: 0,
      probe: offset,
      readIndex: offset,
    },
    {
      ...base,
      ...empty,
      phase: "increment",
      line: LINE.increment,
      part: `${pointer}++`,
      terminal: [print(offset), print(offset)],
      isDeclared: true,
      pointerAt: 1,
    },
    {
      ...base,
      phase: "deref-moved",
      line: LINE.derefMoved,
      part: deref,
      terminal: [print(offset), print(offset), print(offset + 1)],
      isDeclared: true,
      pointerAt: 1,
      probe: offset + 1,
      readIndex: offset + 1,
    },
  ];
}

/** The largest k whose reads all stay inside an array of `length`. */
export function maxOffset(length: number): number {
  return length - MIN_LENGTH;
}

/**
 * Reads the k field. After `ptr++`, `*(ptr + k)` reads element `k + 1`, so
 * k stops one short of the last Index. The message says why, without
 * claiming that a Pointer one past the end is itself wrong: only reading
 * through it is.
 */
export function parseOffset(
  raw: string,
  length: number,
  pointer: string,
): ParseResult<number> {
  const parsed = parseIntInput(raw);
  if (!parsed.ok) {
    return parsed;
  }
  const k = parsed.value;
  if (k < 0) {
    return { ok: false, error: "Pakai k dari 0 ke atas di sini." };
  }
  if (k > maxOffset(length)) {
    return {
      ok: false,
      error: `Setelah ${pointer}++, *(${pointer} + ${k}) baca [${k + 1}], padahal Index terakhirnya ${length - 1}. Pointer boleh nunjuk satu langkah lewat ujung array, tapi baca isinya di situ undefined behavior.`,
    };
  }
  return parsed;
}

export type PointerArrayEdit =
  | { kind: "rename"; target: "arrayName" | "pointer"; name: string }
  | { kind: "resize"; length: number }
  | { kind: "value"; index: number; value: number }
  | { kind: "offset"; offset: number }
  | { kind: "restore" };

/** Every name in the program except the one being renamed. */
export function takenNames(
  program: PointerArrayProgram,
  target: "arrayName" | "pointer",
): string[] {
  return [
    ...RESERVED_NAMES,
    target === "arrayName" ? program.pointer : program.arrayName,
  ];
}

/**
 * Applies one edit; `null` when it is invalid or changes nothing. Shrinking
 * pulls k back so every read stays inside, and the note says so.
 */
export function editProgram(
  program: PointerArrayProgram,
  edit: PointerArrayEdit,
): EditResult<PointerArrayProgram> | null {
  const { values } = program;
  switch (edit.kind) {
    case "rename": {
      const name = validName(edit.name, takenNames(program, edit.target));
      return accepted(
        program,
        name === null ? null : { ...program, [edit.target]: name },
      );
    }
    case "resize": {
      const resized = resizeValues(values, edit.length, MIN_LENGTH);
      const offset = Math.min(program.offset, maxOffset(resized.length));
      return accepted(
        program,
        { ...program, values: resized, offset },
        offset === program.offset
          ? null
          : `k pindah ke ${offset}, biar *(${program.pointer} + k) tetep di dalam array ${resized.length} elemen.`,
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
    case "offset":
      return accepted(
        program,
        Number.isInteger(edit.offset) &&
          edit.offset >= 0 &&
          edit.offset <= maxOffset(values.length)
          ? { ...program, offset: edit.offset }
          : null,
      );
    case "restore":
      return accepted(program, EXAMPLE_PROGRAM);
  }
}
