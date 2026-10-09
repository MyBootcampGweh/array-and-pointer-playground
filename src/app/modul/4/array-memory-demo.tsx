"use client";

import { ArrowUp, Info } from "lucide-react";
import { type ReactNode, useState } from "react";

import { CodePanel } from "@/components/code-panel";
import {
  ArrayValuesField,
  DataEditor,
  NameField,
} from "@/components/data-editor";
import { ArrayView } from "@/components/memory-cell";
import { Narration, Panel, RoleChip, Stage } from "@/components/ui";
import { BASE_ADDRESS, INT_SIZE_BYTES, addressOf } from "@/lib/memory";

const DEFAULT_NAME = "nilai";
const DEFAULT_VALUES: readonly number[] = [10, 20, 30, 40, 50];
const DEFAULT_INDEX = 2;

export function ArrayMemoryDemo() {
  const [name, setName] = useState(DEFAULT_NAME);
  const [values, setValues] = useState(DEFAULT_VALUES);
  const [index, setIndex] = useState(DEFAULT_INDEX);

  const access = `${name}[${index}]`;
  const address = addressOf(index);
  const lines = [
    `int ${name}[${values.length}] = {${values.join(", ")}};`,
    "",
    `printf("%d", ${access});  // alamat: ${address}`,
  ];

  // This module only shows real elements, so removing the picked one moves
  // the pick to the new last element.
  function changeValues(next: readonly number[]) {
    setValues(next);
    setIndex((current) => Math.min(current, next.length - 1));
  }
  function restoreExample() {
    setName(DEFAULT_NAME);
    setValues(DEFAULT_VALUES);
    setIndex(DEFAULT_INDEX);
  }

  return (
    <Stage
      code={<CodePanel lines={lines} activeLine={2} activePart={access} />}
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
      visual={
        <Panel title="Klik kotaknya">
          <div className="flex flex-col gap-5">
            <ArrayView
              name={name}
              values={values}
              activeIndex={index}
              activeLabel="dipilih"
              onSelect={setIndex}
              showAddresses
            />
            <AddressMath access={access} index={index} />
            <ByteStrip access={access} address={address} />
            <p className="flex gap-2 text-sm text-muted-foreground">
              <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
              Alamat aslinya heksadesimal (kayak 0x7ffd5c2c) dan beda tiap
              program jalan. Di sini dibikin 1000-an biar gampang dihitung.
            </p>
          </div>
        </Panel>
      }
      narration={
        <Narration>
          <code>{access}</code>:{" "}
          <RoleChip role="index">indeks {index}</RoleChip> itu posisinya,{" "}
          <RoleChip role="address">alamat {address}</RoleChip> itu lokasinya di
          memori. Beda, ya!
        </Narration>
      }
    />
  );
}

/** `start + index × size = address`, each term above its role word. */
function AddressMath({ access, index }: { access: string; index: number }) {
  return (
    // On the card, not a muted fill: amber text on grey misses AA.
    <div className="rounded-xl border p-4">
      <p className="text-sm font-medium text-muted-foreground">
        Alamat <code>{access}</code>
      </p>
      <p className="mt-2 flex flex-wrap items-start gap-x-3 gap-y-2 font-mono text-xl font-semibold sm:text-2xl">
        <Term label="alamat awal" className="text-address">
          {BASE_ADDRESS}
        </Term>
        <Operator>+</Operator>
        <Term label="indeks" className="text-index">
          {index}
        </Term>
        <Operator>×</Operator>
        <Term label="byte">{INT_SIZE_BYTES}</Term>
        <Operator>=</Operator>
        <Term label="alamatnya" className="text-address">
          {addressOf(index)}
        </Term>
      </p>
    </div>
  );
}

function Term({
  label,
  className = "",
  children,
}: {
  label: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span className="flex flex-col items-center">
      <span className={className}>{children}</span>
      <span className="font-sans text-xs font-medium text-muted-foreground">
        {label}
      </span>
    </span>
  );
}

function Operator({ children }: { children: ReactNode }) {
  return <span className="text-muted-foreground">{children}</span>;
}

/** One int fills four bytes, and its address is the first byte's. */
function ByteStrip({ access, address }: { access: string; address: number }) {
  return (
    <figure className="flex flex-col gap-1.5">
      <figcaption className="text-sm font-medium text-muted-foreground">
        1 int = {INT_SIZE_BYTES} byte
      </figcaption>
      <div className="rounded-xl border-2 border-active">
        <p className="border-b-2 border-active/30 py-1 text-center font-mono font-semibold text-active">
          {access}
        </p>
        <ol className="grid grid-cols-4 divide-x-2 divide-active/30">
          {Array.from({ length: INT_SIZE_BYTES }, (_, byte) => (
            <li
              key={byte}
              className={`py-1.5 text-center font-mono text-sm text-address ${byte === 0 ? "font-bold" : ""}`}
            >
              {address + byte}
            </li>
          ))}
        </ol>
      </div>
      <p className="flex items-center gap-1 text-xs font-semibold text-address">
        <ArrowUp aria-hidden="true" className="size-3.5" />
        alamat {access} = byte pertamanya
      </p>
    </figure>
  );
}
