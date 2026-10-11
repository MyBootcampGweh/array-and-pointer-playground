"use client";

import { ArrowRight, MousePointerClick, Terminal } from "lucide-react";
import { useState } from "react";

import { CodePanel } from "@/components/code-panel";
import { SplitView } from "@/components/split-view";
import { useStepper } from "@/components/step-controls";
import { Narration, RoleChip } from "@/components/ui";
import {
  type ArrayIndexingProgram,
  EXAMPLE_PROGRAM,
  LINE,
  type ProgramEdit,
  RESULT_NAME,
  type RunSnapshot,
  editProgram,
  programLines,
  runSnapshots,
} from "@/lib/array-indexing";

import { ArrayEditor } from "./array-editor";
import { RunControls } from "./run-controls";

export function ArrayIndexingDemo() {
  const [program, setProgram] = useState(EXAMPLE_PROGRAM);
  const [notice, setNotice] = useState<string | null>(null);
  // Bumped by Pulihkan Contoh, so half-typed drafts go too.
  const [editorKey, setEditorKey] = useState(0);
  const snapshots = runSnapshots(program);
  const stepper = useStepper(snapshots.length);
  const now = snapshots[stepper.step] ?? snapshots[0];

  function handleEdit(edit: ProgramEdit) {
    if (edit.kind === "restore") {
      setEditorKey((key) => key + 1);
      setNotice(null);
    }
    const result = editProgram(program, edit);
    // Same program as before: the run carries on where it was.
    if (result === null) {
      return;
    }
    const { program: next, movedIndex } = result;
    setProgram(next);
    setNotice(
      movedIndex
        ? `Index pindah ke ${movedIndex.to}, soalnya array-nya sekarang cuma ${next.values.length} elemen.`
        : null,
    );
    // A new program means the old run no longer applies: back to its start.
    stepper.reset();
  }

  return (
    <div className="flex flex-col">
      <RunControls stepper={stepper} />
      <SplitView
        isWorkspace
        editor={
          <ArrayEditor
            key={editorKey}
            program={program}
            notice={notice}
            onEdit={handleEdit}
          />
        }
        code={
          <CodePanel
            lines={programLines(program, now.readIndex !== null)}
            activeLine={now.line}
            colorSyntax
          />
        }
        visual={
          <section
            aria-label="Visualisasi"
            className="@container flex min-w-0 flex-col gap-5 rounded-2xl bg-card p-3 shadow-elevated ring-1 ring-foreground/10 sm:p-5"
          >
            <Narration>
              <Explanation program={program} now={now} />
            </Narration>
            <div className="flex flex-col gap-2">
              <p className="flex gap-2 text-sm text-muted-foreground">
                <MousePointerClick
                  aria-hidden="true"
                  className="mt-0.5 size-4 shrink-0"
                />
                Klik kotaknya buat ganti Index.
              </p>
              <ArrayStrip
                program={program}
                now={now}
                onSelect={(index) => handleEdit({ kind: "select", index })}
              />
            </div>
            <Expression program={program} now={now} />
            <Output text={now.output} />
          </section>
        }
      />
    </div>
  );
}

/** One sentence on why the current line does what it does. */
function Explanation({
  program,
  now,
}: {
  program: ArrayIndexingProgram;
  now: RunSnapshot;
}) {
  const { arrayName, values, index } = program;
  const last = values.length - 1;
  switch (now.phase) {
    case "start":
      return (
        <>
          Program masuk ke <code>main()</code>. Deklarasi array belum
          dijalankan.
        </>
      );
    case "declare":
      return (
        <>
          Array <RoleChip role="variable">{arrayName}</RoleChip> sekarang ada di
          Memory: {values.length} elemen, Index-nya{" "}
          <RoleChip role="index">
            {last === 0 ? "cuma 0" : `0 sampai ${last}`}
          </RoleChip>
          .
        </>
      );
    case "read":
      return (
        <>
          <RoleChip role="index">Index {index}</RoleChip> itu elemen ke-
          {index + 1}, soalnya Index mulai dari 0.
        </>
      );
    case "print":
      return (
        <>
          <code>printf</code> nampilin Value <code>{RESULT_NAME}</code> ke
          Output.
        </>
      );
  }
}

/**
 * The array as one strip of boxes: small Index above, Value inside. Boxes stay
 * neutral; a grey outline marks the Index the student chose, and only the box
 * the running line reads turns Value green. Before the declaration runs the
 * boxes are dashed and empty, since the array is not in Memory yet.
 */
function ArrayStrip({
  program,
  now,
  onSelect,
}: {
  program: ArrayIndexingProgram;
  now: RunSnapshot;
  onSelect: (index: number) => void;
}) {
  const { arrayName, values, index } = program;
  const last = values.length - 1;

  return (
    <div className="flex flex-col gap-1">
      {/* `relative` keeps sr-only text inside the scroller; the padding keeps
        the rings of the end boxes from being clipped. */}
      <div className="relative overflow-x-auto p-1.5">
        <table className="mx-auto border-separate border-spacing-0">
          <caption className="pb-1 text-center font-mono text-sm font-semibold wrap-anywhere text-variable-ink @md:text-base @lg:text-lg">
            <span className="sr-only">Array </span>
            {arrayName}
          </caption>
          <tbody>
            <tr>
              <th
                scope="row"
                className="pr-2 text-left text-xs font-semibold text-index-ink @md:pr-3 @md:text-sm"
              >
                Index
              </th>
              {values.map((_, position) => (
                <td
                  key={position}
                  className={`pb-1 text-center font-mono text-xs @md:text-sm ${position === now.readIndex ? "font-bold text-index-ink" : "text-muted-foreground"}`}
                >
                  [{position}]
                </td>
              ))}
            </tr>
            <tr>
              <th
                scope="row"
                className="pr-2 text-left text-xs font-semibold text-memory-ink @md:pr-3 @md:text-sm"
              >
                Value
              </th>
              {values.map((value, position) => {
                const isRead = position === now.readIndex;
                const isChosen = position === index;
                // Neighbours share one border, so the boxes read as one array.
                const shape = `${position === 0 ? "rounded-l-xl" : "border-l-0"} ${position === last ? "rounded-r-xl" : ""}`;
                const tone = !now.isDeclared
                  ? "border-dashed border-foreground/25 hover:bg-muted"
                  : isRead
                    ? "border-memory-ink bg-memory/12 text-memory-ink"
                    : "border-foreground/20 bg-muted/60 hover:bg-muted";
                const mark = isRead
                  ? "relative z-10 ring-2 ring-memory-ink"
                  : isChosen
                    ? "relative z-10 ring-2 ring-foreground/60"
                    : "";
                return (
                  <td key={position}>
                    <button
                      type="button"
                      aria-pressed={isChosen}
                      aria-label={`${arrayName}[${position}], Value ${now.isDeclared ? value : "belum ada"}`}
                      onClick={() => onSelect(position)}
                      className={`flex min-h-12 w-full min-w-10 cursor-pointer items-center justify-center border-2 px-1 font-mono text-lg font-semibold tabular-nums transition-[background-color,border-color,box-shadow] duration-200 ease-interaction @md:min-h-14 @md:min-w-13 @md:px-2 @md:text-2xl @lg:min-h-16 @lg:min-w-14 @lg:text-3xl ${shape} ${tone} ${mark}`}
                    >
                      {now.isDeclared ? value : null}
                    </button>
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>
      {/* Holds its line after the declaration too, so nothing below jumps. */}
      <p
        className={`text-center text-sm text-muted-foreground ${now.isDeclared ? "invisible" : ""}`}
      >
        Preview array — deklarasi belum dijalankan.
      </p>
    </div>
  );
}

/**
 * `nilai[2] → 78`, big and right under the array. The result only shows once
 * the line that reads it has run.
 */
function Expression({
  program,
  now,
}: {
  program: ArrayIndexingProgram;
  now: RunSnapshot;
}) {
  const { arrayName, index } = program;
  return (
    <div className="flex flex-col gap-1.5 rounded-xl bg-muted px-4 py-3">
      <p className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-xl font-semibold @md:text-2xl @lg:text-3xl">
        {/* A long name may wrap, but never away from its `[2]`. */}
        <span className="min-w-0 wrap-anywhere">
          <span className="text-variable-ink">{arrayName}</span>
          <span className="whitespace-nowrap">
            [<span className="text-index-ink">{index}</span>]
          </span>
        </span>
        <ArrowRight
          aria-hidden="true"
          className="size-6 shrink-0 text-muted-foreground"
        />
        <span className="sr-only">hasilnya</span>
        {now.result === null ? (
          <span className="text-muted-foreground">
            ?<span className="sr-only"> (belum dihitung)</span>
          </span>
        ) : (
          <span className="text-memory-ink">{now.result}</span>
        )}
      </p>
      {/* Always holds a line, so the box never grows when the result lands. */}
      <p aria-live="polite" className="text-base">
        {now.result === null ? (
          <span className="text-muted-foreground">
            Hasilnya muncul pas baris {LINE.access + 1} jalan.
          </span>
        ) : (
          <>
            Value{" "}
            <span className="font-mono font-semibold text-memory-ink">
              {now.result}
            </span>{" "}
            disimpan ke variabel <code>{RESULT_NAME}</code>.
          </>
        )}
      </p>
    </div>
  );
}

/** What `printf` printed; kept small and apart from the expression. */
function Output({ text }: { text: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <p className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <Terminal aria-hidden="true" className="size-4" />
        Output
      </p>
      <samp className="block min-h-10 rounded-xl bg-muted px-3 py-2 font-mono text-base wrap-anywhere whitespace-pre-wrap">
        {text === "" ? (
          <span className="font-sans text-muted-foreground">
            Belum ada output.
          </span>
        ) : (
          text
        )}
      </samp>
    </div>
  );
}
