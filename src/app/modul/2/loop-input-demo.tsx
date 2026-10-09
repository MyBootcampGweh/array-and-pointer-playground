"use client";

import { Keyboard } from "lucide-react";
import { type ReactNode, useState } from "react";

import { CodePanel } from "@/components/code-panel";
import {
  ArrayValuesField,
  DataEditor,
  NameField,
} from "@/components/data-editor";
import { LoopStatus } from "@/components/loop-status";
import { ArrayView } from "@/components/memory-cell";
import { StepControls, useStepper } from "@/components/step-controls";
import { Narration, Panel, RoleChip, Stage } from "@/components/ui";
import {
  LOOP_HEADER_PART,
  type LoopFrame,
  traceForLoop,
} from "@/lib/loop-trace";

const DEFAULT_NAME = "nilai";
const DEFAULT_INPUT: readonly number[] = [10, 20, 30, 40, 50];
const SNIPPET_NAMES = ["i", "ukuran_array", "scanf"];
const LOOP_LINE = 3;
const BODY_LINE = 4;

export function LoopInputDemo() {
  const [name, setName] = useState(DEFAULT_NAME);
  const [input, setInput] = useState(DEFAULT_INPUT);
  const frames = traceForLoop("input", input);
  const stepper = useStepper(frames.length);
  const frame = frames[stepper.step] ?? frames[0];
  const length = input.length;

  const lines = [
    `int ${name}[${length}];`,
    `int ukuran_array = ${length};`,
    "",
    "for (int i = 0; i < ukuran_array; i++) {",
    `    scanf("%d", &${name}[i]);`,
    "}",
  ];
  const activeLine =
    frame.phase === "done"
      ? null
      : frame.phase === "body"
        ? BODY_LINE
        : LOOP_LINE;

  // Any edit starts the run over, so the code and the diagram always agree.
  function changeName(next: string) {
    setName(next);
    stepper.reset();
  }
  function changeInput(next: readonly number[]) {
    setInput(next);
    stepper.reset();
  }
  function restoreExample() {
    changeName(DEFAULT_NAME);
    changeInput(DEFAULT_INPUT);
  }

  return (
    <Stage
      code={
        <CodePanel
          lines={lines}
          activeLine={activeLine}
          activePart={LOOP_HEADER_PART[frame.phase]}
        />
      }
      editor={
        <DataEditor onRestore={restoreExample}>
          <NameField
            label="Nama array"
            value={name}
            taken={SNIPPET_NAMES}
            onCommit={changeName}
          />
          <ArrayValuesField
            name={name}
            values={input}
            onChange={changeInput}
            legend="Input keyboard"
          />
        </DataEditor>
      }
      visual={
        <Panel title="Keyboard → array">
          <div className="flex flex-col gap-4">
            <KeyboardQueue
              input={input}
              readCount={frame.cells.filter((cell) => cell !== null).length}
              readingIndex={frame.activeIndex}
            />
            <ArrayView
              name={name}
              values={frame.cells}
              activeIndex={frame.activeIndex}
              activeLabel="diisi"
            />
            <LoopStatus
              frame={frame}
              length={length}
              arrayName={name}
              activeLabel="Diisi"
            />
          </div>
        </Panel>
      }
      controls={<StepControls stepper={stepper} />}
      narration={<Narration>{describe(frame, name, length)}</Narration>}
    />
  );
}

/** What the student "types", drawn as keycaps; read keys are struck through. */
function KeyboardQueue({
  input,
  readCount,
  readingIndex,
}: {
  input: readonly number[];
  readCount: number;
  readingIndex: number | null;
}) {
  return (
    <div>
      <p className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <Keyboard aria-hidden="true" className="size-4" />
        Input dari keyboard
      </p>
      <ol className="mt-2 flex flex-wrap gap-2">
        {input.map((value, index) => {
          const isReading = index === readingIndex;
          const isRead = index < readCount && !isReading;
          const tone = isReading
            ? "border-active bg-active/10 font-semibold text-active"
            : isRead
              ? "border-border text-muted-foreground line-through"
              : "border-border bg-card";
          return (
            <li
              key={index}
              className={`flex min-w-11 justify-center rounded-lg border border-b-4 px-2.5 py-1 font-mono text-base transition-colors ${tone}`}
            >
              {value}
              <span className="sr-only">
                {isReading
                  ? " (lagi dibaca)"
                  : isRead
                    ? " (udah dibaca)"
                    : " (nunggu giliran)"}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function describe(frame: LoopFrame, name: string, length: number): ReactNode {
  switch (frame.phase) {
    case "init":
      return (
        <>
          <code>int i = 0</code>: bikin penghitung i, mulai dari 0. Bagian ini
          cuma jalan sekali.
        </>
      );
    case "check":
      return frame.condition ? (
        <>
          Cek <code>i &lt; ukuran_array</code>: {frame.i} &lt; {length}? Bener,
          masuk ke loop.
        </>
      ) : (
        <>
          Cek lagi: {length} &lt; {length}? <strong>Salah</strong>, loop
          berhenti. <code>{`${name}[${length}]`}</code> nggak pernah disentuh.
        </>
      );
    case "body":
      return (
        <>
          scanf baca{" "}
          <RoleChip role="value">{frame.cells[frame.activeIndex]}</RoleChip>{" "}
          dari keyboard, terus disimpen ke{" "}
          <code>{`${name}[${frame.activeIndex}]`}</code>. Tanda &amp; itu alamat
          tujuannya (dibahas di Modul 5).
        </>
      );
    case "increment":
      return (
        <>
          <code>i++</code>: i naik dari {frame.i - 1} jadi {frame.i}.
        </>
      );
    case "done":
      return <>Beres! scanf jalan {length} kali, semua kotak udah keisi.</>;
  }
}
