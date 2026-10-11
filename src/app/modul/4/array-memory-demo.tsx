"use client";

import { ArrowUp, ChevronDown } from "lucide-react";
import { useState } from "react";

import { AddressMath } from "@/components/address-math";
import { CodePanel } from "@/components/code-panel";
import { ArrayDiagram } from "@/components/memory-diagram";
import {
  DraftInput,
  EditorCard,
  EditorNotice,
  FieldRow,
  LengthSelect,
  NameInput,
  ValuesRow,
} from "@/components/program-editor";
import { Button, Narration, RoleChip } from "@/components/ui";
import { useSimulation } from "@/components/use-simulation";
import {
  ElementName,
  ExpressionArrow,
  ExpressionBox,
  Footnote,
  Hint,
  Muted,
  Output,
  PreviewNote,
  Workspace,
} from "@/components/workspace";
import { parseIndex } from "@/lib/array-indexing";
import {
  type ArrayMemoryProgram,
  type ArrayMemoryStep,
  EXAMPLE_PROGRAM,
  TAKEN_NAMES,
  editProgram,
  programLines,
  runSnapshots,
} from "@/lib/array-memory";
import { BASE_ADDRESS, INT_SIZE_BYTES, addressOf } from "@/lib/memory";

export function ArrayMemoryDemo() {
  const sim = useSimulation({
    example: EXAMPLE_PROGRAM,
    edit: editProgram,
    run: runSnapshots,
  });
  const { program, now, handleEdit } = sim;
  const { arrayName, values, index } = program;
  // How the picture is shown, not part of the run: stepping keeps it.
  const [showsBytes, setShowsBytes] = useState(false);

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
              value={values.length}
              onChange={(length) => handleEdit({ kind: "resize", length })}
            />
            <DraftInput
              label="Index yang diakses"
              value={index}
              format={String}
              parse={(raw) => parseIndex(raw, values.length)}
              onCommit={(next) => handleEdit({ kind: "select", index: next })}
              inputMode="numeric"
              className="w-32"
              inputClassName="text-index-ink"
            />
          </FieldRow>
          <EditorNotice notice={sim.notice} />
          <ValuesRow
            arrayName={arrayName}
            values={values}
            onCommit={(position, value) =>
              handleEdit({ kind: "value", index: position, value })
            }
          />
        </EditorCard>
      }
      code={
        <CodePanel
          lines={programLines(program, now.result !== null)}
          activeLine={now.line}
          activePart={now.part}
        />
      }
    >
      <Narration>
        <Explanation program={program} now={now} />
      </Narration>
      <div className="flex flex-col gap-2">
        <Hint>Klik kotaknya buat ganti Index.</Hint>
        <ArrayDiagram
          name={arrayName}
          values={values}
          isDeclared={now.isDeclared}
          chosenIndex={index}
          activeIndex={now.result === null ? null : index}
          addressIndex={now.address === null ? null : index}
          onSelect={(next) => handleEdit({ kind: "select", index: next })}
          showAddresses
        />
        <PreviewNote isShown={!now.isDeclared}>
          Preview array — deklarasi belum dijalankan.
        </PreviewNote>
      </div>
      <Expression program={program} now={now} />
      {now.address === null ? null : (
        <div className="flex flex-col items-center gap-3">
          <Button
            variant="ghost"
            aria-expanded={showsBytes}
            onClick={() => setShowsBytes((shown) => !shown)}
          >
            <ChevronDown
              aria-hidden="true"
              className={`transition-transform ${showsBytes ? "rotate-180" : ""}`}
            />
            {showsBytes ? "Tutup rincian byte" : "Liat 4 byte-nya"}
          </Button>
          {showsBytes ? (
            <ByteStrip
              access={`${arrayName}[${index}]`}
              address={now.address}
            />
          ) : null}
        </div>
      )}
      <Output pieces={now.terminal} freshFrom={sim.freshFrom} />
      <Footnote>
        Address di sini simulasi: mulai {BASE_ADDRESS}, tiap int{" "}
        {INT_SIZE_BYTES} byte. Address asli biasanya heksadesimal dan beda tiap
        program jalan.
      </Footnote>
    </Workspace>
  );
}

/** One sentence on why the current line does what it does. */
function Explanation({
  program,
  now,
}: {
  program: ArrayMemoryProgram;
  now: ArrayMemoryStep;
}) {
  const { arrayName, index } = program;
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
          Elemen array berjejer nempel di Memory, mulai dari{" "}
          <RoleChip role="address">Address {BASE_ADDRESS}</RoleChip>.
        </>
      );
    case "locate":
      return (
        <>
          <RoleChip role="index">Index {index}</RoleChip> itu posisi, bukan
          lokasi. Buat ambil{" "}
          <code>
            {arrayName}[{index}]
          </code>
          , Address-nya dihitung dulu dari Address awal.
        </>
      );
    case "print":
      return (
        <>
          Value di <RoleChip role="address">Address {now.address}</RoleChip>{" "}
          dibaca, terus printf nampilin ke Output.
        </>
      );
  }
}

/** What the current line works out: the spacing, the Address, the Value. */
function Expression({
  program,
  now,
}: {
  program: ArrayMemoryProgram;
  now: ArrayMemoryStep;
}) {
  const { arrayName, values, index } = program;
  switch (now.phase) {
    case "start":
      return (
        <ExpressionBox
          caption={<Muted>Address muncul setelah deklarasi.</Muted>}
        >
          <span className="text-muted-foreground">
            Address ?<span className="sr-only"> (belum ada)</span>
          </span>
        </ExpressionBox>
      );
    case "declare": {
      const shown = values.slice(0, 3).map((_, i) => addressOf(i));
      return (
        <ExpressionBox
          caption={`Tiap int ${INT_SIZE_BYTES} byte, jadi Address-nya naik ${INT_SIZE_BYTES}.`}
        >
          <span className="text-address-ink">
            {shown.join(", ")}
            {values.length > shown.length ? ", …" : ""}
          </span>
        </ExpressionBox>
      );
    }
    case "locate":
      return (
        <ExpressionBox
          caption={
            <>
              <code>
                {arrayName}[{index}]
              </code>{" "}
              ada di Address{" "}
              <span className="font-mono font-semibold text-address-ink">
                {now.address}
              </span>
              .
            </>
          }
        >
          <AddressMath
            start={BASE_ADDRESS}
            steps={index}
            startLabel="Address awal"
            stepsLabel="Index"
          />
        </ExpressionBox>
      );
    case "print":
      return (
        <ExpressionBox
          caption={
            <>
              Value di Address{" "}
              <span className="font-mono font-semibold text-address-ink">
                {now.address}
              </span>
              , ditampilin printf.
            </>
          }
        >
          <ElementName name={arrayName} index={index} />
          <ExpressionArrow />
          <span className="sr-only">hasilnya</span>
          <span className="text-memory-ink">{now.result}</span>
        </ExpressionBox>
      );
  }
}

/** One int fills four bytes, and its Address is the first byte's. */
function ByteStrip({ access, address }: { access: string; address: number }) {
  return (
    <figure className="flex w-full max-w-xs flex-col gap-1.5">
      <figcaption className="text-center text-sm text-muted-foreground">
        1 int = {INT_SIZE_BYTES} byte (di simulasi ini)
      </figcaption>
      <div className="rounded-xl border-2 border-foreground/20 bg-muted/60">
        <p className="border-b-2 border-foreground/10 py-1 text-center font-mono font-semibold wrap-anywhere">
          {access}
        </p>
        <ol className="grid grid-cols-4 divide-x-2 divide-foreground/10">
          {Array.from({ length: INT_SIZE_BYTES }, (_, byte) => (
            <li
              key={byte}
              className={`py-1.5 text-center font-mono text-sm text-address-ink ${byte === 0 ? "font-bold" : ""}`}
            >
              {address + byte}
            </li>
          ))}
        </ol>
      </div>
      <p className="flex items-center gap-1 text-xs font-semibold text-address-ink">
        <ArrowUp aria-hidden="true" className="size-3.5 shrink-0" />
        Address {access} = byte pertamanya
      </p>
    </figure>
  );
}
