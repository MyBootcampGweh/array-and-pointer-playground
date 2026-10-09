import { TriangleAlert } from "lucide-react";
import { type Ref } from "react";

import { addressOf } from "@/lib/memory";

const BOX =
  "flex items-center justify-center rounded-xl border-2 px-2 font-mono text-xl font-semibold tabular-nums transition-colors duration-200 ease-interaction sm:text-2xl";

// 56px: five elements plus an out-of-bounds box still fit a 1280px projector.
const CELL_SIZE = "min-h-14 min-w-14";

const ROW_HEADER = "pr-1 text-left text-xs font-medium sm:text-sm";

function cellTone(isActive: boolean): string {
  return isActive
    ? "border-active bg-active/10 shadow-elevated"
    : "border-border bg-card";
}

function Unassigned() {
  return (
    <span className="text-muted-foreground">
      ?<span className="sr-only"> (belum diisi)</span>
    </span>
  );
}

type ArrayViewProps = {
  name: string;
  /** `null` marks an element that has not been assigned yet. */
  values: readonly (number | null)[];
  activeIndex?: number | null;
  /** Shown under the active element, so the highlight never relies on colour. */
  activeLabel?: string;
  /** An index past either end, drawn as a dashed box outside the array. */
  outOfBoundsIndex?: number | null;
  /** Turns each element into a button that selects it. */
  onSelect?: (index: number) => void;
  showAddresses?: boolean;
  /** Attached to the active element, for a pointer arrow to land on. */
  activeRef?: Ref<HTMLSpanElement>;
};

type Column =
  | { kind: "element"; index: number; value: number | null }
  | { kind: "gap" }
  | { kind: "outside"; index: number };

/**
 * The array's elements, plus the out-of-bounds box on the side it falls, with
 * a "…" gap when it is not right next to the array.
 */
function columnsFor(
  values: readonly (number | null)[],
  outside: number | null,
): Column[] {
  const elements: Column[] = values.map((value, index) => ({
    kind: "element",
    index,
    value,
  }));
  if (outside === null || (outside >= 0 && outside < values.length)) {
    return elements;
  }
  const gap: Column[] =
    outside < -1 || outside > values.length ? [{ kind: "gap" }] : [];
  const box: Column = { kind: "outside", index: outside };
  return outside < 0 ? [box, ...gap, ...elements] : [...elements, ...gap, box];
}

// Stable element keys, so a box appearing at the start never shifts focus
// between cells. The outside box is keyed by its index, so it remounts (and
// scrolls back into view) whenever it moves.
function columnKey(column: Column): string {
  return column.kind === "element"
    ? `e${column.index}`
    : column.kind === "outside"
      ? `o${column.index}`
      : column.kind;
}

// The outside box is the whole point of the warning, but on a phone or with
// eight elements it lands past the scroller's edge.
function revealInScroller(node: HTMLElement | null) {
  node?.scrollIntoView({ block: "nearest", inline: "nearest" });
}

export function ArrayView({
  name,
  values,
  activeIndex = null,
  activeLabel,
  outOfBoundsIndex = null,
  onSelect,
  showAddresses = false,
  activeRef,
}: ArrayViewProps) {
  const columns = columnsFor(values, outOfBoundsIndex);
  return (
    // `relative` keeps the cells' sr-only text inside the scroller.
    <div className="relative overflow-x-auto pb-1">
      <table className="border-separate border-spacing-x-2 border-spacing-y-1">
        <caption className="sr-only">
          Array {name}: indeks, nilai{showAddresses ? ", dan alamat" : ""} tiap
          elemen
        </caption>
        <tbody>
          <tr>
            <th scope="row" className={`${ROW_HEADER} text-index`}>
              indeks
            </th>
            {columns.map((column) => (
              <td
                key={columnKey(column)}
                className={`text-center font-mono text-sm ${column.kind === "outside" ? "text-destructive" : column.kind === "gap" ? "text-muted-foreground" : "text-index"}`}
              >
                {column.kind === "gap" ? "…" : `[${column.index}]`}
              </td>
            ))}
          </tr>
          <tr>
            <th scope="row" className={`${ROW_HEADER} text-value`}>
              nilai
            </th>
            {columns.map((column) => {
              if (column.kind === "gap") {
                return (
                  <td
                    key={columnKey(column)}
                    className="text-center text-muted-foreground"
                  >
                    …
                  </td>
                );
              }
              if (column.kind === "outside") {
                return (
                  <td key={columnKey(column)}>
                    <span
                      ref={revealInScroller}
                      className={`${BOX} ${CELL_SIZE} border-dashed border-destructive bg-destructive/5 text-destructive`}
                    >
                      ?<span className="sr-only"> (di luar array)</span>
                    </span>
                  </td>
                );
              }
              const { index, value } = column;
              const isActive = index === activeIndex;
              const box = (
                <span
                  ref={isActive ? activeRef : undefined}
                  className={`${BOX} ${CELL_SIZE} ${cellTone(isActive)} text-value`}
                >
                  {value ?? <Unassigned />}
                </span>
              );
              return (
                <td key={columnKey(column)}>
                  {onSelect ? (
                    <button
                      type="button"
                      aria-pressed={isActive}
                      aria-label={`${name}[${index}], isinya ${value ?? "belum diisi"}`}
                      onClick={() => onSelect(index)}
                      className="block rounded-xl"
                    >
                      {box}
                    </button>
                  ) : (
                    box
                  )}
                </td>
              );
            })}
          </tr>
          {showAddresses ? (
            <tr>
              <th scope="row" className={`${ROW_HEADER} text-address`}>
                alamat
              </th>
              {columns.map((column) => (
                <td
                  key={columnKey(column)}
                  className={`text-center font-mono text-xs text-address sm:text-sm ${column.kind === "element" && column.index === activeIndex ? "font-bold" : ""}`}
                >
                  {column.kind === "element" ? addressOf(column.index) : null}
                </td>
              ))}
            </tr>
          ) : null}
          {activeLabel !== undefined ? (
            <tr>
              <th scope="row">
                <span className="sr-only">penanda</span>
              </th>
              {columns.map((column) => (
                <td
                  key={columnKey(column)}
                  className="h-6 text-center text-xs font-semibold whitespace-nowrap text-active sm:text-sm"
                >
                  {column.kind === "outside" ? (
                    <span className="inline-flex items-center gap-0.5 text-destructive">
                      <TriangleAlert aria-hidden="true" className="size-3.5" />
                      di luar
                    </span>
                  ) : column.kind === "element" &&
                    column.index === activeIndex ? (
                    activeLabel
                  ) : null}
                </td>
              ))}
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}

type VariableBoxProps = {
  type: "int" | "int *";
  name: string;
  /** `null` while the variable has no assigned value yet. */
  value: number | null;
  /** Illustrative address, shown under the box. */
  address?: number;
  isActive?: boolean;
  ref?: Ref<HTMLDivElement>;
};

export function VariableBox({
  type,
  name,
  value,
  address,
  isActive = false,
  ref,
}: VariableBoxProps) {
  const isPointer = type === "int *";
  const tone = isActive
    ? cellTone(true)
    : isPointer
      ? "border-pointer/60 bg-card"
      : cellTone(false);
  return (
    <figure className="flex flex-col items-center gap-1.5">
      <figcaption className="font-mono text-sm">
        <span className="text-muted-foreground">{type} </span>
        <span
          className={`font-semibold ${isPointer ? "text-pointer" : "text-foreground"}`}
        >
          {name}
        </span>
      </figcaption>
      <div
        ref={ref}
        className={`${BOX} min-h-16 min-w-24 ${tone} ${isPointer ? "text-address" : "text-value"}`}
      >
        {value ?? <Unassigned />}
      </div>
      <span className="text-xs text-muted-foreground">
        {isPointer ? "isinya: alamat" : "isinya: nilai"}
      </span>
      {address !== undefined ? (
        <span className="font-mono text-xs text-address sm:text-sm">
          alamat {address}
        </span>
      ) : null}
    </figure>
  );
}
