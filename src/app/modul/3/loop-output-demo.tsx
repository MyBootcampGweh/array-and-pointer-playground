"use client";

import { Terminal } from "lucide-react";
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

  const lines = [
    `int ${name}[${length}] = {${values.join(", ")}};`,
    `int ukuran_array = ${length};`,
    "",
    "for (int i = 0; i < ukuran_array; i++) {",
    `    printf("%d ", ${name}[i]);`,
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
      visual={
        <Panel title="Array → layar">
          <div className="flex flex-col gap-4">
            <ArrayView
              name={name}
              values={frame.cells}
              activeIndex={frame.activeIndex}
              activeLabel="dibaca"
            />
            <Screen frame={frame} />
            <LoopStatus
              frame={frame}
              length={length}
              arrayName={name}
              activeLabel="Dibaca"
            />
          </div>
        </Panel>
      }
      controls={<StepControls stepper={stepper} />}
      narration={<Narration>{describe(frame, name, length)}</Narration>}
    />
  );
}

/** The simulated screen: everything printf has written, newest value ringed. */
function Screen({ frame }: { frame: LoopFrame }) {
  const { output } = frame;
  // On a body step, the last value in `output` is the one printf just wrote.
  const cut =
    frame.phase === "body"
      ? output.trimEnd().lastIndexOf(" ") + 1
      : output.length;
  const fresh = output.slice(cut).trimEnd();

  return (
    <div>
      <p className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <Terminal aria-hidden="true" className="size-4" />
        Layar (output)
      </p>
      <samp className="mt-2 block min-h-12 rounded-xl bg-muted px-4 py-2 font-mono text-lg leading-8 whitespace-pre-wrap sm:text-xl">
        {output.slice(0, cut)}
        {fresh ? (
          <>
            <mark className="rounded-sm bg-transparent px-0.5 text-value ring-2 ring-active/60">
              {fresh}
            </mark>{" "}
          </>
        ) : null}
        <span
          aria-hidden="true"
          className="inline-block h-5 w-2.5 bg-foreground/60 align-middle motion-safe:animate-pulse"
        />
        {output === "" ? <span className="sr-only">masih kosong</span> : null}
      </samp>
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
          berhenti. Semua isi array udah tampil.
        </>
      );
    case "body":
      return (
        <>
          printf ambil <code>{`${name}[${frame.activeIndex}]`}</code>, isinya{" "}
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
      return (
        <>Beres! printf jalan {length} kali, semua isi array udah tampil.</>
      );
  }
}
