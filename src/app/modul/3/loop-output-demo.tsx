"use client";

import { type ReactNode, useState } from "react";

import { CodePanel } from "@/components/code-panel";
import {
  ArrayValuesField,
  DataEditor,
  NameField,
} from "@/components/data-editor";
import { ArrayDiagram } from "@/components/memory-diagram";
import { StepControls, useStepper } from "@/components/step-controls";
import { Narration, RoleChip, Screen, Stage } from "@/components/ui";
import { type CodeLine, arrayDeclaration } from "@/lib/c-syntax";
import {
  LOOP_HEADER_PART,
  type LoopFrame,
  traceForLoop,
} from "@/lib/loop-trace";

const DEFAULT_NAME = "nilai";
const DEFAULT_VALUES: readonly number[] = [10, 20, 30, 40, 50];
const SNIPPET_NAMES = ["i", "ukuran_array", "printf"];
const LOOP_LINE = 3;
const BODY_LINE = 4;

export function LoopOutputDemo() {
  const [name, setName] = useState(DEFAULT_NAME);
  const [values, setValues] = useState(DEFAULT_VALUES);
  const frames = traceForLoop("output", values);
  const stepper = useStepper(frames.length);
  const frame = frames[stepper.step] ?? frames[0];
  const length = values.length;

  const lines: CodeLine[] = [
    arrayDeclaration(name, length, values),
    `int ukuran_array = ${length};`,
    "",
    "for (int i = 0; i < ukuran_array; i++) {",
    [
      '    printf("%d ", ',
      { text: name, role: "variable" },
      "[",
      { text: "i", role: "index" },
      "]);",
    ],
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
  function changeValues(next: readonly number[]) {
    setValues(next);
    stepper.reset();
  }
  function restoreExample() {
    changeName(DEFAULT_NAME);
    changeValues(DEFAULT_VALUES);
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
            values={values}
            onChange={changeValues}
          />
        </DataEditor>
      }
      hint="Tekan Lanjut, terus liat Value-nya pindah ke layar satu per satu."
      visual={
        <>
          <ArrayDiagram
            name={name}
            values={frame.cells}
            activeIndex={frame.activeIndex}
            // Where i stops: past the end, shown but never read.
            outside={{
              index: length,
              tone: frame.i >= length ? "quiet" : "hidden",
            }}
            marks={[
              {
                kind: "label",
                role: "index",
                column: frame.i,
                label: `i = ${frame.i}`,
              },
            ]}
          />
          <Screen
            output={frame.output}
            // On a body step, the last value is the one printf just wrote.
            freshFrom={
              frame.phase === "body"
                ? frame.output.trimEnd().lastIndexOf(" ") + 1
                : null
            }
          />
        </>
      }
      controls={<StepControls stepper={stepper} />}
      narration={<Narration>{describe(frame, name, length)}</Narration>}
    />
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
          berhenti. Semua Value udah tampil.
        </>
      );
    case "body":
      return (
        <>
          printf ambil <code>{`${name}[${frame.activeIndex}]`}</code>, Value-nya{" "}
          <RoleChip role="value">{frame.cells[frame.activeIndex]}</RoleChip>,
          terus nampilin ke layar plus satu spasi.
        </>
      );
    case "increment":
      return (
        <>
          <code>i++</code>: i naik dari {frame.i - 1} jadi {frame.i}.
        </>
      );
    case "done":
      return <>Beres! printf jalan {length} kali, semua Value udah tampil.</>;
  }
}
