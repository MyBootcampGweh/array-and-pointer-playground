"use client";

import { CodePanel } from "@/components/code-panel";
import { VariableDiagram } from "@/components/memory-diagram";
import { PointerCompare } from "@/components/pointer-compare";
import {
  EditorCard,
  FieldPair,
  FieldRow,
  IntInput,
  LaterLabel,
  NameInput,
  ValueLabel,
} from "@/components/program-editor";
import { Narration, RoleChip } from "@/components/ui";
import { useSimulation } from "@/components/use-simulation";
import { Footnote, Muted, Output, Workspace } from "@/components/workspace";
import {
  ADDRESS,
  type DereferenceProgram,
  type DereferenceStep,
  EXAMPLE_PROGRAM,
  editProgram,
  programLines,
  runSnapshots,
  takenNames,
} from "@/lib/dereference";

export function DereferenceDemo() {
  const sim = useSimulation({
    example: EXAMPLE_PROGRAM,
    edit: editProgram,
    run: runSnapshots,
  });
  const { program, now, handleEdit } = sim;
  const { name, pointer, value, newValue } = program;
  const isAtTarget =
    now.phase === "read-value" ||
    now.phase === "write" ||
    now.phase === "print-name";

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
            <FieldPair>
              <NameInput
                label="Nama variabel"
                value={name}
                taken={takenNames(program, "name")}
                onCommit={(next) =>
                  handleEdit({ kind: "rename", target: "name", name: next })
                }
                className="flex-1 basis-28"
              />
              <IntInput
                label={<ValueLabel name={name} />}
                value={value}
                onCommit={(next) =>
                  handleEdit({ kind: "value", target: "value", value: next })
                }
                className="w-24"
              />
            </FieldPair>
            <FieldPair>
              <NameInput
                label="Nama Pointer"
                value={pointer}
                taken={takenNames(program, "pointer")}
                onCommit={(next) =>
                  handleEdit({ kind: "rename", target: "pointer", name: next })
                }
                className="flex-1 basis-28"
              />
              <IntInput
                label={<LaterLabel pointer={pointer} />}
                value={newValue}
                onCommit={(next) =>
                  handleEdit({ kind: "value", target: "newValue", value: next })
                }
                className="w-32"
              />
            </FieldPair>
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
      <VariableDiagram
        variables={[
          {
            name,
            value: now.value,
            address: ADDRESS,
            isDeclared: now.isDeclared,
            isActive: isAtTarget,
            isAddressActive:
              now.phase === "read-address" || now.phase === "read-value",
            alias:
              now.phase === "read-value" || now.phase === "write"
                ? `*${pointer}`
                : null,
          },
        ]}
        marks={[
          {
            kind: "pointer",
            column: 0,
            name: pointer,
            value: ADDRESS,
            isActive: now.phase === "pointer" || now.phase === "read-address",
            isHidden: now.pointerValue === null,
          },
        ]}
        note={!now.isDeclared ? "Deklarasi belum dijalankan." : null}
      />
      <PointerCompare
        pointer={pointer}
        address={now.pointerValue}
        value={now.pointerValue === null ? null : now.value}
        focus={
          now.phase === "pointer" || now.phase === "read-address"
            ? "pointer"
            : now.phase === "read-value" || now.phase === "write"
              ? "target"
              : null
        }
        caption={<Caption program={program} now={now} />}
      />
      <Output pieces={now.terminal} freshFrom={sim.freshFrom} />
      <Footnote>Address {ADDRESS} cuma simulasi.</Footnote>
    </Workspace>
  );
}

/** One sentence on why the current line does what it does. */
function Explanation({
  program,
  now,
}: {
  program: DereferenceProgram;
  now: DereferenceStep;
}) {
  const { name, pointer } = program;
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
          Variabel <RoleChip role="variable">{name}</RoleChip> nyimpen{" "}
          {now.value} di <RoleChip role="address">Address {ADDRESS}</RoleChip>.
        </>
      );
    case "pointer":
      return (
        <>
          <strong>* di deklarasi</strong> cuma tanda kalau{" "}
          <RoleChip role="pointer">{pointer}</RoleChip> itu Pointer; isinya{" "}
          <RoleChip role="address">Address {ADDRESS}</RoleChip>.
        </>
      );
    case "read-address":
      return (
        <>
          <strong>* di depan {pointer}</strong> artinya “buka Address-nya”: cek
          dulu isi <RoleChip role="pointer">{pointer}</RoleChip>, dapet{" "}
          <RoleChip role="address">{ADDRESS}</RoleChip>.
        </>
      );
    case "read-value":
      return (
        <>
          Buka Address {ADDRESS}: Value-nya{" "}
          <RoleChip role="value">{now.value}</RoleChip>, itu yang ditampilin
          printf.
        </>
      );
    case "write":
      return (
        <>
          <code>*{pointer} = …</code> nulis{" "}
          <RoleChip role="value">{now.value}</RoleChip> ke Address {ADDRESS},
          jadi <RoleChip role="variable">{name}</RoleChip> berubah; {pointer}{" "}
          sendiri nggak pindah.
        </>
      );
    case "print-name":
      return (
        <>
          <RoleChip role="variable">{name}</RoleChip> udah{" "}
          <RoleChip role="value">{now.value}</RoleChip>, padahal nggak pernah
          ditulis langsung.
        </>
      );
  }
}

/** What the comparison shows on this step, in a few words. */
function Caption({
  program,
  now,
}: {
  program: DereferenceProgram;
  now: DereferenceStep;
}) {
  const { pointer } = program;
  switch (now.phase) {
    case "start":
    case "declare":
      return <Muted>Deklarasi Pointer belum dijalankan.</Muted>;
    case "pointer":
      return (
        <>
          <code>{pointer}</code> nyimpen Address; <code>*{pointer}</code> itu
          Value di sana.
        </>
      );
    case "read-address":
      return <>Hop 1: ambil Address dari {pointer}.</>;
    case "read-value":
      return <>Hop 2: ambil Value di Address itu.</>;
    case "write":
      return (
        <>
          Cuma <code>*{pointer}</code> yang ganti; <code>{pointer}</code> tetep{" "}
          {ADDRESS}.
        </>
      );
    case "print-name":
      return <>Satu kotak, dua jalan buat ngaksesnya.</>;
  }
}
