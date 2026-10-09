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
import { Narration, RoleChip, Stage } from "@/components/ui";
import { type CodeLine, arrayDeclaration } from "@/lib/c-syntax";
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

  const lines: CodeLine[] = [
    arrayDeclaration(name, length),
    `int ukuran_array = ${length};`,
    "",
    "for (int i = 0; i < ukuran_array; i++) {",
    [
      '    scanf("%d", &',
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
            legend="Input keyboard buat"
          />
        </DataEditor>
      }
      hint="Tekan Lanjut buat jalanin loop-nya selangkah demi selangkah."
      visual={
        <ArrayDiagram
          name={name}
          values={frame.cells}
          activeIndex={frame.activeIndex}
          // Where i stops: past the end, shown but never written.
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
          berhenti. <code>{`${name}[${length}]`}</code> nggak pernah disentuh.
        </>
      );
    case "body":
      return (
        <>
          scanf baca{" "}
          <RoleChip role="value">{frame.cells[frame.activeIndex]}</RoleChip>{" "}
          dari keyboard, terus disimpen di{" "}
          <RoleChip role="index">Index {frame.activeIndex}</RoleChip>.
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
