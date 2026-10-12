"use client";

import { CodePanel } from "@/components/code-panel";
import { VariableDiagram } from "@/components/memory-diagram";
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
import {
  ExpressionArrow,
  ExpressionBox,
  Footnote,
  Muted,
  Output,
  Workspace,
} from "@/components/workspace";
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
      <Expression program={program} now={now} />
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
          <RoleChip role="pointer">{pointer}</RoleChip> itu Pointer; isinya
          Address <RoleChip role="variable">{name}</RoleChip>.
        </>
      );
    case "read-address":
      return (
        <>
          <strong>* di depan {pointer}</strong> artinya ikutin panahnya: ambil
          dulu Address yang disimpen{" "}
          <RoleChip role="pointer">{pointer}</RoleChip>.
        </>
      );
    case "read-value":
      return (
        <>
          Di ujung panahnya ada <RoleChip role="variable">{name}</RoleChip>,
          jadi printf nampilin Value-nya.
        </>
      );
    case "write":
      return (
        <>
          Value <RoleChip role="variable">{name}</RoleChip> berubah jadi{" "}
          <RoleChip role="value">{now.value}</RoleChip>. Target{" "}
          <code>{pointer}</code> tetep sama.
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

/** The one expression this step works out, with what it gives. */
function Expression({
  program,
  now,
}: {
  program: DereferenceProgram;
  now: DereferenceStep;
}) {
  const { name, pointer } = program;
  const deref = (
    <span className="min-w-0 wrap-anywhere text-pointer-ink">*{pointer}</span>
  );
  const value = <span className="text-memory-ink">{now.value}</span>;
  switch (now.phase) {
    case "start":
    case "declare":
      return (
        <ExpressionBox
          caption={<Muted>Deklarasi Pointer belum dijalankan.</Muted>}
        >
          <span className="min-w-0 wrap-anywhere text-muted-foreground">
            *{pointer}
          </span>
        </ExpressionBox>
      );
    case "pointer":
      return (
        <ExpressionBox caption={`Target ${pointer}: ${name}.`}>
          <span className="min-w-0 wrap-anywhere text-pointer-ink">
            {pointer}
          </span>
          <span>=</span>
          <span className="text-address-ink">{ADDRESS}</span>
        </ExpressionBox>
      );
    case "read-address":
      return (
        <ExpressionBox caption={`Hop 1: isi ${pointer}, Address ${ADDRESS}.`}>
          {deref}
          <ExpressionArrow />
          <span className="text-muted-foreground">
            …<span className="sr-only"> (belum)</span>
          </span>
        </ExpressionBox>
      );
    case "read-value":
      return (
        <ExpressionBox caption={`Hop 2: Value di Address ${ADDRESS}.`}>
          {deref}
          <ExpressionArrow />
          <span className="sr-only">hasilnya</span>
          {value}
        </ExpressionBox>
      );
    case "write":
      return (
        <ExpressionBox
          caption={`Ditulis ke Address ${ADDRESS}, yang masih disimpen ${pointer}.`}
        >
          {deref}
          <span>=</span>
          {value}
        </ExpressionBox>
      );
    case "print-name":
      return (
        <ExpressionBox
          caption={`Satu kotak, dua nama: ${name} dan *${pointer}.`}
        >
          <span className="min-w-0 wrap-anywhere text-variable-ink">
            {name}
          </span>
          <ExpressionArrow />
          <span className="sr-only">hasilnya</span>
          {value}
        </ExpressionBox>
      );
  }
}
