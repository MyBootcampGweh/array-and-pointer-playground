"use client";

import { ArrowRight } from "lucide-react";
import { useState } from "react";

import { CodePanel } from "@/components/code-panel";
import {
  ArrayValuesField,
  DataEditor,
  IntField,
  NameField,
} from "@/components/data-editor";
import { ArrayView } from "@/components/memory-cell";
import { Narration, Panel, RoleChip, Stage } from "@/components/ui";
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
  const validRange = values.length === 1 ? "0" : `0–${values.length - 1}`;
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
        <Panel title="Klik kotaknya">
          <ArrayView
            name={name}
            values={values}
            activeIndex={read.kind === "ok" ? index : null}
            activeLabel="diakses"
            outOfBoundsIndex={read.kind === "out-of-bounds" ? index : null}
            onSelect={setIndex}
          />
          <div className="mt-4 grid items-end gap-4 sm:grid-cols-2">
            <IntField label="Indeks" value={index} onCommit={setIndex} />
            <p className="flex min-h-11 flex-wrap items-center gap-2 font-mono text-xl font-semibold sm:text-2xl">
              <span>{access}</span>
              <ArrowRight
                aria-hidden="true"
                className="size-5 text-muted-foreground"
              />
              <span className="sr-only">hasilnya</span>
              {read.kind === "ok" ? (
                <span className="text-value">{read.value}</span>
              ) : (
                <span className="text-destructive">?</span>
              )}
            </p>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Coba juga indeks {values.length} atau -1.
          </p>
        </Panel>
      }
      narration={
        read.kind === "ok" ? (
          <Narration>
            <code>{access}</code> = kotak di{" "}
            <RoleChip role="index">indeks {index}</RoleChip>, alias kotak ke-
            {index + 1}. Isinya{" "}
            <RoleChip role="value">nilai {read.value}</RoleChip>.
          </Narration>
        ) : (
          <Narration isWarning>
            <strong>{access} di luar array!</strong> Indeks yang ada cuma{" "}
            {validRange}. C nggak bakal ngelarang, tapi hasilnya bisa ngaco atau
            programnya crash. Namanya <em>undefined behavior</em>.
          </Narration>
        )
      }
    />
  );
}
