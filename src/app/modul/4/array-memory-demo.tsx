"use client";

import { ArrowUp, ChevronDown } from "lucide-react";
import { useState } from "react";

import { AddressMath } from "@/components/address-math";
import { CodePanel } from "@/components/code-panel";
import {
  ArrayValuesField,
  DataEditor,
  NameField,
} from "@/components/data-editor";
import { ArrayDiagram } from "@/components/memory-diagram";
import { Button, Narration, RoleChip, Stage } from "@/components/ui";
import { type CodeLine, arrayDeclaration } from "@/lib/c-syntax";
import { BASE_ADDRESS, INT_SIZE_BYTES, addressOf } from "@/lib/memory";

const DEFAULT_NAME = "nilai";
const DEFAULT_VALUES: readonly number[] = [10, 20, 30, 40, 50];

export function ArrayMemoryDemo() {
  const [name, setName] = useState(DEFAULT_NAME);
  const [values, setValues] = useState(DEFAULT_VALUES);
  // Nothing is picked at first: the strip alone comes first, the arithmetic
  // only once the student asks for it by clicking a box.
  const [picked, setPicked] = useState<number | null>(null);
  const [showsBytes, setShowsBytes] = useState(false);

  const access = picked === null ? null : `${name}[${picked}]`;
  const lines: CodeLine[] = [
    arrayDeclaration(name, values.length, values),
    ...(picked === null
      ? []
      : [
          "",
          [
            'printf("%d", ',
            { text: name, role: "variable" },
            "[",
            { text: String(picked), role: "index" },
            "]);  // Address ",
            { text: String(addressOf(picked)), role: "address" },
          ] as const,
        ]),
  ];

  // Removing the picked element moves the pick to the new last element.
  function changeValues(next: readonly number[]) {
    setValues(next);
    setPicked((current) =>
      current === null ? null : Math.min(current, next.length - 1),
    );
  }
  function restoreExample() {
    setName(DEFAULT_NAME);
    setValues(DEFAULT_VALUES);
    setPicked(null);
    setShowsBytes(false);
  }

  return (
    <Stage
      code={<CodePanel lines={lines} activeLine={picked === null ? null : 2} />}
      editor={
        <DataEditor onRestore={restoreExample}>
          <NameField
            label="Nama array"
            value={name}
            taken={["printf"]}
            onCommit={setName}
          />
          <ArrayValuesField
            name={name}
            values={values}
            onChange={changeValues}
          />
        </DataEditor>
      }
      hint="Klik salah satu kotak buat liat Address-nya dihitung."
      visual={
        <>
          <ArrayDiagram
            name={name}
            values={values}
            activeIndex={picked}
            onSelect={setPicked}
            showAddresses
          />
          {picked === null || access === null ? null : (
            <div className="flex flex-col items-center gap-3">
              <AddressMath
                index={picked}
                baseCaption="Address awal"
                indexCaption="Index"
              />
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
                <ByteStrip access={access} address={addressOf(picked)} />
              ) : null}
            </div>
          )}
        </>
      }
      footnote={
        <>
          Address aslinya heksadesimal (kayak 0x7ffd5c2c) dan beda tiap program
          jalan. Di sini dibikin 1000-an biar gampang dihitung.
        </>
      }
      narration={
        <Narration>
          {picked === null ? (
            <>
              Tiap kotak punya Address sendiri: mulai dari{" "}
              <RoleChip role="address">{BASE_ADDRESS}</RoleChip>, terus nambah{" "}
              {INT_SIZE_BYTES}, soalnya 1 int = {INT_SIZE_BYTES} byte.
            </>
          ) : (
            <>
              <code>{access}</code>:{" "}
              <RoleChip role="index">Index {picked}</RoleChip> itu posisinya,{" "}
              <RoleChip role="address">Address {addressOf(picked)}</RoleChip>{" "}
              itu lokasinya di Memory. Beda, ya!
            </>
          )}
        </Narration>
      }
    />
  );
}

/** One int fills four bytes, and its Address is the first byte's. */
function ByteStrip({ access, address }: { access: string; address: number }) {
  return (
    <figure className="flex w-full max-w-xs flex-col gap-1.5">
      <figcaption className="text-center text-sm text-muted-foreground">
        1 int = {INT_SIZE_BYTES} byte
      </figcaption>
      <div className="rounded-xl border-2 border-memory">
        <p className="border-b-2 border-memory/40 py-1 text-center font-mono font-semibold wrap-anywhere">
          {access}
        </p>
        <ol className="grid grid-cols-4 divide-x-2 divide-memory/40">
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
