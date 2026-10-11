"use client";

import { CodePanel } from "@/components/code-panel";
import { VariableDiagram } from "@/components/memory-diagram";
import { PointerCompare } from "@/components/pointer-compare";
import {
  EditorCard,
  FieldRow,
  IntInput,
  NameInput,
} from "@/components/program-editor";
import { Narration, RoleChip } from "@/components/ui";
import { useSimulation } from "@/components/use-simulation";
import {
  Footnote,
  Muted,
  Output,
  PreviewNote,
  Workspace,
} from "@/components/workspace";
import {
  ADDRESSES,
  EXAMPLE_PROGRAM,
  type NameKey,
  type PointerTargetProgram,
  type PointerTargetStep,
  type Target,
  type ValueKey,
  editProgram,
  programLines,
  runSnapshots,
  takenNames,
} from "@/lib/pointer-target";

const TARGETS: readonly Target[] = ["a", "b"];

export function PointerTargetDemo() {
  const sim = useSimulation({
    example: EXAMPLE_PROGRAM,
    edit: editProgram,
    run: runSnapshots,
  });
  const { program, now, handleEdit } = sim;
  const { pointer } = program;
  const names: Record<Target, string> = { a: program.nameA, b: program.nameB };
  const rename = (target: NameKey) => (name: string) =>
    handleEdit({ kind: "rename", target, name });
  const revalue = (target: ValueKey) => (value: number) =>
    handleEdit({ kind: "value", target, value });

  return (
    <Workspace
      stepper={sim.stepper}
      editor={
        <EditorCard
          key={sim.editorKey}
          title="Atur Variabel"
          onRestore={() => handleEdit({ kind: "restore" })}
        >
          <FieldRow>
            <NameInput
              label="Nama variabel A"
              value={program.nameA}
              taken={takenNames(program, "nameA")}
              onCommit={rename("nameA")}
              className="flex-1 basis-32"
            />
            <IntInput
              label={`Value ${program.nameA}`}
              value={program.valueA}
              onCommit={revalue("valueA")}
            />
          </FieldRow>
          <FieldRow>
            <NameInput
              label="Nama variabel B"
              value={program.nameB}
              taken={takenNames(program, "nameB")}
              onCommit={rename("nameB")}
              className="flex-1 basis-32"
            />
            <IntInput
              label={`Value ${program.nameB}`}
              value={program.valueB}
              onCommit={revalue("valueB")}
            />
          </FieldRow>
          <FieldRow>
            <NameInput
              label="Nama Pointer"
              value={pointer}
              taken={takenNames(program, "pointer")}
              onCommit={rename("pointer")}
              className="flex-1 basis-32"
            />
            <IntInput
              label={`Value baru (*${pointer} = …)`}
              value={program.newValue}
              onCommit={revalue("newValue")}
            />
          </FieldRow>
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
        <VariableDiagram
          variables={TARGETS.map((key, position) => ({
            name: names[key],
            value: now.values[key],
            address: ADDRESSES[key],
            isDeclared: position < now.declared,
            isActive:
              now.phase === "print" ||
              (now.phase === "write" && key === now.target),
            isAddressActive:
              key === now.target &&
              (now.phase === "point" || now.phase === "redirect"),
            alias:
              now.phase === "write" && key === now.target
                ? `*${pointer}`
                : null,
          }))}
          marks={[
            {
              kind: "pointer",
              column: now.target === "b" ? 1 : 0,
              name: pointer,
              value: ADDRESSES[now.target ?? "a"],
              isActive: now.phase === "point" || now.phase === "redirect",
              isHidden: now.target === null,
            },
          ]}
        />
        <PreviewNote isShown={now.declared === 0}>
          Preview variabel — deklarasi belum dijalankan.
        </PreviewNote>
      </div>
      <PointerCompare
        pointer={pointer}
        address={now.target === null ? null : ADDRESSES[now.target]}
        value={now.target === null ? null : now.values[now.target]}
        focus={
          now.phase === "point" || now.phase === "redirect"
            ? "pointer"
            : now.phase === "write"
              ? "target"
              : null
        }
        caption={<Caption program={program} now={now} />}
      />
      <Output pieces={now.terminal} freshFrom={sim.freshFrom} />
      <Footnote>
        Address {ADDRESSES.a} dan {ADDRESSES.b} cuma simulasi.
      </Footnote>
    </Workspace>
  );
}

/** One sentence on why the current line does what it does. */
function Explanation({
  program,
  now,
}: {
  program: PointerTargetProgram;
  now: PointerTargetStep;
}) {
  const { nameA, nameB, pointer } = program;
  switch (now.phase) {
    case "start":
      return (
        <>
          Program masuk ke <code>main()</code>. Deklarasi variabel belum
          dijalankan.
        </>
      );
    case "declare-a":
      return (
        <>
          Variabel <RoleChip role="variable">{nameA}</RoleChip> nyimpen{" "}
          {now.values.a} di{" "}
          <RoleChip role="address">Address {ADDRESSES.a}</RoleChip>.
        </>
      );
    case "declare-b":
      return (
        <>
          <RoleChip role="variable">{nameB}</RoleChip> dapet kotak sendiri di{" "}
          <RoleChip role="address">Address {ADDRESSES.b}</RoleChip>, jadi
          Address-nya beda.
        </>
      );
    case "point":
      return (
        <>
          <RoleChip role="pointer">{pointer}</RoleChip> nyimpen{" "}
          <RoleChip role="address">Address {ADDRESSES.a}</RoleChip>, jadi nunjuk
          ke {nameA}.
        </>
      );
    case "redirect":
      return (
        <>
          <code>
            {pointer} = &amp;{nameB}
          </code>{" "}
          (tanpa *) cuma ganti isi <RoleChip role="pointer">{pointer}</RoleChip>{" "}
          jadi <RoleChip role="address">{ADDRESSES.b}</RoleChip>; Value dua
          variabelnya tetep.
        </>
      );
    case "write":
      return (
        <>
          <code>*{pointer} = …</code> (pakai *) nulis{" "}
          <RoleChip role="value">{now.values.b}</RoleChip> ke yang ditunjuk,
          yaitu <RoleChip role="variable">{nameB}</RoleChip>; {pointer} nggak
          pindah.
        </>
      );
    case "print":
      return (
        <>
          <RoleChip role="variable">{nameA}</RoleChip> tetep {now.values.a};
          cuma {nameB} yang berubah, lewat {pointer}.
        </>
      );
  }
}

/** What the comparison shows on this step, in a few words. */
function Caption({
  program,
  now,
}: {
  program: PointerTargetProgram;
  now: PointerTargetStep;
}) {
  const { pointer } = program;
  switch (now.phase) {
    case "start":
    case "declare-a":
    case "declare-b":
      return <Muted>Pointer-nya belum ada.</Muted>;
    case "point":
      return (
        <>
          <code>{pointer}</code> nunjuk ke kotak di {ADDRESSES.a}.
        </>
      );
    case "redirect":
      return (
        <>
          Isi <code>{pointer}</code> ganti {ADDRESSES.a} → {ADDRESSES.b}, jadi{" "}
          <code>*{pointer}</code> sekarang kotak lain.
        </>
      );
    case "write":
      return (
        <>
          Cuma <code>*{pointer}</code> yang ganti; <code>{pointer}</code> tetep{" "}
          {ADDRESSES.b}.
        </>
      );
    case "print":
      return (
        <>
          <code>{pointer}</code> = Address, <code>*{pointer}</code> = Value di
          Address itu.
        </>
      );
  }
}
