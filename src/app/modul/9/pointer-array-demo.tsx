"use client";

import { ChevronRight } from "lucide-react";

import { AddressMath } from "@/components/address-math";
import { CodePanel } from "@/components/code-panel";
import { ArrayDiagram } from "@/components/memory-diagram";
import {
  DraftInput,
  EditorCard,
  EditorNotice,
  FieldPair,
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
  ExpressionBox,
  Footnote,
  Muted,
  Output,
  Workspace,
} from "@/components/workspace";
import { BASE_ADDRESS, INT_SIZE_BYTES, addressOf } from "@/lib/memory";
import {
  EXAMPLE_PROGRAM,
  MIN_LENGTH,
  type PointerArrayProgram,
  type PointerArrayStep,
  editProgram,
  parseOffset,
  programLines,
  runSnapshots,
  takenNames,
} from "@/lib/pointer-array";

export function PointerArrayDemo() {
  const sim = useSimulation({
    example: EXAMPLE_PROGRAM,
    edit: editProgram,
    run: runSnapshots,
  });
  const { program, now, handleEdit } = sim;
  const { arrayName, pointer, values, offset } = program;
  const pointerAt = now.pointerAt ?? 0;

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
            <FieldPair>
              <NameInput
                label="Nama array"
                value={arrayName}
                taken={takenNames(program, "arrayName")}
                onCommit={(name) =>
                  handleEdit({ kind: "rename", target: "arrayName", name })
                }
                className="flex-1 basis-28"
              />
              <LengthSelect
                value={values.length}
                min={MIN_LENGTH}
                onChange={(length) => handleEdit({ kind: "resize", length })}
              />
            </FieldPair>
            <NameInput
              label="Nama Pointer"
              value={pointer}
              taken={takenNames(program, "pointer")}
              onCommit={(name) =>
                handleEdit({ kind: "rename", target: "pointer", name })
              }
              className="flex-1 basis-36"
            />
          </FieldRow>
          <EditorNotice notice={sim.notice} />
          <ValuesRow
            arrayName={arrayName}
            values={values}
            onCommit={(index, value) =>
              handleEdit({ kind: "value", index, value })
            }
          />
          {/* Optional, so the first look has one thing less to read; closed,
              it keeps a half-typed k. */}
          <details className="group">
            {/* Safari draws its own marker unless told not to. */}
            <summary className="flex min-h-11 w-fit cursor-pointer list-none items-center gap-1.5 rounded-lg text-sm text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 [&::-webkit-details-marker]:hidden">
              <ChevronRight
                aria-hidden="true"
                className="size-4 transition-transform group-open:rotate-90"
              />
              Opsional: ganti k (sekarang {offset})
            </summary>
            <div className="flex flex-wrap items-end gap-3 pt-1">
              <DraftInput
                label={`k di *(${pointer} + k)`}
                value={offset}
                format={String}
                parse={(raw) => parseOffset(raw, values.length, pointer)}
                onCommit={(next) =>
                  handleEdit({ kind: "offset", offset: next })
                }
                inputMode="numeric"
                className="w-32"
                inputClassName="text-index-ink"
              />
            </div>
          </details>
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
      <ArrayDiagram
        name={arrayName}
        values={values}
        isDeclared={now.isDeclared}
        activeIndex={now.readIndex}
        addressIndex={
          now.probe ??
          (now.phase === "point" || now.phase === "increment"
            ? now.pointerAt
            : now.readIndex)
        }
        showAddresses
        marks={[
          {
            kind: "pointer",
            column: pointerAt,
            name: pointer,
            value: addressOf(pointerAt),
            isActive: now.phase === "point" || now.phase === "increment",
            isHidden: now.pointerAt === null,
          },
        ]}
        alias={{
          column: now.probe ?? pointerAt,
          label: `*(${pointer} + ${offset})`,
          isHidden: now.probe === null,
        }}
        note={now.isDeclared ? null : "Deklarasi belum dijalankan."}
      />
      <Expression program={program} now={now} />
      <Output pieces={now.terminal} freshFrom={sim.freshFrom} />
      <Footnote>
        Address cuma ilustrasi; kalau ukuran int beda,{" "}
        <code>{pointer} + 1</code> loncatnya ikut beda.
      </Footnote>
    </Workspace>
  );
}

/** One sentence on why the current line does what it does. */
function Explanation({
  program,
  now,
}: {
  program: PointerArrayProgram;
  now: PointerArrayStep;
}) {
  const { arrayName, pointer, offset } = program;
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
          Array <RoleChip role="variable">{arrayName}</RoleChip> berjejer di
          Memory mulai{" "}
          <RoleChip role="address">Address {BASE_ADDRESS}</RoleChip>.
        </>
      );
    case "point":
      return (
        <>
          <RoleChip role="pointer">{pointer}</RoleChip> mulai di elemen pertama;{" "}
          <code>{arrayName}</code> sendiri tetep array, bukan Pointer.
        </>
      );
    case "index":
      return (
        <>
          <code>
            {arrayName}[{offset}]
          </code>{" "}
          baca <RoleChip role="index">Index {offset}</RoleChip> langsung dari
          array.
        </>
      );
    case "deref":
      return (
        <>
          <code>
            {pointer} + {offset}
          </code>{" "}
          cuma ngitung Address {offset} elemen setelah{" "}
          <RoleChip role="pointer">{pointer}</RoleChip>; {pointer} sendiri nggak
          pindah.
        </>
      );
    case "increment":
      return (
        <>
          Beda sama <code>{pointer} + 1</code>, <code>{pointer}++</code> ngubah
          isi <RoleChip role="pointer">{pointer}</RoleChip> sendiri.
        </>
      );
    case "deref-moved":
      return (
        <>
          Ekspresinya sama, tapi dihitung dari posisi{" "}
          <RoleChip role="pointer">{pointer}</RoleChip> yang baru.
        </>
      );
  }
}

/** What the current line works out: the spacing, the Address, the Value. */
function Expression({
  program,
  now,
}: {
  program: PointerArrayProgram;
  now: PointerArrayStep;
}) {
  const { arrayName, pointer, values, offset } = program;
  const deref = `*(${pointer} + ${offset})`;
  switch (now.phase) {
    case "start":
      return (
        <ExpressionBox
          caption={<Muted>Deklarasi Pointer belum dijalankan.</Muted>}
        >
          <span className="text-muted-foreground">{pointer}</span>
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
    case "point":
      return (
        <ExpressionBox
          caption={
            <>
              <code>{arrayName}</code> di sini sama kayak{" "}
              <code>&amp;{arrayName}[0]</code>.
            </>
          }
        >
          <span>
            <span className="text-pointer-ink">{pointer}</span> ={" "}
            <span className="text-variable-ink">{arrayName}</span>
          </span>
          <ExpressionArrow />
          <span className="sr-only">isinya</span>
          <span className="text-address-ink">{BASE_ADDRESS}</span>
        </ExpressionBox>
      );
    case "index":
      return (
        <ExpressionBox
          caption={
            <>
              Habis ini, <code>{deref}</code> baca elemen yang sama.
            </>
          }
        >
          <ElementName name={arrayName} index={offset} />
          <ExpressionArrow />
          <span className="sr-only">hasilnya</span>
          <span className="text-memory-ink">{values[offset]}</span>
        </ExpressionBox>
      );
    case "deref":
    case "deref-moved":
      return (
        <ExpressionBox
          caption={
            now.phase === "deref" ? (
              <>
                <code>{deref}</code> = <code>{`${arrayName}[${offset}]`}</code>,
                selama {pointer} masih di elemen pertama.
              </>
            ) : (
              <>
                Sekarang <code>{deref}</code> ={" "}
                <code>{`${arrayName}[${offset + 1}]`}</code>, bukan{" "}
                <code>{`${arrayName}[${offset}]`}</code>.
              </>
            )
          }
        >
          <AddressMath
            start={addressOf(now.pointerAt ?? 0)}
            steps={offset}
            startLabel={`isi ${pointer}`}
            stepsLabel="k"
            value={values[now.readIndex ?? 0]}
          />
        </ExpressionBox>
      );
    case "increment":
      return (
        <ExpressionBox
          caption={
            <>
              Sekarang <code>{pointer}</code> nunjuk ke elemen [1].
            </>
          }
        >
          <AddressMath
            start={BASE_ADDRESS}
            steps={1}
            startLabel={`isi ${pointer}`}
            stepsLabel="elemen"
          />
        </ExpressionBox>
      );
  }
}
