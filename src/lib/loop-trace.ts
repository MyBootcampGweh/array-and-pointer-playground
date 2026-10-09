export type LoopKind = "input" | "output";

export type LoopPhase = "init" | "check" | "body" | "increment" | "done";

/**
 * One evaluation step. `condition` exists only on a check and `activeIndex`
 * (the element the body fills or prints) only on a body step.
 */
type LoopStep =
  | { phase: "init" | "increment" | "done"; condition: null; activeIndex: null }
  | { phase: "check"; condition: boolean; activeIndex: null }
  | { phase: "body"; condition: null; activeIndex: number };

export type LoopFrame = LoopStep & {
  /** Value of `i` after this step has run. */
  i: number;
  /** Array contents after this step; `null` marks an element not yet assigned. */
  cells: readonly (number | null)[];
  /** Everything `printf` has written so far. */
  output: string;
};

/** Never empty: every trace has at least init, the final check and done. */
export type LoopTrace = readonly [LoopFrame, ...LoopFrame[]];

/** The piece of the `for` header each phase evaluates; the body has its own line. */
export const LOOP_HEADER_PART: Record<LoopPhase, string | null> = {
  init: "int i = 0",
  check: "i < ukuran_array",
  body: null,
  increment: "i++",
  done: null,
};

/**
 * Traces `for (int i = 0; i < ukuran_array; i++)` one evaluation at a time,
 * in the order C runs it: init, then check → body → increment until the check
 * is false.
 *
 * For an input loop, `values` is what the student types and the array starts
 * unassigned. For an output loop, `values` is the array's initializer and the
 * body prints `"%d "` for each element.
 */
export function traceForLoop(
  kind: LoopKind,
  values: readonly number[],
): LoopTrace {
  let cells: readonly (number | null)[] =
    kind === "input" ? values.map(() => null) : values;
  let output = "";
  const snapshot = (step: LoopStep & { i: number }): LoopFrame => ({
    ...step,
    cells,
    output,
  });

  const frames: [LoopFrame, ...LoopFrame[]] = [
    snapshot({ phase: "init", i: 0, condition: null, activeIndex: null }),
  ];
  values.forEach((value, i) => {
    frames.push(
      snapshot({ phase: "check", i, condition: true, activeIndex: null }),
    );
    if (kind === "input") {
      cells = cells.map((cell, index) => (index === i ? value : cell));
    } else {
      output += `${value} `;
    }
    frames.push(
      snapshot({ phase: "body", i, condition: null, activeIndex: i }),
    );
    frames.push(
      snapshot({
        phase: "increment",
        i: i + 1,
        condition: null,
        activeIndex: null,
      }),
    );
  });
  frames.push(
    snapshot({
      phase: "check",
      i: values.length,
      condition: false,
      activeIndex: null,
    }),
    snapshot({
      phase: "done",
      i: values.length,
      condition: null,
      activeIndex: null,
    }),
  );
  return frames;
}
