"use client";

import { CodePanel } from "@/components/code-panel";
import { VariableDiagram } from "@/components/memory-diagram";
import {
  EditorCard,
  FieldPair,
  FieldRow,
  IntInput,
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
  Workspace,
} from "@/components/workspace";
import {
  ADDRESS,
  EXAMPLE_PROGRAM,
  type PointerVariableProgram,
  type PointerVariableStep,
  editProgram,
  programLines,
  runSnapshots,
  takenNames,
} from "@/lib/pointer-variable";

export function PointerVariableDemo() {
  const sim = useSimulation({
    example: EXAMPLE_PROGRAM,
    edit: editProgram,
    run: runSnapshots,
  });
  const { program, now, handleEdit } = sim;
  const { name, pointer, value } = program;

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
                onCommit={(next) => handleEdit({ kind: "value", value: next })}
                className="w-24"
              />
            </FieldPair>
            <NameInput
              label="Nama Pointer"
              value={pointer}
              taken={takenNames(program, "pointer")}
              onCommit={(next) =>
                handleEdit({ kind: "rename", target: "pointer", name: next })
              }
              className="flex-1 basis-36"
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
      <VariableDiagram
        variables={[
          {
            name,
            value,
            address: ADDRESS,
            isDeclared: now.isDeclared,
            isAddressActive: now.address !== null,
          },
        ]}
        marks={[
          {
            kind: "pointer",
            column: 0,
            name: pointer,
            value: ADDRESS,
            isActive: now.phase === "pointer",
            isHidden: now.pointerValue === null,
          },
        ]}
        note={!now.isDeclared ? "Deklarasi belum dijalankan." : null}
      />
      <Expression program={program} now={now} />
      <Footnote>Address {ADDRESS} cuma simulasi.</Footnote>
    </Workspace>
  );
}

/** One sentence on why the current line does what it does. */
function Explanation({
  program,
  now,
}: {
  program: PointerVariableProgram;
  now: PointerVariableStep;
}) {
  const { name, pointer, value } = program;
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
          Variabel <RoleChip role="variable">{name}</RoleChip> nyimpen {value}{" "}
          di <RoleChip role="address">Address {ADDRESS}</RoleChip>.
        </>
      );
    case "address":
      return (
        <>
          <RoleChip role="address">&amp;{name}</RoleChip> ngambil Address-nya{" "}
          {name}, bukan Value-nya.
        </>
      );
    case "pointer":
      return (
        <>
          Pointer <RoleChip role="pointer">{pointer}</RoleChip> nyimpen{" "}
          <RoleChip role="address">Address {ADDRESS}</RoleChip>, bukan salinan{" "}
          {value}. Panahnya cuma gambar dari Address itu.
        </>
      );
  }
}

/** What the current line works out. */
function Expression({
  program,
  now,
}: {
  program: PointerVariableProgram;
  now: PointerVariableStep;
}) {
  const { name, pointer, value } = program;
  const address = <span className="text-address-ink">{ADDRESS}</span>;
  switch (now.phase) {
    case "start":
    case "declare":
      return (
        <ExpressionBox
          caption={<Muted>Deklarasi Pointer belum dijalankan.</Muted>}
        >
          <span className="text-muted-foreground">{pointer}</span>
        </ExpressionBox>
      );
    case "address":
      return (
        <ExpressionBox caption={`Address kotak ${name}.`}>
          <span className="text-address-ink">&amp;{name}</span>
          <ExpressionArrow />
          <span className="sr-only">hasilnya</span>
          {address}
        </ExpressionBox>
      );
    case "pointer":
      return (
        <ExpressionBox
          caption={
            <>
              Isinya Address, bukan Value{" "}
              <span className="font-mono font-semibold text-memory-ink">
                {value}
              </span>
              .
            </>
          }
        >
          <span className="text-pointer-ink">{pointer}</span>
          <span>=</span>
          {address}
        </ExpressionBox>
      );
  }
}
