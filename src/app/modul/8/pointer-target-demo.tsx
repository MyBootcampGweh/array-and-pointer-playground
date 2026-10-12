"use client";

import { CodePanel } from "@/components/code-panel";
import { VariableDiagram } from "@/components/memory-diagram";
import {
  EditorCard,
  FieldPair,
  IntInput,
  LaterLabel,
  NameInput,
} from "@/components/program-editor";
import { Narration, RoleChip } from "@/components/ui";
import { useSimulation } from "@/components/use-simulation";
import {
  ExpressionArrow,
  ExpressionBox,
  Footnote,
  Muted,
  Output,
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
          {/* One row per pair, read top to bottom; a narrow pane drops
              each Value under its name. */}
          <div className="grid gap-3">
            <FieldPair>
              <NameInput
                label="Nama variabel A"
                value={program.nameA}
                taken={takenNames(program, "nameA")}
                onCommit={rename("nameA")}
                className="flex-1 basis-40"
              />
              <IntInput
                label={<InitialLabel name={program.nameA} />}
                value={program.valueA}
                onCommit={revalue("valueA")}
              />
            </FieldPair>
            <FieldPair>
              <NameInput
                label="Nama variabel B"
                value={program.nameB}
                taken={takenNames(program, "nameB")}
                onCommit={rename("nameB")}
                className="flex-1 basis-40"
              />
              <IntInput
                label={<InitialLabel name={program.nameB} />}
                value={program.valueB}
                onCommit={revalue("valueB")}
              />
            </FieldPair>
            <FieldPair>
              <NameInput
                label="Nama Pointer"
                value={pointer}
                taken={takenNames(program, "pointer")}
                onCommit={rename("pointer")}
                className="flex-1 basis-40"
              />
              <IntInput
                label={<LaterLabel pointer={pointer} />}
                value={program.newValue}
                onCommit={revalue("newValue")}
              />
            </FieldPair>
          </div>
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
            now.phase === "write" && key === now.target ? `*${pointer}` : null,
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
        note={now.declared === 0 ? "Deklarasi belum dijalankan." : null}
      />
      <Expression program={program} now={now} />
      <Output pieces={now.terminal} freshFrom={sim.freshFrom} />
      <Footnote>
        Address {ADDRESSES.a} dan {ADDRESSES.b} cuma simulasi.
      </Footnote>
    </Workspace>
  );
}

/** An initial Value's label, named after its variable as it is now. */
function InitialLabel({ name }: { name: string }) {
  return <span className="wrap-anywhere">Value awal {name}</span>;
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
          Program mulai jalan dari <code>main()</code>.
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
          <RoleChip role="pointer">{pointer}</RoleChip> nyimpen Address dari{" "}
          <code>&amp;{nameA}</code>, jadi panahnya ke{" "}
          <RoleChip role="variable">{nameA}</RoleChip>.
        </>
      );
    case "redirect":
      return (
        <>
          <strong>Ganti target:</strong> tanpa *, yang ganti isi{" "}
          <RoleChip role="pointer">{pointer}</RoleChip> sendiri; Value dua
          variabelnya tetep.
        </>
      );
    case "write":
      return (
        <>
          <strong>Ubah Value target:</strong> pakai *, yang ganti Value di ujung
          panah; <RoleChip role="pointer">{pointer}</RoleChip> nggak pindah.
        </>
      );
    case "print":
      return (
        <>
          <RoleChip role="variable">{nameA}</RoleChip> nggak pernah kesentuh;
          cuma <RoleChip role="variable">{nameB}</RoleChip> yang berubah, lewat{" "}
          {pointer}.
        </>
      );
  }
}

/** The one expression this step works out, with what it gives. */
function Expression({
  program,
  now,
}: {
  program: PointerTargetProgram;
  now: PointerTargetStep;
}) {
  const { nameA, nameB, pointer, valueB, newValue } = program;
  const ptr = (
    <span className="min-w-0 wrap-anywhere text-pointer-ink">{pointer}</span>
  );
  const address = (target: Target) => (
    <>
      <ExpressionArrow />
      <span className="sr-only">isinya</span>
      <span className="text-address-ink">{ADDRESSES[target]}</span>
    </>
  );
  switch (now.phase) {
    case "start":
    case "declare-a":
    case "declare-b":
      return (
        <ExpressionBox
          caption={<Muted>Deklarasi Pointer belum dijalankan.</Muted>}
        >
          <span className="min-w-0 wrap-anywhere text-muted-foreground">
            {pointer}
          </span>
        </ExpressionBox>
      );
    case "point":
      return (
        <ExpressionBox caption={`Target ${pointer}: ${nameA}.`}>
          {ptr}
          {address("a")}
        </ExpressionBox>
      );
    case "redirect":
      return (
        <ExpressionBox caption={`Target ${pointer}: ${nameA} → ${nameB}.`}>
          {ptr}
          {address("b")}
        </ExpressionBox>
      );
    case "write":
      return (
        <ExpressionBox caption={`Value ${nameB}: ${valueB} → ${newValue}.`}>
          <span className="min-w-0 wrap-anywhere text-pointer-ink">
            *{pointer}
          </span>
          <span>=</span>
          <span className="text-memory-ink">{newValue}</span>
        </ExpressionBox>
      );
    case "print":
      return (
        <ExpressionBox caption={`${pointer} masih nunjuk ke ${nameB}.`}>
          {TARGETS.map((key) => (
            <span key={key} className="flex min-w-0 items-center gap-3">
              <span className="min-w-0 wrap-anywhere text-variable-ink">
                {key === "a" ? nameA : nameB}
              </span>
              <ExpressionArrow />
              <span className="sr-only">isinya</span>
              <span className="text-memory-ink">{now.values[key]}</span>
            </span>
          ))}
        </ExpressionBox>
      );
  }
}
