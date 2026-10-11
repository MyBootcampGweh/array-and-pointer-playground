"use client";

import { ArrowLeft } from "lucide-react";

import { CodePanel } from "@/components/code-panel";
import { LoopExpression } from "@/components/loop-expression";
import { ArrayDiagram } from "@/components/memory-diagram";
import {
  EditorCard,
  FieldRow,
  LengthSelect,
  NameInput,
} from "@/components/program-editor";
import { Narration, RoleChip } from "@/components/ui";
import { useSimulation } from "@/components/use-simulation";
import {
  ElementName,
  Hint,
  Muted,
  Output,
  PreviewNote,
  ScanfInput,
  Workspace,
} from "@/components/workspace";
import {
  EXAMPLE_PROGRAM,
  type LoopInputProgram,
  type LoopInputStep,
  TAKEN_NAMES,
  condition,
  editProgram,
  programLines,
  runSnapshots,
} from "@/lib/loop-input";

export function LoopInputDemo() {
  const sim = useSimulation({
    example: EXAMPLE_PROGRAM,
    edit: editProgram,
    run: runSnapshots,
  });
  const { program, now, handleEdit } = sim;
  const { arrayName, length } = program;

  return (
    <Workspace
      stepper={sim.stepper}
      isAwaitingInput={sim.isAwaitingInput}
      isOpenEnded={sim.isOpenEnded}
      editor={
        <EditorCard
          key={sim.editorKey}
          title="Atur Array"
          onRestore={() => handleEdit({ kind: "restore" })}
        >
          <FieldRow>
            <NameInput
              label="Nama array"
              value={arrayName}
              taken={TAKEN_NAMES}
              onCommit={(name) => handleEdit({ kind: "rename", name })}
            />
            <LengthSelect
              value={length}
              onChange={(next) => handleEdit({ kind: "resize", length: next })}
            />
          </FieldRow>
          <p className="text-sm text-muted-foreground">
            Value-nya kamu ketik sendiri pas scanf jalan.
          </p>
        </EditorCard>
      }
      code={
        <CodePanel
          lines={programLines(program)}
          activeLine={now.line}
          activePart={now.part}
        />
      }
    >
      <Narration>
        <Explanation program={program} now={now} />
      </Narration>
      <div className="flex flex-col gap-2">
        <Hint>Pas scanf jalan, ketik angkanya di Terminal.</Hint>
        <ArrayDiagram
          name={arrayName}
          values={now.cells ?? Array.from({ length }, () => null)}
          isDeclared={now.cells !== null}
          chosenIndex={now.phase === "input" ? now.activeIndex : null}
          activeIndex={now.phase === "store" ? now.activeIndex : null}
          // Where i stops: past the end, shown but never written.
          pastEnd={(now.i ?? 0) >= length ? "shown" : "held"}
          marks={[
            {
              kind: "label",
              role: "index",
              column: now.i ?? 0,
              label: `i = ${now.i ?? 0}`,
              isHidden: now.i === null,
            },
          ]}
        />
        <PreviewNote isShown={now.cells === null}>
          Preview array — deklarasi belum dijalankan.
        </PreviewNote>
      </div>
      <Expression program={program} now={now} />
      <Output
        title="Terminal"
        emptyText="Belum ada input."
        pieces={now.terminal}
        freshFrom={sim.freshFrom}
      >
        {now.phase === "input" ? (
          <ScanfInput
            key={sim.stepper.step}
            label={
              <>
                Ketik Value buat{" "}
                <code>
                  {arrayName}[{now.activeIndex}]
                </code>
              </>
            }
            answered={sim.answered}
            onSubmit={sim.handleInput}
          />
        ) : null}
      </Output>
    </Workspace>
  );
}

/** One sentence on why the current line does what it does. */
function Explanation({
  program,
  now,
}: {
  program: LoopInputProgram;
  now: LoopInputStep;
}) {
  const { arrayName, length } = program;
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
          Array <RoleChip role="variable">{arrayName}</RoleChip> udah ada:{" "}
          {length} kotak, tapi isinya belum jelas sampai diisi.
        </>
      );
    case "init":
      return (
        <>
          <code>int i = 0</code> cuma jalan sekali, pas loop baru mulai.
        </>
      );
    case "check":
      return now.condition ? (
        <>
          Sebelum tiap putaran, loop ngecek <code>{condition(length)}</code>{" "}
          dulu. Masih bener, jadi lanjut.
        </>
      ) : (
        <>
          i udah {length}, padahal Index terakhirnya{" "}
          <RoleChip role="index">{length - 1}</RoleChip>. {length} &lt; {length}{" "}
          itu salah, jadi loop berhenti sebelum nyentuh{" "}
          <code>
            {arrayName}[{length}]
          </code>
          .
        </>
      );
    case "input":
      return (
        <>
          scanf berhenti dan nunggu kamu ngetik angka buat{" "}
          <RoleChip role="index">Index {now.activeIndex}</RoleChip>.
        </>
      );
    case "store":
      return (
        <>
          Angka dari keyboard masuk ke{" "}
          <RoleChip role="index">Index {now.activeIndex}</RoleChip>; kotak lain
          nggak kesentuh.
        </>
      );
    case "increment":
      return (
        <>
          <code>i++</code> geser i ke Index berikutnya.
        </>
      );
    case "end":
      return (
        <>Loop selesai: scanf jalan {length} kali, sekali buat tiap elemen.</>
      );
  }
}

/** The part of the loop this step evaluates; the body is scanf's write. */
function Expression({
  program,
  now,
}: {
  program: LoopInputProgram;
  now: LoopInputStep;
}) {
  const { arrayName, length } = program;
  const isBody = now.phase === "input" || now.phase === "store";
  const value =
    now.phase === "store" ? now.cells?.[now.activeIndex ?? 0] : null;
  return (
    <LoopExpression
      part={
        now.phase === "input" || now.phase === "store"
          ? "body"
          : now.phase === "start" || now.phase === "declare"
            ? "before"
            : now.phase
      }
      i={now.i}
      length={length}
      condition={now.condition}
      body={
        isBody
          ? {
              expression: (
                <>
                  <ElementName name={arrayName} index={now.activeIndex} />
                  <ArrowLeft
                    aria-hidden="true"
                    className="size-6 shrink-0 text-muted-foreground"
                  />
                  <span className="sr-only">diisi</span>
                  {value === null || value === undefined ? (
                    <span className="text-muted-foreground">
                      ?<span className="sr-only"> (nunggu input)</span>
                    </span>
                  ) : (
                    <span className="text-memory-ink">{value}</span>
                  )}
                </>
              ),
              caption:
                value === null || value === undefined ? (
                  <Muted>Nunggu angka dari keyboard.</Muted>
                ) : (
                  <>
                    Value{" "}
                    <span className="font-mono font-semibold text-memory-ink">
                      {value}
                    </span>{" "}
                    disimpan di elemen ke-{(now.activeIndex ?? 0) + 1}.
                  </>
                ),
            }
          : null
      }
    />
  );
}
