"use client";

import { type ReactNode, useLayoutEffect, useRef } from "react";

import { addressOf } from "@/lib/memory";

/*
 * One diagram for every module: a memory table. Each column is one box of
 * memory; the rows always mean the same thing and carry their role colour:
 * Variabel (name), Index, Value (the box), Address. Whatever holds an Address
 * (a pointer, or `&angka` handed to scanf) sits in a row underneath, in the
 * same column, with an arrow up to the Address it holds. A box another name
 * reaches right now, such as `*ptr`, gets that name in a tag above it.
 * Nothing is drawn across columns, so labels never overlap at any width; a
 * mark that changes column only slides over on its way.
 *
 * Boxes stay neutral. A grey outline marks the box the program is about to
 * use (the chosen Index, or the element scanf waits for); only the box the
 * current step reads or writes turns Value green, and only its Index and
 * Address take their role colour. Before its declaration runs, a box is a
 * dashed, empty outline: it is not in Memory yet, and a short note in the
 * empty row under it says so.
 *
 * Each diagram is its own size container, so its boxes grow with the pane
 * it sits in rather than with the screen.
 */

const ROW_HEADER =
  "pr-2 text-left align-middle text-xs font-semibold whitespace-nowrap @md:pr-3 @md:text-sm";

const BOX =
  "flex items-center justify-center border-2 font-mono font-semibold tabular-nums transition-[background-color,border-color,box-shadow] duration-200 ease-interaction";

// Five elements with their Addresses fit a 320px phone, and eight plus the
// box past the end fit half a 1280px screen. Up to five, a wider pane makes
// the boxes themselves bigger; with more they stay compact, so the strip
// still fits. A lone variable is the whole picture, so it gets more room.
const ELEMENT_SIZE =
  "min-h-12 min-w-9 px-1 text-lg @md:min-h-14 @md:text-2xl @lg:min-h-16 @lg:text-3xl @xl:min-h-18 @2xl:min-h-20 @2xl:text-4xl";
const ROOMY_ELEMENTS = 5;
const ELEMENT_WIDTH = {
  roomy:
    "@2xs:min-w-10 @md:min-w-16 @lg:min-w-18 @xl:min-w-20 @2xl:min-w-24 @3xl:min-w-28",
  compact: "@md:min-w-13 @xl:min-w-14 @2xl:min-w-16",
};

/** An array element's box size, for a strip of `count` elements. */
export function elementSize(count: number): string {
  return `${ELEMENT_SIZE} ${ELEMENT_WIDTH[count <= ROOMY_ELEMENTS ? "roomy" : "compact"]}`;
}

// The slot past the end is no element, so it stays a narrow outline.
const OUTSIDE_SIZE =
  "min-h-12 w-9 text-lg @md:min-h-14 @lg:min-h-16 @xl:min-h-18 @2xl:min-h-20";
const VARIABLE_SIZE =
  "min-h-16 min-w-16 px-2 text-2xl @md:min-h-18 @md:min-w-24 @md:px-3 @md:text-3xl @lg:min-h-20 @lg:min-w-28 @lg:text-4xl @2xl:min-h-24 @2xl:min-w-32 @2xl:text-5xl";

/** How a box looks on this step. */
type BoxState = "preview" | "neutral" | "chosen" | "active";

const BOX_TONE: Record<BoxState, string> = {
  preview: "border-dashed border-foreground/25",
  neutral: "border-foreground/20 bg-muted/60",
  chosen:
    "relative z-10 border-foreground/20 bg-muted/60 ring-2 ring-foreground/60",
  active:
    "relative z-10 border-memory-ink bg-memory/12 text-memory-ink ring-2 ring-memory-ink",
};

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
      <span className="min-w-0 text-center font-mono text-sm font-semibold wrap-anywhere text-variable-ink @md:text-base @lg:text-lg @2xl:text-xl">
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
    header: "Loop",
    text: "text-index-ink",
    casing: "stroke-index-ink",
    core: "stroke-index",
  },
};

/** Ink under the base, so a light base (yellow is 2.2:1 on white) still reads. */
function strokes(role: MarkRole) {
  const { casing, core } = MARK_STYLE[role];
  return [
    { className: casing, width: 5 },
    { className: core, width: 2.5 },
  ];
}

function UpArrow({ role }: { role: MarkRole }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 30"
      className="mx-auto h-7 w-4 overflow-visible"
    >
      {strokes(role).map(({ className, width }) => (
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
 * appears. A hidden pointer is a variable not declared yet, so like any such
 * box it shows as a dashed outline with its name and no Value.
 */
export type Mark = { column: number; isHidden?: boolean } & (
  | {
      kind: "pointer";
      name: string;
      value: number;
      isActive?: boolean;
    }
  | { kind: "label"; role: MarkRole; label: string }
);

const MARK_ROWS: readonly MarkRole[] = ["pointer", "address", "index"];

/**
 * One row per kind of mark, so two marks never share a row's columns. A
 * `note` takes the place of the first row while that row is still empty.
 */
function MarkRows({
  marks,
  columnKeys,
  note,
  trailing = false,
}: {
  marks: readonly Mark[];
  columnKeys: readonly number[];
  note: ReactNode;
  /** Whether a column past the noted ones follows, such as past the end. */
  trailing?: boolean;
}) {
  const rows = MARK_ROWS.map((role) => ({
    role,
    marks: marks.filter((mark) => markRole(mark) === role),
  })).filter((row) => row.marks.length > 0);
  const first = rows[0]?.marks[0];
  const noteHolds = Boolean(note) && rows[0]?.marks.every(isGone);
  const span = trailing ? columnKeys.length - 1 : columnKeys.length;
  return (
    <>
      {rows.map((row, r) =>
        noteHolds && r === 0 && first ? (
          <NoteRow
            key="note"
            span={span}
            trailing={trailing}
            padding="pt-1"
            holder={<MarkContent mark={first} hang="center" />}
          >
            {note}
          </NoteRow>
        ) : (
          <MarkRow
            key={row.role}
            role={row.role}
            marks={row.marks}
            columnKeys={columnKeys}
          />
        ),
      )}
      {note && !noteHolds ? (
        <NoteRow span={span} trailing={trailing} padding="pt-1">
          {note}
        </NoteRow>
      ) : null}
    </>
  );
}

/**
 * A short line on what the picture is waiting for, such as "Deklarasi belum
 * dijalankan.", under the boxes. It sits over an invisible copy of the row
 * it stands in for, so the picture keeps its height once that row fills.
 */
function NoteRow({
  span,
  trailing,
  padding,
  holder = null,
  children,
}: {
  span: number;
  trailing: boolean;
  padding: string;
  holder?: ReactNode;
  children: ReactNode;
}) {
  return (
    <tr>
      <td />
      <td colSpan={span} className={padding}>
        <div className="grid">
          {holder ? (
            <div className="invisible col-start-1 row-start-1">{holder}</div>
          ) : null}
          {/* Centred under the boxes and never wider than them: it may
              overhang into the empty row-header column instead. */}
          <p className="col-start-1 row-start-1 flex w-0 min-w-full justify-center">
            <span className="shrink-0 text-xs whitespace-nowrap text-muted-foreground @md:text-sm">
              {children}
            </span>
          </p>
        </div>
      </td>
      {trailing ? <td /> : null}
    </tr>
  );
}

function markRole(mark: Mark): MarkRole {
  return mark.kind === "pointer" ? "pointer" : mark.role;
}

/** Drawn, but only as a dashed outline: a pointer whose declaration waits. */
function isPreview(mark: Mark): boolean {
  return mark.kind === "pointer" && (mark.isHidden ?? false);
}

function isGone(mark: Mark | undefined): boolean {
  return mark !== undefined && (mark.isHidden ?? false) && !isPreview(mark);
}

/**
 * Where a box wider than its column hangs: centred, or at the strip's ends
 * flush with the column's outer edge, so it hangs inwards instead of past
 * the strip. A box that fits stays centred: its `mx-auto` takes the free
 * space, and auto margins only give way to this when there is none.
 */
type Hang = "center" | "start" | "end";

const HANG: Record<Hang, string> = {
  center: "justify-center",
  start: "justify-start",
  end: "justify-end",
};

/** Inwards at the strip's ends, so nothing hangs past its edge. */
function hangAt(position: number, count: number): Hang {
  if (count === 1) {
    return "center";
  }
  return position === 0 ? "start" : position === count - 1 ? "end" : "center";
}

/**
 * The name an expression reaches a box by right now, such as `*(ptr + 1)`,
 * in a tag right above it. A hidden tag keeps its line, so the picture never
 * jumps when it shows.
 */
function AliasTag({
  label,
  isHidden,
  hang,
}: {
  label: string;
  isHidden: boolean;
  hang: Hang;
}) {
  return (
    // `w-0 min-w-full` hangs the tag past a narrow column instead of
    // widening it; a long one wraps rather than leave the strip.
    <div className={`flex w-0 min-w-full pb-1 ${HANG[hang]}`}>
      <span
        className={`mx-auto max-w-28 shrink-0 rounded-md bg-card px-1.5 text-center font-mono text-xs leading-5 font-semibold wrap-anywhere text-pointer-ink ring-2 ring-pointer @lg:text-sm ${isHidden ? "invisible" : ""}`}
      >
        {label}
      </span>
    </div>
  );
}

function MarkContent({ mark, hang }: { mark: Mark; hang: Hang }) {
  const arrow = <UpArrow role={markRole(mark)} />;
  if (mark.kind === "label") {
    return (
      <>
        {arrow}
        {/* Like the pointer box: never widen the column, or the strip
            would shift each time a moving label such as `i = 1` steps. */}
        <div className={`flex w-0 min-w-full ${HANG[hang]}`}>
          <span
            className={`mx-auto shrink-0 font-mono text-sm font-semibold whitespace-nowrap @lg:text-base ${MARK_STYLE[mark.role].text}`}
          >
            {mark.label}
          </span>
        </div>
      </>
    );
  }
  const preview = isPreview(mark);
  return (
    <>
      <div className={preview ? "invisible" : undefined}>{arrow}</div>
      {/* `w-0 min-w-full` hangs the box under its column without widening
          it, so the strip above keeps even boxes; at the strip's ends it
          hangs inwards instead of past the edge. */}
      <div className={`flex w-0 min-w-full ${HANG[hang]}`}>
        <div
          className={`mx-auto flex w-max max-w-36 shrink-0 flex-col items-center rounded-xl border-2 px-2.5 py-1 transition-shadow duration-200 ease-interaction @lg:max-w-44 @lg:px-3 ${preview ? "border-dashed border-foreground/25" : "border-pointer bg-pointer/12"} ${mark.isActive ? "ring-4 ring-pointer/35" : ""}`}
        >
          <span
            className={`text-center font-mono text-sm font-semibold wrap-anywhere @lg:text-base ${preview ? "text-muted-foreground" : "text-pointer-ink"}`}
          >
            {mark.name}
          </span>
          <span className="font-mono text-lg font-semibold text-address-ink tabular-nums @lg:text-xl @2xl:text-2xl">
            {/* A blank line keeps the box's height; the Address it will hold
                is not known yet. */}
            {preview ? (
              <>
                {"\u00a0"}
                <span className="sr-only">belum ada</span>
              </>
            ) : (
              mark.value
            )}
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
  role,
  marks,
  columnKeys,
}: {
  role: MarkRole;
  marks: readonly Mark[];
  /** What each table column's mark may land on. */
  columnKeys: readonly number[];
}) {
  const rowRef = useSlidingMarks();
  const style = MARK_STYLE[role];
  const isHidden = marks.every(isGone);
  return (
    <tr ref={rowRef} className={isHidden ? "invisible" : undefined}>
      <RowHeader className={style.text}>{style.header}</RowHeader>
      {columnKeys.map((column, position) => {
        const mark = marks.find((m) => m.column === column);
        return (
          <td
            key={position}
            className={`pt-1 text-center align-top ${isGone(mark) ? "invisible" : ""}`}
          >
            {mark ? (
              <div data-slide={marks.indexOf(mark)}>
                <MarkContent
                  mark={mark}
                  hang={hangAt(position, columnKeys.length)}
                />
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
      className={`inline-block rounded-md px-0.5 font-mono text-xs tabular-nums transition-shadow duration-200 @md:px-1 @md:text-sm @lg:text-base ${isActive ? "font-bold text-address-ink ring-2 ring-address" : "text-muted-foreground"}`}
    >
      {address}
    </span>
  );
}

/**
 * The slot just past the last element, where a loop's `i` stops: `shown` as
 * a dashed outline nothing touches, or `held` empty so the strip never
 * shifts when it appears.
 */
export type PastEnd = "held" | "shown";

// Narrow panes skip the held slot: with it, five boxes would overflow a
// 320px phone.
const HOLDS_PLACE = "invisible @max-md:hidden";

type ArrayColumn =
  | { kind: "element"; index: number; value: number | null }
  | { kind: "past-end"; index: number; look: PastEnd };

function arrayColumns(
  values: readonly (number | null)[],
  pastEnd: PastEnd | null,
): ArrayColumn[] {
  const elements: ArrayColumn[] = values.map((value, index) => ({
    kind: "element",
    index,
    value,
  }));
  return pastEnd === null
    ? elements
    : [...elements, { kind: "past-end", index: values.length, look: pastEnd }];
}

// On a phone or with eight elements the slot lands past the scroller's
// edge, yet it is the point of the step that shows it.
function revealInScroller(node: HTMLElement | null) {
  node?.scrollIntoView({ block: "nearest", inline: "nearest" });
}

// `relative` keeps the cells' sr-only text inside the scroller; the padding
// keeps active rings and edge pointer boxes from being clipped by it.
const SCROLLER = "@container relative overflow-x-auto px-2 pt-1 pb-2";

type ArrayDiagramProps = {
  name: string;
  /** `null` marks an element that has not been assigned yet. */
  values: readonly (number | null)[];
  /** False until the declaration runs: dashed, empty boxes, no Addresses. */
  isDeclared?: boolean;
  /** The element this step reads or writes. */
  activeIndex?: number | null;
  /** The element the program is about to use: a grey outline. */
  chosenIndex?: number | null;
  /** The element whose Address this step uses; the read element by default. */
  addressIndex?: number | null;
  /** Turns each box into a button that selects it. */
  onSelect?: (index: number) => void;
  showAddresses?: boolean;
  pastEnd?: PastEnd | null;
  /** Counters or pointers under the elements; `column` is the Index. */
  marks?: readonly Mark[];
  /** Another name for one element right now, such as `*(ptr + 1)`. */
  alias?: { column: number; label: string; isHidden: boolean };
  /**
   * What the boxes are waiting for, such as "Deklarasi belum dijalankan.",
   * in the first empty row under them.
   */
  note?: ReactNode;
};

/** An array as one strip of memory: its boxes touch, like its bytes do. */
export function ArrayDiagram({
  name,
  values,
  isDeclared = true,
  activeIndex = null,
  chosenIndex = null,
  addressIndex = activeIndex,
  onSelect,
  showAddresses = false,
  pastEnd = null,
  marks = [],
  alias,
  note = null,
}: ArrayDiagramProps) {
  const columns = arrayColumns(values, pastEnd);
  const last = values.length - 1;
  const columnIndexes = columns.map((column) => column.index);
  // Before the declaration the Address row is empty: the note takes it.
  const notesAddresses = showAddresses && !isDeclared && note !== null;

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
            <td colSpan={values.length}>
              <NameLabel name={name} isArray />
            </td>
            {pastEnd === null ? null : <td />}
          </tr>
          {alias ? (
            <tr>
              <td />
              {columns.map((column, position) => (
                <td key={column.index}>
                  {column.index === alias.column ? (
                    <AliasTag
                      label={alias.label}
                      isHidden={alias.isHidden}
                      hang={hangAt(position, columns.length)}
                    />
                  ) : null}
                </td>
              ))}
            </tr>
          ) : null}
          <tr>
            <RowHeader className="text-index-ink">Index</RowHeader>
            {columns.map((column) => (
              <td
                key={column.index}
                className={`px-1 pb-1 text-center font-mono text-sm @lg:text-base ${column.index === activeIndex || column.index === chosenIndex ? "font-bold text-index-ink" : "text-muted-foreground"} ${column.kind === "past-end" && column.look === "held" ? HOLDS_PLACE : ""}`}
              >
                [{column.index}]
              </td>
            ))}
          </tr>
          <tr>
            <RowHeader className="text-memory-ink">Value</RowHeader>
            {columns.map((column) => {
              if (column.kind === "past-end") {
                return (
                  <td
                    key={column.index}
                    // A gap on the array's side only: enough to read as
                    // outside it, without costing a column of room.
                    className={`pl-2 ${column.look === "held" ? HOLDS_PLACE : ""}`}
                  >
                    {column.look === "shown" ? (
                      <span
                        ref={revealInScroller}
                        className={`${BOX} ${OUTSIDE_SIZE} rounded-xl border-dashed border-muted-foreground/50`}
                      >
                        <span className="sr-only">
                          di luar array, nggak disentuh
                        </span>
                      </span>
                    ) : (
                      // Same size as the shown slot, so its place is held.
                      <span className={`${BOX} ${OUTSIDE_SIZE}`} />
                    )}
                  </td>
                );
              }
              const { index, value } = column;
              const state: BoxState = !isDeclared
                ? "preview"
                : index === activeIndex
                  ? "active"
                  : index === chosenIndex
                    ? "chosen"
                    : "neutral";
              // Neighbours share one border, so the strip reads as one block.
              const shape = `${index === 0 ? "rounded-l-xl" : "border-l-0"} ${index === last ? "rounded-r-xl" : ""}`;
              const look = `${BOX} ${elementSize(values.length)} ${shape} ${BOX_TONE[state]}`;
              const content = isDeclared ? (
                (value ?? <Unassigned />)
              ) : (
                <span className="sr-only">belum ada</span>
              );
              return (
                <td key={column.index}>
                  {onSelect ? (
                    <button
                      type="button"
                      aria-pressed={index === chosenIndex}
                      aria-label={`${name}[${index}], Value ${isDeclared ? (value ?? "belum diisi") : "belum ada"}`}
                      onClick={() => onSelect(index)}
                      className={`${look} w-full cursor-pointer hover:bg-muted`}
                    >
                      {isDeclared ? content : null}
                    </button>
                  ) : (
                    <span className={look}>{content}</span>
                  )}
                </td>
              );
            })}
          </tr>
          {notesAddresses ? (
            <NoteRow
              span={values.length}
              trailing={pastEnd !== null}
              padding="pt-1.5"
              holder={<AddressText address={addressOf(0)} isActive={false} />}
            >
              {note}
            </NoteRow>
          ) : showAddresses ? (
            <tr>
              <RowHeader className="text-address-ink">Address</RowHeader>
              {columns.map((column) => (
                <td
                  key={column.index}
                  className={`pt-1.5 text-center @md:px-0.5 ${isDeclared ? "" : "invisible"}`}
                >
                  {column.kind === "element" ? (
                    <AddressText
                      address={addressOf(column.index)}
                      isActive={column.index === addressIndex}
                    />
                  ) : null}
                </td>
              ))}
            </tr>
          ) : null}
          <MarkRows
            marks={marks}
            columnKeys={columnIndexes}
            note={notesAddresses ? null : note}
            trailing={pastEnd !== null}
          />
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
  /** False until its declaration runs: a dashed, empty box, no Address. */
  isDeclared?: boolean;
  /** The program is about to write here, such as a waiting scanf. */
  isChosen?: boolean;
  isActive?: boolean;
  /** Rings the Address, e.g. when a pointer holds that same number. */
  isAddressActive?: boolean;
  /**
   * Another name for this box right now, such as `*ptr`, under its own name.
   * `null` keeps that line empty, so the names never jump when it shows.
   */
  alias?: string | null;
};

/** Separate variables: each one its own box, with a gap between them. */
export function VariableDiagram({
  variables,
  marks = [],
  note = null,
}: {
  variables: readonly DiagramVariable[];
  /** Pointers or `&x` arguments under the variables; `column` is the position. */
  marks?: readonly Mark[];
  /** What the boxes are waiting for, in the first empty row under them. */
  note?: ReactNode;
}) {
  const columnKeys = variables.map((_, position) => position);
  const notesAddresses =
    note !== null &&
    variables.every((variable) => variable.isDeclared === false);
  return (
    <div className={SCROLLER}>
      <table className="mx-auto border-separate border-spacing-x-3 border-spacing-y-0 @md:border-spacing-x-6">
        <caption className="sr-only">
          Variabel di Memory: nama, Value, dan Address
        </caption>
        <tbody>
          <tr>
            <RowHeader className="text-variable-ink">Variabel</RowHeader>
            {variables.map((variable) => (
              <td key={variable.name} className="align-bottom">
                <NameLabel name={variable.name} isArray={false} />
                {variable.alias === undefined ? null : (
                  // `w-0 min-w-full` wraps a long alias inside the column
                  // instead of widening it.
                  <div className="flex w-0 min-w-full justify-center pb-1.5">
                    <span
                      className={`rounded-md bg-card px-1.5 text-center font-mono text-xs leading-5 font-semibold wrap-anywhere text-pointer-ink ring-2 ring-pointer ${variable.alias === null ? "invisible" : ""}`}
                    >
                      {variable.alias ?? "*"}
                    </span>
                  </div>
                )}
              </td>
            ))}
          </tr>
          <tr>
            <RowHeader className="text-memory-ink">Value</RowHeader>
            {variables.map((variable) => {
              const isDeclared = variable.isDeclared ?? true;
              const state: BoxState = !isDeclared
                ? "preview"
                : variable.isActive
                  ? "active"
                  : variable.isChosen
                    ? "chosen"
                    : "neutral";
              return (
                <td key={variable.name}>
                  <span
                    className={`${BOX} ${VARIABLE_SIZE} rounded-xl ${BOX_TONE[state]}`}
                  >
                    {isDeclared ? (
                      (variable.value ?? <Unassigned />)
                    ) : (
                      <span className="sr-only">belum ada</span>
                    )}
                  </span>
                </td>
              );
            })}
          </tr>
          {notesAddresses ? (
            <NoteRow
              span={variables.length}
              trailing={false}
              padding="pt-1.5"
              holder={<AddressText address={addressOf(0)} isActive={false} />}
            >
              {note}
            </NoteRow>
          ) : (
            <tr>
              <RowHeader className="text-address-ink">Address</RowHeader>
              {variables.map((variable) => (
                <td
                  key={variable.name}
                  className={`pt-1.5 text-center ${(variable.isDeclared ?? true) ? "" : "invisible"}`}
                >
                  <AddressText
                    address={variable.address}
                    isActive={variable.isAddressActive ?? false}
                  />
                </td>
              ))}
            </tr>
          )}
          <MarkRows
            marks={marks}
            columnKeys={columnKeys}
            note={notesAddresses ? null : note}
          />
        </tbody>
      </table>
    </div>
  );
}
