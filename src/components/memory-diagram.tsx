"use client";

import { TriangleAlert } from "lucide-react";
import { type ReactNode, useLayoutEffect, useRef } from "react";

import { addressOf } from "@/lib/memory";

/*
 * One diagram for every module: a memory table. Each column is one box of
 * memory; the rows always mean the same thing and carry their role colour:
 * Variable (name), Index, Value (the box), Address. Whatever holds an Address
 * (a pointer, or `&angka` handed to scanf) sits in a row underneath, in the
 * same column, with an arrow up to the Address it holds. Nothing is drawn
 * across columns, so labels never overlap at any width; a mark that changes
 * column only slides over on its way.
 */

const ROW_HEADER =
  "pr-2 text-left align-middle text-xs font-semibold whitespace-nowrap sm:pr-3 sm:text-sm";

const BOX =
  "flex items-center justify-center border-2 font-mono font-semibold tabular-nums transition-[background-color,border-color,box-shadow] duration-200 ease-interaction";

// Array elements stay compact so five, with their Addresses, fit a 320px
// phone; a lone variable is the whole picture, so it gets more room.
const ELEMENT_SIZE =
  "min-h-11 min-w-9 px-1 text-lg sm:min-h-14 sm:min-w-14 sm:px-2 sm:text-2xl";
const VARIABLE_SIZE =
  "min-h-16 min-w-16 px-2 text-2xl sm:min-h-18 sm:min-w-24 sm:px-3 sm:text-3xl";

function boxTone(isActive: boolean): string {
  return isActive
    ? "relative z-10 border-memory-ink bg-memory/15 ring-4 ring-memory/25"
    : "border-memory bg-card";
}

function Unassigned() {
  return (
    <span className="text-muted-foreground">
      ?<span className="sr-only"> (belum diisi)</span>
    </span>
  );
}

function RowHeader({
  className,
  children,
}: {
  className: string;
  children: ReactNode;
}) {
  return (
    <th scope="row" className={`${ROW_HEADER} ${className}`}>
      {children}
    </th>
  );
}

/**
 * Name above its boxes; `w-0 min-w-full` lets a long name wrap, not widen.
 * The name keeps its own width and the rules take what is left, so a short
 * name over three narrow boxes never breaks in two.
 */
function NameLabel({ name, isArray }: { name: string; isArray: boolean }) {
  return (
    <div className="flex w-0 min-w-full items-center justify-center gap-1.5 pb-1">
      {isArray ? (
        <span aria-hidden="true" className="h-0.5 flex-1 bg-variable/60" />
      ) : null}
      <span className="min-w-0 text-center font-mono text-sm font-semibold wrap-anywhere text-variable-ink sm:text-base">
        {name}
      </span>
      {isArray ? (
        <span aria-hidden="true" className="h-0.5 flex-1 bg-variable/60" />
      ) : null}
    </div>
  );
}

type MarkRole = "pointer" | "address" | "index";

const MARK_STYLE: Record<
  MarkRole,
  { header: string; text: string; casing: string; core: string }
> = {
  pointer: {
    header: "Pointer",
    text: "text-pointer-ink",
    casing: "stroke-pointer-ink",
    core: "stroke-pointer",
  },
  address: {
    header: "Tujuan",
    text: "text-address-ink",
    casing: "stroke-address-ink",
    core: "stroke-address",
  },
  index: {
    header: "Counter",
    text: "text-index-ink",
    casing: "stroke-index-ink",
    core: "stroke-index",
  },
};

/** Ink under the base, so a light base (yellow is 2.2:1 on white) still reads. */
function UpArrow({
  role,
  isHidden = false,
}: {
  role: MarkRole;
  isHidden?: boolean;
}) {
  const { casing, core } = MARK_STYLE[role];
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 30"
      className={`mx-auto h-7 w-4 overflow-visible ${isHidden ? "invisible" : ""}`}
    >
      {[
        { className: casing, width: 5 },
        { className: core, width: 2.5 },
      ].map(({ className, width }) => (
        <path
          key={className}
          d="M8 29V4M3.5 9 8 4l4.5 5"
          fill="none"
          strokeWidth={width}
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
        />
      ))}
    </svg>
  );
}

/**
 * Something under a column that points at that column's Address: a pointer
 * box with the Address it holds, or just a label such as `i = 2` or `&angka`.
 * A hidden mark keeps its row's space, so the diagram never jumps when it
 * appears.
 */
export type Mark = { column: number; isHidden?: boolean } & (
  | {
      kind: "pointer";
      name: string;
      value: number;
      isActive?: boolean;
      /** Off while the pointer holds the Address but is not explained yet. */
      hasArrow?: boolean;
    }
  | { kind: "label"; role: MarkRole; label: string }
);

function markRole(mark: Mark): MarkRole {
  return mark.kind === "pointer" ? "pointer" : mark.role;
}

/** Where a box wider than its column hangs: centred, or flush with an edge. */
type Hang = "center" | "start" | "end";

const HANG: Record<Hang, string> = {
  center: "justify-center",
  start: "justify-start",
  end: "justify-end",
};

function MarkContent({ mark, hang }: { mark: Mark; hang: Hang }) {
  if (mark.kind === "label") {
    return (
      <>
        <UpArrow role={mark.role} />
        {/* Like the pointer box: never widen the column, or the strip
            would shift each time a moving label such as `i = 1` steps. */}
        <div className={`flex w-0 min-w-full ${HANG[hang]}`}>
          <span
            className={`shrink-0 font-mono text-sm font-semibold whitespace-nowrap ${MARK_STYLE[mark.role].text}`}
          >
            {mark.label}
          </span>
        </div>
      </>
    );
  }
  return (
    <>
      <UpArrow role="pointer" isHidden={mark.hasArrow === false} />
      {/* `w-0 min-w-full` hangs the box under its column without widening
          it, so the strip above keeps even boxes; at the strip's ends it
          hangs inwards instead of past the edge. */}
      <div className={`flex w-0 min-w-full ${HANG[hang]}`}>
        <div
          className={`flex w-max max-w-36 shrink-0 flex-col items-center rounded-xl border-2 border-pointer bg-pointer/12 px-2.5 py-1 transition-shadow duration-200 ease-interaction ${mark.isActive ? "ring-4 ring-pointer/35" : ""}`}
        >
          <span className="text-center font-mono text-sm font-semibold wrap-anywhere text-pointer-ink">
            {mark.name}
          </span>
          <span className="font-mono text-lg font-semibold text-address-ink tabular-nums">
            {mark.value}
          </span>
        </div>
      </div>
    </>
  );
}

/**
 * When a mark moves to another column it slides there from where it was, so
 * the eye follows `ptr` or `i` instead of hunting for it. Positions are taken
 * relative to the row, so resizing the panel never fakes a move.
 */
function useSlidingMarks() {
  const rowRef = useRef<HTMLTableRowElement>(null);
  const lastLeft = useRef(new Map<string, number>());
  useLayoutEffect(() => {
    const row = rowRef.current;
    if (!row) {
      return;
    }
    const rowLeft = row.getBoundingClientRect().left;
    const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const next = new Map<string, number>();
    for (const node of row.querySelectorAll<HTMLElement>("[data-slide]")) {
      const key = node.dataset.slide ?? "";
      const left = node.getBoundingClientRect().left - rowLeft;
      const before = lastLeft.current.get(key);
      next.set(key, left);
      if (
        before !== undefined &&
        Math.abs(before - left) > 1 &&
        !reduceMotion
      ) {
        node.animate(
          [
            { transform: `translateX(${before - left}px)` },
            { transform: "none" },
          ],
          // MBG's entrance curve (`--ease-entrance`): quick start, soft stop.
          { duration: 350, easing: "cubic-bezier(0.22, 1, 0.36, 1)" },
        );
      }
    }
    lastLeft.current = next;
  });
  return rowRef;
}

function MarkRow({
  marks,
  columnKeys,
  hangsInwards = false,
}: {
  marks: readonly Mark[];
  /** What each table column's mark may land on; `null` for a gap. */
  columnKeys: readonly (number | null)[];
  /** Narrow columns: boxes at the ends hang inwards, not past the edge. */
  hangsInwards?: boolean;
}) {
  const rowRef = useSlidingMarks();
  const first = marks[0];
  if (!first) {
    return null;
  }
  const style = MARK_STYLE[markRole(first)];
  const isHidden = marks.every((mark) => mark.isHidden);
  const last = columnKeys.length - 1;
  return (
    <tr ref={rowRef} className={isHidden ? "invisible" : undefined}>
      <RowHeader className={style.text}>{style.header}</RowHeader>
      {columnKeys.map((column, position) => {
        const mark =
          column === null ? undefined : marks.find((m) => m.column === column);
        const hang: Hang = !hangsInwards
          ? "center"
          : position === 0
            ? "start"
            : position === last
              ? "end"
              : "center";
        return (
          <td
            key={position}
            className={`pt-1 text-center align-top ${mark?.isHidden ? "invisible" : ""}`}
          >
            {mark ? (
              <div data-slide={marks.indexOf(mark)}>
                <MarkContent mark={mark} hang={hang} />
              </div>
            ) : null}
          </td>
        );
      })}
    </tr>
  );
}

function AddressText({
  address,
  isActive,
}: {
  address: number;
  isActive: boolean;
}) {
  return (
    // Thin padding on phones: four digits must not outgrow a 36px box.
    <span
      className={`inline-block rounded-md px-0.5 font-mono text-xs text-address-ink tabular-nums transition-shadow duration-200 sm:px-1 sm:text-sm ${isActive ? "font-bold ring-2 ring-address" : ""}`}
    >
      {address}
    </span>
  );
}

/** A position past either end of the array, drawn as a dashed box. */
export type Outside = {
  index: number;
  /**
   * `danger`: something reads it. `quiet`: shown, never touched. `hidden`:
   * not there yet, but holds its place so the strip never shifts when it
   * turns `quiet`.
   */
  tone: "danger" | "quiet" | "hidden";
};

// Phones skip the placeholder: with it, five boxes would overflow 320px.
const HOLDS_PLACE = "invisible max-sm:hidden";

type ArrayColumn =
  | { kind: "element"; index: number; value: number | null }
  | { kind: "gap" }
  | ({ kind: "outside" } & Outside);

/**
 * The array's elements, plus the outside box on the side it falls, with a
 * "…" gap when it is not right next to the array.
 */
function arrayColumns(
  values: readonly (number | null)[],
  outside: Outside | null,
): ArrayColumn[] {
  const elements: ArrayColumn[] = values.map((value, index) => ({
    kind: "element",
    index,
    value,
  }));
  if (
    outside === null ||
    (outside.index >= 0 && outside.index < values.length)
  ) {
    return elements;
  }
  const at = outside.index;
  const gap: ArrayColumn[] =
    at < -1 || at > values.length ? [{ kind: "gap" }] : [];
  const box: ArrayColumn = { kind: "outside", ...outside };
  return at < 0 ? [box, ...gap, ...elements] : [...elements, ...gap, box];
}

// Stable element keys, so a box appearing at the start never shifts focus
// between cells. The outside box is keyed by its index, so it remounts (and
// scrolls back into view) whenever it moves.
function columnKey(column: ArrayColumn): string {
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

// `relative` keeps the cells' sr-only text inside the scroller; the padding
// keeps active rings and edge pointer boxes from being clipped by it.
const SCROLLER = "relative overflow-x-auto px-2 pt-1 pb-2";

type ArrayDiagramProps = {
  name: string;
  /** `null` marks an element that has not been assigned yet. */
  values: readonly (number | null)[];
  activeIndex?: number | null;
  /** Turns each box into a button that selects it. */
  onSelect?: (index: number) => void;
  showAddresses?: boolean;
  outside?: Outside | null;
  /** Counters or pointers under the elements; `column` is the Index. */
  marks?: readonly Mark[];
};

/** An array as one strip of memory: its boxes touch, like its bytes do. */
export function ArrayDiagram({
  name,
  values,
  activeIndex = null,
  onSelect,
  showAddresses = false,
  outside = null,
  marks = [],
}: ArrayDiagramProps) {
  const columns = arrayColumns(values, outside);
  const last = values.length - 1;
  const columnIndexes = columns.map((column) =>
    column.kind === "gap" ? null : column.index,
  );
  const firstElement = columns.findIndex((c) => c.kind === "element");

  return (
    <div className={SCROLLER}>
      <table className="mx-auto border-separate border-spacing-0">
        <caption className="sr-only">
          Array {name} di Memory: Index, Value
          {showAddresses ? ", dan Address" : ""} tiap elemen
        </caption>
        <tbody>
          <tr>
            <RowHeader className="text-variable-ink">Variabel</RowHeader>
            {columns.map((column, position) =>
              position === firstElement ? (
                <td key="name" colSpan={values.length}>
                  <NameLabel name={name} isArray />
                </td>
              ) : column.kind === "element" ? null : (
                <td key={columnKey(column)} />
              ),
            )}
          </tr>
          <tr>
            <RowHeader className="text-index-ink">Index</RowHeader>
            {columns.map((column) => (
              <td
                key={columnKey(column)}
                className={`px-1 pb-1 text-center font-mono text-sm ${column.kind === "gap" ? "text-muted-foreground" : "text-index-ink"} ${column.kind !== "gap" && column.index === activeIndex ? "font-bold" : ""} ${column.kind === "outside" && column.tone === "hidden" ? HOLDS_PLACE : ""}`}
              >
                {column.kind === "gap" ? "…" : `[${column.index}]`}
              </td>
            ))}
          </tr>
          <tr>
            <RowHeader className="text-memory-ink">Value</RowHeader>
            {columns.map((column) => {
              if (column.kind === "gap") {
                return (
                  <td
                    key={columnKey(column)}
                    className="px-2 text-center text-muted-foreground"
                  >
                    …
                  </td>
                );
              }
              if (column.kind === "outside") {
                return (
                  <td
                    key={columnKey(column)}
                    className={`px-2 ${column.tone === "hidden" ? HOLDS_PLACE : ""}`}
                  >
                    {column.tone === "danger" ? (
                      <span
                        ref={revealInScroller}
                        className={`${BOX} ${ELEMENT_SIZE} gap-0.5 rounded-xl border-dashed border-destructive text-destructive`}
                      >
                        <TriangleAlert aria-hidden="true" className="size-4" />?
                        <span className="sr-only"> (di luar array)</span>
                      </span>
                    ) : column.tone === "quiet" ? (
                      <span
                        ref={revealInScroller}
                        className={`${BOX} ${ELEMENT_SIZE} rounded-xl border-dashed border-muted-foreground/50`}
                      >
                        <span className="sr-only">
                          di luar array, nggak disentuh
                        </span>
                      </span>
                    ) : (
                      // Same size as the quiet box, so its place is held.
                      <span className={`${BOX} ${ELEMENT_SIZE}`} />
                    )}
                  </td>
                );
              }
              const { index, value } = column;
              const isActive = index === activeIndex;
              // Neighbours share one border, so the strip reads as one block.
              const shape = `${index === 0 ? "rounded-l-xl" : "border-l-0"} ${index === last ? "rounded-r-xl" : ""}`;
              const look = `${BOX} ${ELEMENT_SIZE} ${shape} ${boxTone(isActive)}`;
              return (
                <td key={columnKey(column)}>
                  {onSelect ? (
                    <button
                      type="button"
                      aria-pressed={isActive}
                      aria-label={`${name}[${index}], Value ${value ?? "belum diisi"}`}
                      onClick={() => onSelect(index)}
                      className={`${look} w-full cursor-pointer hover:bg-memory/10`}
                    >
                      {value ?? <Unassigned />}
                    </button>
                  ) : (
                    <span className={look}>{value ?? <Unassigned />}</span>
                  )}
                </td>
              );
            })}
          </tr>
          {showAddresses ? (
            <tr>
              <RowHeader className="text-address-ink">Address</RowHeader>
              {columns.map((column) => (
                <td
                  key={columnKey(column)}
                  className="pt-1.5 text-center sm:px-0.5"
                >
                  {column.kind === "element" ? (
                    <AddressText
                      address={addressOf(column.index)}
                      isActive={column.index === activeIndex}
                    />
                  ) : null}
                </td>
              ))}
            </tr>
          ) : null}
          <MarkRow marks={marks} columnKeys={columnIndexes} hangsInwards />
        </tbody>
      </table>
    </div>
  );
}

export type DiagramVariable = {
  name: string;
  /** `null` while nothing has been stored yet. */
  value: number | null;
  address: number;
  isActive?: boolean;
  /** Rings the Address, e.g. when a pointer holds that same number. */
  isAddressActive?: boolean;
  /** Another name for this box right now, such as `*ptr`. */
  alias?: string;
};

/** Separate variables: each one its own box, with a gap between them. */
export function VariableDiagram({
  variables,
  marks = [],
  onSelect,
}: {
  variables: readonly DiagramVariable[];
  /** Pointers or `&x` arguments under the variables; `column` is the position. */
  marks?: readonly Mark[];
  /** Turns each box into a button, e.g. to point a Pointer at it. */
  onSelect?: (position: number) => void;
}) {
  const columnKeys = variables.map((_, position) => position);
  return (
    <div className={SCROLLER}>
      <table className="mx-auto border-separate border-spacing-x-3 border-spacing-y-0 sm:border-spacing-x-6">
        <caption className="sr-only">
          Variabel di Memory: nama, Value, dan Address
        </caption>
        <tbody>
          <tr>
            <RowHeader className="text-variable-ink">Variabel</RowHeader>
            {variables.map((variable) => (
              <td key={variable.name}>
                <NameLabel name={variable.name} isArray={false} />
              </td>
            ))}
          </tr>
          <tr>
            <RowHeader className="text-memory-ink">Value</RowHeader>
            {variables.map((variable, position) => {
              const isActive = variable.isActive ?? false;
              const look = `${BOX} ${VARIABLE_SIZE} relative rounded-xl ${boxTone(isActive)}`;
              const content = (
                <>
                  {variable.value ?? <Unassigned />}
                  {variable.alias ? (
                    // Beside the box, in the column's spacing: clear of the
                    // name above and the Address below, and showing it never
                    // moves anything else.
                    <span className="absolute top-1/2 left-full ml-2 w-max max-w-28 -translate-y-1/2 rounded-md bg-card px-1.5 font-mono text-xs leading-5 font-semibold wrap-anywhere text-pointer-ink ring-2 ring-pointer">
                      {variable.alias}
                    </span>
                  ) : null}
                </>
              );
              return (
                <td key={variable.name}>
                  {onSelect ? (
                    <button
                      type="button"
                      aria-pressed={isActive}
                      aria-label={`${variable.name}, Value ${variable.value ?? "belum diisi"}`}
                      onClick={() => onSelect(position)}
                      className={`${look} cursor-pointer hover:bg-memory/10`}
                    >
                      {content}
                    </button>
                  ) : (
                    <span className={look}>{content}</span>
                  )}
                </td>
              );
            })}
          </tr>
          <tr>
            <RowHeader className="text-address-ink">Address</RowHeader>
            {variables.map((variable) => (
              <td key={variable.name} className="pt-1.5 text-center">
                <AddressText
                  address={variable.address}
                  isActive={variable.isAddressActive ?? false}
                />
              </td>
            ))}
          </tr>
          <MarkRow marks={marks} columnKeys={columnKeys} />
        </tbody>
      </table>
    </div>
  );
}
