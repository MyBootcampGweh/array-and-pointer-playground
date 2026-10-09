import { type ReactNode } from "react";

import { BASE_ADDRESS, INT_SIZE_BYTES, addressOf } from "@/lib/memory";

type AddressMathProps = {
  index: number;
  /** Caption under the start Address. */
  baseCaption: string;
  /** Caption under the Index: what one step counts. */
  indexCaption: string;
};

/** `start + Index × size = Address`, each term above the word for its role. */
export function AddressMath({
  index,
  baseCaption,
  indexCaption,
}: AddressMathProps) {
  return (
    // Two halves that each stay on one line: a phone breaks it at `=`.
    <p className="flex flex-wrap items-start justify-center gap-x-2 gap-y-2 font-mono text-lg font-semibold sm:gap-x-3 sm:text-2xl">
      <span className="flex items-start gap-x-2 sm:gap-x-3">
        <Term label={baseCaption} className="text-address-ink">
          {BASE_ADDRESS}
        </Term>
        <Operator>+</Operator>
        <Term label={indexCaption} className="text-index-ink">
          {index}
        </Term>
        <Operator>×</Operator>
        <Term label="byte">{INT_SIZE_BYTES}</Term>
      </span>
      <span className="flex items-start gap-x-2 sm:gap-x-3">
        <Operator>=</Operator>
        <Term label="Address-nya" className="text-address-ink">
          {addressOf(index)}
        </Term>
      </span>
    </p>
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
