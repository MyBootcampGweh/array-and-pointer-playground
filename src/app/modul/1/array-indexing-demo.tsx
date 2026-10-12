"use client";

import { useState } from "react";

import { CodePanel } from "@/components/code-panel";
import { elementSize } from "@/components/memory-diagram";
import { useStepper } from "@/components/run-controls";
import { Narration, RoleChip } from "@/components/ui";
import {
  ElementName,
  ExpressionArrow,
  ExpressionBox,
  Hint,
  Output,
  Workspace,
} from "@/components/workspace";
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
    <Workspace
      stepper={stepper}
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
        />
      }
    >
      <Narration>
        <Explanation program={program} now={now} />
      </Narration>
      <div className="flex flex-col gap-2">
        <Hint>Klik kotaknya buat ganti Index.</Hint>
        <ArrayStrip
          program={program}
          now={now}
          onSelect={(index) => handleEdit({ kind: "select", index })}
        />
      </div>
      <Expression program={program} now={now} />
      <Output
        pieces={now.output ? [{ kind: "output", text: now.output }] : []}
      />
    </Workspace>
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
          Program mulai jalan dari <code>main()</code>.
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
                  className={`pb-1 text-center font-mono text-xs @md:text-sm @lg:text-base ${position === now.readIndex ? "font-bold text-index-ink" : "text-muted-foreground"}`}
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
                      className={`flex w-full cursor-pointer items-center justify-center border-2 font-mono font-semibold tabular-nums transition-[background-color,border-color,box-shadow] duration-200 ease-interaction ${elementSize(values.length)} ${shape} ${tone} ${mark}`}
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
      {/* Holds its line once the array exists, so nothing below jumps. */}
      <p
        className={`text-center text-sm text-muted-foreground ${now.isDeclared ? "invisible" : ""}`}
      >
        Deklarasi belum dijalankan.
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
    <ExpressionBox
      caption={
        now.result === null ? (
          <span className="text-muted-foreground">
            Belum dievaluasi, hasilnya muncul pas baris {LINE.access + 1} jalan.
          </span>
        ) : (
          <>
            Value{" "}
            <span className="font-mono font-semibold text-memory-ink">
              {now.result}
            </span>{" "}
            disimpan ke variabel <code>{RESULT_NAME}</code>.
          </>
        )
      }
    >
      <ElementName name={arrayName} index={index} />
      {now.result === null ? null : (
        <>
          <ExpressionArrow />
          <span className="sr-only">hasilnya</span>
          <span className="text-memory-ink">{now.result}</span>
        </>
      )}
    </ExpressionBox>
  );
}
