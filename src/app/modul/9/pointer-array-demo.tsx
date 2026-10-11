"use client";

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
import { Narration, RoleChip } from "@/components/ui";
import { useSimulation } from "@/components/use-simulation";
import {
  ElementName,
  ExpressionArrow,
  ExpressionBox,
  Footnote,
  Muted,
  Output,
  PreviewNote,
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
            <NameInput
              label="Nama array"
              value={arrayName}
              taken={takenNames(program, "arrayName")}
              onCommit={(name) =>
                handleEdit({ kind: "rename", target: "arrayName", name })
              }
            />
            <NameInput
              label="Nama Pointer"
              value={pointer}
              taken={takenNames(program, "pointer")}
              onCommit={(name) =>
                handleEdit({ kind: "rename", target: "pointer", name })
              }
            />
          </FieldRow>
          <FieldRow>
            <LengthSelect
              value={values.length}
              min={MIN_LENGTH}
              onChange={(length) => handleEdit({ kind: "resize", length })}
            />
            <DraftInput
              label={`k di *(${pointer} + k)`}
              value={offset}
              format={String}
              parse={(raw) => parseOffset(raw, values.length, pointer)}
              onCommit={(next) => handleEdit({ kind: "offset", offset: next })}
              inputMode="numeric"
              className="w-40"
              inputClassName="text-index-ink"
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
            {
              kind: "label",
              role: "address",
              column: now.probe ?? pointerAt,
              label: `${pointer} + ${offset}`,
              isHidden: now.probe === null,
            },
          ]}
        />
        <PreviewNote isShown={!now.isDeclared}>
          Preview array — deklarasi belum dijalankan.
        </PreviewNote>
      </div>
      <Expression program={program} now={now} />
      <Output pieces={now.terminal} freshFrom={sim.freshFrom} />
      <Footnote>
        Address di sini simulasi: mulai {BASE_ADDRESS}, tiap int{" "}
        {INT_SIZE_BYTES} byte, jadi <code>{pointer} + 1</code> loncat{" "}
        {INT_SIZE_BYTES} byte. Kalau int-nya beda ukuran, loncatnya ikut beda.
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
          Program masuk ke <code>main()</code>. Deklarasi array belum
          dijalankan.
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
          Di sini <code>{arrayName}</code> otomatis dipakai sebagai Address
          elemen pertamanya, jadi <RoleChip role="pointer">{pointer}</RoleChip>{" "}
          nyimpen <RoleChip role="address">{BASE_ADDRESS}</RoleChip>; array-nya
          sendiri tetep array, bukan Pointer.
        </>
      );
    case "index":
      return (
        <>
          <code>
            {arrayName}[{offset}]
          </code>{" "}
          baca elemen <RoleChip role="index">Index {offset}</RoleChip> langsung
          dari array.
        </>
      );
    case "deref":
      return (
        <>
          <RoleChip role="pointer">
            {pointer} + {offset}
          </RoleChip>{" "}
          maju {offset} elemen ({offset * INT_SIZE_BYTES} byte), bukan {offset}{" "}
          byte, jadi hasilnya sama kayak{" "}
          <code>
            {arrayName}[{offset}]
          </code>{" "}
          selama {pointer} di elemen pertama.
        </>
      );
    case "increment":
      return (
        <>
          <code>{pointer}++</code> mindahin{" "}
          <RoleChip role="pointer">{pointer}</RoleChip> sendiri 1 elemen: isinya
          jadi <RoleChip role="address">{addressOf(1)}</RoleChip>.
        </>
      );
    case "deref-moved":
      return (
        <>
          {pointer} udah di elemen kedua, jadi{" "}
          <code>
            *({pointer} + {offset})
          </code>{" "}
          sekarang baca <RoleChip role="index">Index {offset + 1}</RoleChip>,
          bukan Index {offset} lagi.
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
  const deref = (
    <code>
      *({pointer} + {offset})
    </code>
  );
  switch (now.phase) {
    case "start":
      return (
        <ExpressionBox caption={<Muted>Pointer-nya belum ada.</Muted>}>
          <span className="text-muted-foreground">
            {pointer} = ?<span className="sr-only"> (belum ada)</span>
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
        <ExpressionBox caption="Langsung dari array, lewat Index.">
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
                {deref} = <code>{`${arrayName}[${offset}]`}</code>, soalnya{" "}
                {pointer} masih di elemen pertama.
              </>
            ) : (
              <>
                Sekarang {deref} = <code>{`${arrayName}[${offset + 1}]`}</code>,
                bukan <code>{`${arrayName}[${offset}]`}</code>.
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
              Sekarang <code>{pointer}</code> nyimpen {addressOf(1)}.
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
