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

/**
 * The condition and the loop's state in words and icons; `i` itself is the
 * marker under the diagram. A false condition stays neutral, not red: it is
 * how the loop is meant to end, not an error.
 */
export function LoopStatus({
  frame,
  length,
}: {
  frame: LoopFrame;
  length: number;
}) {
  return (
    <dl className="flex flex-wrap items-center gap-x-6 gap-y-2">
      <StatusItem term="Kondisi">
        {frame.condition === null ? (
          "—"
        ) : (
          <>
            <span className="font-mono">
              {frame.i} &lt; {length}
            </span>{" "}
            <IconLabel icon={frame.condition ? Check : X}>
              {frame.condition ? "benar" : "salah"}
            </IconLabel>
          </>
        )}
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
    <div className="flex items-center gap-2">
      <dt className="text-sm text-muted-foreground">{term}</dt>
      <dd className="flex items-center gap-1.5 text-base font-semibold">
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
    <span className="inline-flex items-center gap-1">
      <Icon aria-hidden="true" className="size-4" />
      {children}
    </span>
  );
}
