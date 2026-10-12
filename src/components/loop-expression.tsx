import { type ReactNode } from "react";

import { ExpressionArrow, ExpressionBox, Muted } from "@/components/workspace";

/** What a `for` step does, in the order C runs it; `body` is the loop body. */
export type LoopPart =
  "before" | "init" | "check" | "body" | "increment" | "end";

/**
 * The part of the `for` this step evaluates, with its result: `i = 0`,
 * `2 < 5 → benar`, `i++ → i = 3`. The body brings its own expression.
 */
export function LoopExpression({
  part,
  i,
  length,
  condition,
  body,
}: {
  part: LoopPart;
  i: number | null;
  length: number;
  condition: boolean | null;
  /** Shown on a body step: what the body reads or writes. */
  body: { expression: ReactNode; caption: ReactNode } | null;
}) {
  const name = <span className="text-index-ink">i</span>;
  const value = <span className="text-index-ink">{i}</span>;
  switch (part) {
    case "before":
      return (
        <ExpressionBox
          caption={<Muted>Belum dievaluasi: loop-nya belum mulai.</Muted>}
        >
          <span className="text-muted-foreground">i &lt; {length}</span>
        </ExpressionBox>
      );
    case "init":
      return (
        <ExpressionBox caption="i mulai dari 0.">
          <span>
            {name} = {value}
          </span>
        </ExpressionBox>
      );
    case "check":
      return (
        <ExpressionBox
          caption={
            condition
              ? "Benar: masuk ke badan loop."
              : "Salah: keluar dari loop."
          }
        >
          <span>
            {value} &lt; {length}
          </span>
          <ExpressionArrow />
          <span>{condition ? "benar" : "salah"}</span>
        </ExpressionBox>
      );
    case "body":
      return (
        <ExpressionBox caption={body?.caption}>
          {body?.expression}
        </ExpressionBox>
      );
    case "increment":
      return (
        <ExpressionBox caption={`i naik 1, jadi ${i}.`}>
          <span>{name}++</span>
          <ExpressionArrow />
          <span>
            {name} = {value}
          </span>
        </ExpressionBox>
      );
    case "end":
      return (
        <ExpressionBox
          caption={
            <>
              Berhenti di <code>i = {length}</code>, satu lewat Index terakhir.
            </>
          }
        >
          <span>
            {name} = {value}
          </span>
        </ExpressionBox>
      );
  }
}
