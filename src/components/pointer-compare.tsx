import { ArrowRight } from "lucide-react";
import { type ReactNode } from "react";

/**
 * `ptr` and `*ptr` one above the other: the Address the Pointer holds, and
 * the Value at that Address. The row the current step uses gets a ring, so
 * a step that changes one row visibly leaves the other alone. Before the
 * Pointer exists both are only a muted preview, with no result at all.
 */
export function PointerCompare({
  pointer,
  address,
  value,
  focus,
  caption,
}: {
  pointer: string;
  /** What the Pointer holds; `null` before it exists. */
  address: number | null;
  /** The Value at that Address; `null` before the Pointer exists. */
  value: number | null;
  focus: "pointer" | "target" | null;
  caption: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5 rounded-xl bg-muted px-2 py-2 @md:px-3">
      <Row
        term={pointer}
        isPreview={address === null}
        result={
          address === null ? null : (
            <span className="text-address-ink">{address}</span>
          )
        }
        note="Address yang disimpen"
        isFocused={focus === "pointer"}
      />
      <Row
        term={`*${pointer}`}
        isPreview={address === null}
        result={
          value === null ? null : (
            <span className="text-memory-ink">{value}</span>
          )
        }
        note={address === null ? "Value di Address itu" : `Value di ${address}`}
        isFocused={focus === "target"}
      />
      <p aria-live="polite" className="px-2 text-base">
        {caption}
      </p>
    </div>
  );
}

function Row({
  term,
  isPreview,
  result,
  note,
  isFocused,
}: {
  term: string;
  isPreview: boolean;
  result: ReactNode;
  note: string;
  isFocused: boolean;
}) {
  // Wraps whole pieces, never letters: a long name drops the rest of its
  // row to the next line instead of squeezing.
  return (
    <p
      className={`flex flex-wrap items-baseline gap-x-3 gap-y-0.5 rounded-lg px-2 py-1 transition-shadow duration-200 ${isFocused ? "bg-card ring-2 ring-foreground/35" : ""}`}
    >
      <span
        className={`min-w-0 font-mono text-xl font-semibold wrap-anywhere @md:text-2xl @lg:text-3xl ${isPreview ? "text-muted-foreground" : "text-pointer-ink"}`}
      >
        {term}
      </span>
      {isPreview ? null : (
        <span className="flex items-baseline gap-3">
          <ArrowRight
            aria-hidden="true"
            className="size-5 shrink-0 self-center text-muted-foreground"
          />
          <span className="sr-only">isinya</span>
          <span className="font-mono text-xl font-semibold tabular-nums @md:text-2xl @lg:text-3xl">
            {result}
          </span>
        </span>
      )}
      <span className="text-sm text-muted-foreground">{note}</span>
    </p>
  );
}
