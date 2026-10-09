import { type ReactNode } from "react";

import { type LoopFrame } from "@/lib/loop-trace";

type LoopStatusProps = {
  frame: LoopFrame;
  length: number;
  arrayName: string;
  /** Label for the element the body touches, e.g. "Sedang diisi". */
  activeLabel: string;
};

/** The loop's state in words, so a step never relies on the highlight alone. */
export function LoopStatus({
  frame,
  length,
  arrayName,
  activeLabel,
}: LoopStatusProps) {
  const condition =
    frame.condition === null
      ? "—"
      : `${frame.i} < ${length} → ${frame.condition ? "benar" : "salah"}`;
  const status =
    frame.phase === "done"
      ? "selesai"
      : frame.condition === false
        ? "berhenti"
        : "berjalan";

  return (
    <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      <StatusItem term="i" valueClassName="text-index">
        {frame.i}
      </StatusItem>
      <StatusItem term="Kondisi">{condition}</StatusItem>
      <StatusItem term={activeLabel}>
        {frame.activeIndex === null
          ? "—"
          : `${arrayName}[${frame.activeIndex}]`}
      </StatusItem>
      <StatusItem term="Status loop">{status}</StatusItem>
    </dl>
  );
}

function StatusItem({
  term,
  valueClassName = "",
  children,
}: {
  term: string;
  valueClassName?: string;
  children: ReactNode;
}) {
  return (
    <div className="min-w-0 rounded-xl bg-surface-muted px-3 py-2">
      <dt className="text-xs font-medium text-muted-foreground">{term}</dt>
      <dd
        className={`font-mono text-base font-semibold break-words sm:text-lg ${valueClassName}`}
      >
        {children}
      </dd>
    </div>
  );
}
