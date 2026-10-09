"use client";

import { useState } from "react";

import { CodePanel } from "@/components/code-panel";
import {
  ArrayValuesField,
  DataEditor,
  IntField,
  NameField,
} from "@/components/data-editor";
import { ArrayView } from "@/components/memory-cell";
import { Callout, Narration, Panel, RoleChip, Stage } from "@/components/ui";
import { readElement } from "@/lib/memory";

const DEFAULT_NAME = "nilai";
const DEFAULT_VALUES: readonly number[] = [10, 20, 30, 40, 50];
const DEFAULT_INDEX = 2;

export function ArrayIndexingDemo() {
  const [name, setName] = useState(DEFAULT_NAME);
  const [values, setValues] = useState(DEFAULT_VALUES);
  const [index, setIndex] = useState(DEFAULT_INDEX);

  const read = readElement(values, index);
  const access = `${name}[${index}]`;
  const lines = [
    `int ${name}[${values.length}] = {${values.join(", ")}};`,
    "",
    `printf("%d", ${access});`,
  ];

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
          <ArrayValuesField name={name} values={values} onChange={setValues} />
        </DataEditor>
      }
      visual={
        <Panel title="Array (klik kotaknya)">
          <ArrayView
            name={name}
            values={values}
            activeIndex={read.kind === "ok" ? index : null}
            activeLabel="diakses"
            onSelect={setIndex}
          />
          <div className="mt-4 grid items-end gap-4 sm:grid-cols-2">
            <IntField
              label="Indeks yang diakses"
              value={index}
              onCommit={setIndex}
            />
            <p className="flex min-h-11 flex-wrap items-center gap-2 font-mono text-xl font-semibold sm:text-2xl">
              <span>{access}</span>
              <span aria-hidden="true">→</span>
              <span className="sr-only">hasilnya</span>
              {read.kind === "ok" ? (
                <span className="text-value">{read.value}</span>
              ) : (
                <span className="text-destructive">?</span>
              )}
            </p>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Coba ketik indeks {values.length} atau -1, lalu lihat apa yang
            terjadi.
          </p>
          <div className="mt-4">
            {read.kind === "out-of-bounds" ? (
              <Callout
                tone="danger"
                title={`⚠ ${access} di luar batas!`}
                isAlert
              >
                Array <code className="font-mono">{name}</code> hanya punya
                indeks 0 sampai {values.length - 1}. Bahasa C tidak akan
                menghentikanmu: program bisa membaca memori milik data lain,
                memberi angka acak, atau crash. Ini disebut{" "}
                <em>undefined behavior</em>. Jangan pernah dilakukan di program
                sungguhan.
              </Callout>
            ) : (
              <Callout title="Indeks ≠ nilai">
                Indeks selalu 0, 1, 2, … sesuai posisi kotak. Nilai adalah isi
                kotak dan bebas kamu ganti lewat ✎ Ubah nama &amp; nilai;
                indeksnya tidak ikut berubah.
              </Callout>
            )}
          </div>
        </Panel>
      }
      narration={
        <Narration>
          {read.kind === "ok" ? (
            <>
              <code className="font-mono">{access}</code> artinya “buka kotak di
              posisi <RoleChip role="index">indeks {index}</RoleChip>”. Karena
              hitungan dimulai dari 0, itu kotak ke-{index + 1}, dan isinya{" "}
              <RoleChip role="value">nilai {read.value}</RoleChip>.
            </>
          ) : (
            <>
              <code className="font-mono">{access}</code> meminta posisi {index}
              , padahal posisi yang sah hanya 0 sampai {values.length - 1}.
              Hasilnya tidak bisa dipercaya, jadi di sini ditampilkan sebagai
              “?”.
            </>
          )}
        </Narration>
      }
    />
  );
}
