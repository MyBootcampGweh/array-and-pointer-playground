import {
  Check,
  CircleCheck,
  CircleStop,
  type LucideIcon,
  Repeat,
  X,
} from "lucide-react";
import { type ReactNode } from "react";

import { type LoopFrame } from "@/lib/loop-trace";

type LoopStatusProps = {
  frame: LoopFrame;
  length: number;
  arrayName: string;
  /** Label for the element the body touches, e.g. "Diisi". */
  activeLabel: string;
};

/**
 * The loop's state in words and icons, so a step never relies on the
 * highlight alone. A false condition stays neutral, not red: it is how the
 * loop is meant to end, not an error.
 */
export function LoopStatus({
  frame,
  length,
  arrayName,
  activeLabel,
}: LoopStatusProps) {
  return (
    <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      <StatusItem term="i">
        <span className="text-index">{frame.i}</span>
      </StatusItem>
      <StatusItem term="Kondisi">
        {frame.condition === null ? (
          "—"
        ) : (
          <>
            {frame.i} &lt; {length}{" "}
            <IconLabel icon={frame.condition ? Check : X}>
              {frame.condition ? "benar" : "salah"}
            </IconLabel>
          </>
        )}
      </StatusItem>
      <StatusItem term={activeLabel}>
        {frame.activeIndex === null
          ? "—"
          : `${arrayName}[${frame.activeIndex}]`}
      </StatusItem>
      <StatusItem term="Loop">
        {frame.phase === "done" ? (
          <IconLabel icon={CircleCheck}>selesai</IconLabel>
        ) : frame.condition === false ? (
          <IconLabel icon={CircleStop}>berhenti</IconLabel>
        ) : (
          <IconLabel icon={Repeat}>jalan</IconLabel>
        )}
      </StatusItem>
    </dl>
  );
}

function StatusItem({ term, children }: { term: string; children: ReactNode }) {
  return (
    <div className="min-w-0 rounded-xl bg-muted px-3 py-2">
      <dt className="text-xs font-medium text-muted-foreground">{term}</dt>
      <dd className="flex flex-wrap items-center gap-x-2 font-mono text-base font-semibold break-words sm:text-lg">
        {children}
      </dd>
    </div>
  );
}

function IconLabel({
  icon: Icon,
  children,
}: {
  icon: LucideIcon;
  children: ReactNode;
}) {
  return (
    <span className="inline-flex items-center gap-1 font-sans text-sm font-medium">
      <Icon aria-hidden="true" className="size-4" />
      {children}
    </span>
  );
}
