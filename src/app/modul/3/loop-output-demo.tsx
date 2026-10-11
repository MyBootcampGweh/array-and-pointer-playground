"use client";

import { CodePanel } from "@/components/code-panel";
import { LoopExpression } from "@/components/loop-expression";
import { ArrayDiagram } from "@/components/memory-diagram";
import {
  EditorCard,
  FieldRow,
  LengthSelect,
  NameInput,
  ValuesRow,
} from "@/components/program-editor";
import { Narration, RoleChip } from "@/components/ui";
import { useSimulation } from "@/components/use-simulation";
import {
  ElementName,
  ExpressionArrow,
  Hint,
  Output,
  PreviewNote,
  Workspace,
} from "@/components/workspace";
import {
  EXAMPLE_PROGRAM,
  type LoopOutputProgram,
  type LoopOutputStep,
  TAKEN_NAMES,
  condition,
  editProgram,
  programLines,
  runSnapshots,
} from "@/lib/loop-output";

export function LoopOutputDemo() {
  const sim = useSimulation({
    example: EXAMPLE_PROGRAM,
    edit: editProgram,
    run: runSnapshots,
  });
  const { program, now, handleEdit } = sim;
  const { arrayName, values } = program;
  const length = values.length;

  return (
    <Workspace
      stepper={sim.stepper}
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
          <ValuesRow
            arrayName={arrayName}
            values={values}
            onCommit={(index, value) =>
              handleEdit({ kind: "value", index, value })
            }
          />
        </EditorCard>
      }
      code={
        <CodePanel
          lines={programLines(program, now.readIndex)}
          activeLine={now.line}
          activePart={now.part}
        />
      }
    >
      <Narration>
        <Explanation program={program} now={now} />
      </Narration>
      <div className="flex flex-col gap-2">
        <Hint>Tekan Berikutnya, terus liat Value-nya masuk ke Output.</Hint>
        <ArrayDiagram
          name={arrayName}
          values={values}
          isDeclared={now.isDeclared}
          activeIndex={now.readIndex}
          // Where i stops: past the end, shown but never read.
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
        <PreviewNote isShown={!now.isDeclared}>
          Preview array — deklarasi belum dijalankan.
        </PreviewNote>
      </div>
      <LoopExpression
        part={
          now.phase === "print"
            ? "body"
            : now.phase === "start" || now.phase === "declare"
              ? "before"
              : now.phase
        }
        i={now.i}
        length={length}
        condition={now.condition}
        body={
          now.readIndex === null
            ? null
            : {
                expression: (
                  <>
                    <ElementName name={arrayName} index={now.readIndex} />
                    <ExpressionArrow />
                    <span className="sr-only">hasilnya</span>
                    <span className="text-memory-ink">
                      {values[now.readIndex]}
                    </span>
                  </>
                ),
                caption: (
                  <>
                    printf nampilin{" "}
                    <span className="font-mono font-semibold text-memory-ink">
                      {values[now.readIndex]}
                    </span>
                    ; isi array-nya tetep.
                  </>
                ),
              }
        }
      />
      <Output pieces={now.terminal} freshFrom={sim.freshFrom} />
    </Workspace>
  );
}

/** One sentence on why the current line does what it does. */
function Explanation({
  program,
  now,
}: {
  program: LoopOutputProgram;
  now: LoopOutputStep;
}) {
  const { arrayName, values } = program;
  const length = values.length;
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
          Array <RoleChip role="variable">{arrayName}</RoleChip> udah ada di
          Memory, lengkap sama {length} Value-nya.
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
          itu salah, jadi loop berhenti dan semua Value udah tampil.
        </>
      );
    case "print":
      return (
        <>
          printf cuma <strong>baca</strong>{" "}
          <RoleChip role="index">Index {now.readIndex}</RoleChip>, jadi
          Value-nya nggak berubah.
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
        <>
          Loop selesai: printf jalan {length} kali, Output-nya nambah satu Value
          tiap putaran.
        </>
      );
  }
}
