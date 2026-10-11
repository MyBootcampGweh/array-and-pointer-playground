import { type ReactNode } from "react";

import { INT_SIZE_BYTES } from "@/lib/memory";

type AddressMathProps = {
  /** The Address the count starts from. */
  start: number;
  /** How many ints to move: an Index, or the k in `ptr + k`. */
  steps: number;
  /** Word under the start Address. */
  startLabel: string;
  /** Word under the steps: what one step counts. */
  stepsLabel: string;
  /** The Value read at the result, for `*(ptr + k)`. */
  value?: number;
};

/**
 * `start + steps × 4 = Address`, each term above the word for its role, and
 * with `value` the `→ Value` read there. It goes inside an `ExpressionBox`,
 * which sets the size.
 */
export function AddressMath({
  start,
  steps,
  startLabel,
  stepsLabel,
  value,
}: AddressMathProps) {
  return (
    <>
      {/* Two halves that each stay on one line: a narrow pane breaks the
          sum at `=`, never inside it. */}
      <span className="flex items-start gap-x-2 @md:gap-x-3">
        <Term label={startLabel} className="text-address-ink">
          {start}
        </Term>
        <Operator>+</Operator>
        <Term label={stepsLabel} className="text-index-ink">
          {steps}
        </Term>
        <Operator>×</Operator>
        <Term label="byte">{INT_SIZE_BYTES}</Term>
      </span>
      <span className="flex items-start gap-x-2 @md:gap-x-3">
        <Operator>=</Operator>
        <Term label="Address" className="text-address-ink">
          {start + steps * INT_SIZE_BYTES}
        </Term>
        {value === undefined ? null : (
          <>
            <Operator>→</Operator>
            <Term label="Value" className="text-memory-ink">
              {value}
            </Term>
          </>
        )}
      </span>
    </>
  );
}

function Term({
  label,
  className = "",
  children,
}: {
  label: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span className="flex flex-col items-center">
      <span className={className}>{children}</span>
      <span className="font-sans text-xs font-medium text-muted-foreground">
        {label}
      </span>
    </span>
  );
}

function Operator({ children }: { children: ReactNode }) {
  return <span className="text-muted-foreground">{children}</span>;
}
