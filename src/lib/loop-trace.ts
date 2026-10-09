export type LoopKind = "input" | "output";

export type LoopPhase = "init" | "check" | "body" | "increment" | "done";

export type LoopFrame = {
  phase: LoopPhase;
  /** Value of `i` after this step has run. */
  i: number;
  /** Result of `i < ukuran_array`, only on a check step. */
  condition: boolean | null;
  /** Array contents after this step; `null` marks an element not yet assigned. */
  cells: readonly (number | null)[];
  /** Element filled or printed by the loop body on this step. */
  activeIndex: number | null;
  /** Everything `printf` has written so far. */
  output: string;
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
): readonly LoopFrame[] {
  let cells: readonly (number | null)[] =
    kind === "input" ? values.map(() => null) : values;
  let output = "";
  const frames: LoopFrame[] = [];
  const push = (frame: Omit<LoopFrame, "cells" | "output">) =>
    frames.push({ ...frame, cells, output });

  push({ phase: "init", i: 0, condition: null, activeIndex: null });
  values.forEach((value, i) => {
    push({ phase: "check", i, condition: true, activeIndex: null });
    if (kind === "input") {
      cells = cells.map((cell, index) => (index === i ? value : cell));
    } else {
      output += `${value} `;
    }
    push({ phase: "body", i, condition: null, activeIndex: i });
    push({ phase: "increment", i: i + 1, condition: null, activeIndex: null });
  });
  push({
    phase: "check",
    i: values.length,
    condition: false,
    activeIndex: null,
  });
  push({ phase: "done", i: values.length, condition: null, activeIndex: null });
  return frames;
}
