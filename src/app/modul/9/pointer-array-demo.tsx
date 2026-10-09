"use client";

import { Minus, Plus } from "lucide-react";
import { useState } from "react";

import { AddressMath } from "@/components/address-math";
import { CodePanel } from "@/components/code-panel";
import {
  ArrayValuesField,
  DataEditor,
  NameField,
} from "@/components/data-editor";
import { ArrayDiagram, type Mark } from "@/components/memory-diagram";
import { ExpressionBar, Narration, RoleChip, Stage } from "@/components/ui";
import { type CodeLine, arrayDeclaration } from "@/lib/c-syntax";
import { BASE_ADDRESS, addressOf, clamp } from "@/lib/memory";

const DEFAULT_NAME = "nilai";
const DEFAULT_POINTER = "ptr";
const DEFAULT_VALUES: readonly number[] = [10, 20, 30, 40, 50];
const DEFAULT_OFFSET = 1;
const SNIPPET_NAMES = ["printf"];

export function PointerArrayDemo() {
  const [name, setName] = useState(DEFAULT_NAME);
  const [pointer, setPointer] = useState(DEFAULT_POINTER);
  const [values, setValues] = useState(DEFAULT_VALUES);
  // The k in `ptr + k`. Clamped to the array, so the pointer can never be
  // moved past either end: there is nothing safe to show out there.
  const [offset, setOffset] = useState(DEFAULT_OFFSET);

  const last = values.length - 1;
  const moved = `${pointer} + ${offset}`;
  const value = values[offset] ?? null;
  const lines: CodeLine[] = [
    arrayDeclaration(name, values.length, values),
    [
      "int *",
      { text: pointer, role: "pointer" },
      " = ",
      { text: name, role: "variable" },
      ";",
    ],
    "",
    [
      'printf("%d", *(',
      { text: pointer, role: "pointer" },
      " + ",
      { text: String(offset), role: "index" },
      "));",
    ],
  ];
  // One box: `ptr + k` and the Address it gives. `ptr` itself (1000) is in
  // the code and the formula; a second box would crowd a phone-width strip.
  const marks: Mark[] = [
    {
      kind: "pointer",
      column: offset,
      name: offset === 0 ? pointer : moved,
      value: addressOf(offset),
      isActive: true,
    },
  ];

  function move(by: number) {
    setOffset((current) => clamp(current + by, 0, last));
  }
  function changeValues(next: readonly number[]) {
    setValues(next);
    setOffset((current) => Math.min(current, next.length - 1));
  }
  function restoreExample() {
    setName(DEFAULT_NAME);
    setPointer(DEFAULT_POINTER);
    setValues(DEFAULT_VALUES);
    setOffset(DEFAULT_OFFSET);
  }

  const stepButton =
    "flex size-11 items-center justify-center rounded-lg bg-card ring-1 ring-border transition-colors hover:bg-background aria-disabled:cursor-not-allowed aria-disabled:opacity-50 [&_svg]:size-5";

  return (
    <Stage
      code={
        <CodePanel lines={lines} activeLine={3} activePart={`*(${moved})`} />
      }
      editor={
        <DataEditor onRestore={restoreExample}>
          <div className="grid gap-4 sm:grid-cols-2">
            <NameField
              label="Nama array"
              value={name}
              taken={[pointer, ...SNIPPET_NAMES]}
              onCommit={setName}
            />
            <NameField
              label="Nama Pointer"
              value={pointer}
              taken={[name, ...SNIPPET_NAMES]}
              onCommit={setPointer}
            />
          </div>
          <ArrayValuesField
            name={name}
            values={values}
            onChange={changeValues}
          />
        </DataEditor>
      }
      hint={
        <>Geser Pointer-nya pakai tombol − / + di kode, atau klik kotaknya.</>
      }
      visual={
        <>
          <ArrayDiagram
            name={name}
            values={values}
            activeIndex={offset}
            onSelect={setOffset}
            showAddresses
            marks={marks}
          />
          {/* Two halves that each stay on one line: on a phone the
              expression breaks at `=`, never inside `*( … )`. */}
          <ExpressionBar>
            <span className="flex min-w-0 items-center gap-1.5">
              <span>*(</span>
              <span className="min-w-0 wrap-anywhere text-pointer-ink">
                {pointer}
              </span>
              <span>+</span>
              <button
                type="button"
                onClick={() => move(-1)}
                aria-disabled={offset === 0}
                className={stepButton}
              >
                <Minus aria-hidden="true" />
                <span className="sr-only">Mundur</span>
              </button>
              <span className="min-w-5 text-center text-index-ink">
                {offset}
              </span>
              <button
                type="button"
                onClick={() => move(1)}
                aria-disabled={offset === last}
                className={stepButton}
              >
                <Plus aria-hidden="true" />
                <span className="sr-only">Maju</span>
              </button>
              <span>)</span>
            </span>
            <span className="flex min-w-0 items-center gap-1.5">
              <span className="text-muted-foreground">=</span>
              <span className="min-w-0 wrap-anywhere">
                <span className="text-variable-ink">{name}</span>[
                <span className="text-index-ink">{offset}</span>]
              </span>
              <span className="text-muted-foreground">=</span>
              <span className="text-memory-ink">{value}</span>
            </span>
          </ExpressionBar>
          <AddressMath
            index={offset}
            baseCaption={`isi ${pointer}`}
            indexCaption="elemen"
          />
        </>
      }
      narration={
        <Narration>
          {offset === 0 ? (
            <>
              <code>
                {pointer} = {name}
              </code>
              : nama array itu Address elemen pertamanya, jadi{" "}
              <RoleChip role="pointer">{pointer}</RoleChip> nyimpen{" "}
              <RoleChip role="address">{BASE_ADDRESS}</RoleChip>.
            </>
          ) : (
            <>
              <RoleChip role="pointer">{moved}</RoleChip> maju {offset} elemen,
              bukan {offset} byte:{" "}
              <RoleChip role="address">Address {addressOf(offset)}</RoleChip>.
            </>
          )}{" "}
          Value di situ <RoleChip role="value">{value}</RoleChip>, sama kayak{" "}
          <code>{`${name}[${offset}]`}</code>.
          {offset === last ? (
            <>
              {" "}
              Ini elemen terakhir: <code>{`*(${pointer} + ${last + 1})`}</code>{" "}
              udah di luar array (undefined behavior), makanya Maju dikunci.
            </>
          ) : null}
        </Narration>
      }
    />
  );
}
