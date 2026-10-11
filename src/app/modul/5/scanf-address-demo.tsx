"use client";

import { ArrowLeft } from "lucide-react";

import { CodePanel } from "@/components/code-panel";
import { VariableDiagram } from "@/components/memory-diagram";
import { EditorCard, FieldRow, NameInput } from "@/components/program-editor";
import { Narration, RoleChip } from "@/components/ui";
import { useSimulation } from "@/components/use-simulation";
import {
  ExpressionArrow,
  ExpressionBox,
  Footnote,
  Hint,
  Muted,
  Output,
  PreviewNote,
  ScanfInput,
  Workspace,
} from "@/components/workspace";
import {
  ADDRESS,
  EXAMPLE_PROGRAM,
  type ScanfProgram,
  type ScanfStep,
  TAKEN_NAMES,
  editProgram,
  programLines,
  runSnapshots,
} from "@/lib/scanf-address";

export function ScanfAddressDemo() {
  const sim = useSimulation({
    example: EXAMPLE_PROGRAM,
    edit: editProgram,
    run: runSnapshots,
  });
  const { program, now, handleEdit } = sim;
  const { name } = program;

  return (
    <Workspace
      stepper={sim.stepper}
      isAwaitingInput={sim.isAwaitingInput}
      isOpenEnded={sim.isOpenEnded}
      editor={
        <EditorCard
          key={sim.editorKey}
          title="Atur Variabel"
          onRestore={() => handleEdit({ kind: "restore" })}
        >
          <FieldRow>
            <NameInput
              label="Nama variabel"
              value={name}
              taken={TAKEN_NAMES}
              onCommit={(next) => handleEdit({ kind: "rename", name: next })}
            />
          </FieldRow>
          <p className="text-sm text-muted-foreground">
            Angkanya kamu ketik sendiri pas scanf jalan.
          </p>
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
        <Hint>Pas scanf jalan, ketik angkanya di Terminal.</Hint>
        <VariableDiagram
          variables={[
            {
              name,
              value: now.value,
              address: ADDRESS,
              isDeclared: now.isDeclared,
              isChosen: now.phase === "input",
              isActive: now.phase === "store" || now.phase === "print",
              isAddressActive: now.hasDestination,
            },
          ]}
          marks={[
            {
              kind: "label",
              role: "address",
              column: 0,
              label: `&${name}`,
              isHidden: !now.hasDestination,
            },
          ]}
        />
        <PreviewNote isShown={!now.isDeclared}>
          Preview variabel — deklarasi belum dijalankan.
        </PreviewNote>
      </div>
      <Expression program={program} now={now} />
      <Output
        title="Terminal"
        emptyText="Belum ada apa-apa."
        pieces={now.terminal}
        freshFrom={sim.freshFrom}
      >
        {now.phase === "input" ? (
          <ScanfInput
            key={sim.stepper.step}
            label="Ketik angka buat scanf"
            answered={sim.answered}
            onSubmit={sim.handleInput}
          />
        ) : null}
      </Output>
      <Footnote>
        Address {ADDRESS} cuma simulasi; nggak ada program C yang beneran jalan.
      </Footnote>
    </Workspace>
  );
}

/** One sentence on why the current line does what it does. */
function Explanation({
  program,
  now,
}: {
  program: ScanfProgram;
  now: ScanfStep;
}) {
  const { name } = program;
  switch (now.phase) {
    case "start":
      return (
        <>
          Program masuk ke <code>main()</code>. Deklarasi variabel belum
          dijalankan.
        </>
      );
    case "declare":
      return (
        <>
          <code>int {name};</code> bikin kotak di{" "}
          <RoleChip role="address">Address {ADDRESS}</RoleChip>, tapi belum
          diisi, jadi Value-nya belum jelas.
        </>
      );
    case "address":
      return (
        <>
          scanf harus tau angkanya ditaruh di mana, jadi dikasih{" "}
          <RoleChip role="address">&amp;{name}</RoleChip>: Address-nya, bukan
          Value-nya.
        </>
      );
    case "input":
      return <>scanf berhenti dan nunggu kamu ngetik angka.</>;
    case "store":
      return (
        <>
          scanf naruh <RoleChip role="value">{now.value}</RoleChip> di{" "}
          <RoleChip role="address">Address {ADDRESS}</RoleChip>, alias kotak{" "}
          {name}.
        </>
      );
    case "print":
      return (
        <>
          printf cuma butuh Value-nya, jadi di sini <code>{name}</code> nggak
          pakai <code>&amp;</code>.
        </>
      );
  }
}

/** Where scanf writes, and what lands there. */
function Expression({
  program,
  now,
}: {
  program: ScanfProgram;
  now: ScanfStep;
}) {
  const { name } = program;
  const address = <span className="text-address-ink">{ADDRESS}</span>;
  switch (now.phase) {
    case "start":
    case "declare":
      return (
        <ExpressionBox
          caption={
            <Muted>
              {now.isDeclared
                ? "Kotaknya udah ada, isinya belum."
                : "Variabelnya belum ada."}
            </Muted>
          }
        >
          <span>
            <span className="text-variable-ink">{name}</span> ={" "}
            <span className="text-muted-foreground">
              ?<span className="sr-only"> (belum diisi)</span>
            </span>
          </span>
        </ExpressionBox>
      );
    case "address":
      return (
        <ExpressionBox caption={`Address kotak ${name}, bukan Value-nya.`}>
          <span className="text-address-ink">&amp;{name}</span>
          <ExpressionArrow />
          <span className="sr-only">hasilnya</span>
          {address}
        </ExpressionBox>
      );
    case "input":
    case "store":
      return (
        <ExpressionBox
          caption={
            now.value === null ? (
              <Muted>Nunggu angka dari keyboard.</Muted>
            ) : (
              <>
                <span className="font-mono font-semibold text-memory-ink">
                  {now.value}
                </span>{" "}
                masuk ke Address {ADDRESS}.
              </>
            )
          }
        >
          {address}
          <ArrowLeft
            aria-hidden="true"
            className="size-6 shrink-0 text-muted-foreground"
          />
          <span className="sr-only">diisi</span>
          {now.value === null ? (
            <span className="text-muted-foreground">
              ?<span className="sr-only"> (nunggu input)</span>
            </span>
          ) : (
            <span className="text-memory-ink">{now.value}</span>
          )}
        </ExpressionBox>
      );
    case "print":
      return (
        <ExpressionBox caption="printf baca Value-nya langsung.">
          <span className="text-variable-ink">{name}</span>
          <ExpressionArrow />
          <span className="sr-only">hasilnya</span>
          <span className="text-memory-ink">{now.value}</span>
        </ExpressionBox>
      );
  }
}
