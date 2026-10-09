"use client";

import { ArrowRight, TriangleAlert } from "lucide-react";
import { useState } from "react";

import { CodePanel } from "@/components/code-panel";
import {
  ArrayValuesField,
  DataEditor,
  IndexInput,
  NameField,
} from "@/components/data-editor";
import { ArrayDiagram } from "@/components/memory-diagram";
import { ExpressionBar, Narration, RoleChip, Stage } from "@/components/ui";
import { type CodeLine, arrayDeclaration } from "@/lib/c-syntax";
import { readElement } from "@/lib/memory";

const DEFAULT_NAME = "nilai";
const DEFAULT_VALUES: readonly number[] = [10, 20, 30, 40, 50];
const DEFAULT_INDEX = 2;

export function ArrayIndexingDemo() {
  const [name, setName] = useState(DEFAULT_NAME);
  const [values, setValues] = useState(DEFAULT_VALUES);
  const [index, setIndex] = useState(DEFAULT_INDEX);

  const read = readElement(values, index);
  const validRange = values.length === 1 ? "0" : `0–${values.length - 1}`;
  const lines: CodeLine[] = [
    arrayDeclaration(name, values.length, values),
    "",
    [
      'printf("%d", ',
      { text: name, role: "variable" },
      "[",
      { text: String(index), role: "index" },
      "]);",
    ],
  ];

  function restoreExample() {
    setName(DEFAULT_NAME);
    setValues(DEFAULT_VALUES);
    setIndex(DEFAULT_INDEX);
  }

  return (
    <Stage
      code={<CodePanel lines={lines} activeLine={2} />}
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
      hint={
        <>
          Klik kotaknya, atau ketik Index di dalam <code>[ ]</code>.
        </>
      }
      visual={
        <>
          <ArrayDiagram
            name={name}
            values={values}
            activeIndex={read.kind === "ok" ? index : null}
            outside={
              read.kind === "out-of-bounds" ? { index, tone: "danger" } : null
            }
            onSelect={setIndex}
          />
          <ExpressionBar>
            <span className="min-w-0 wrap-anywhere text-variable-ink">
              {name}
            </span>
            <IndexInput
              label={`Index buat ${name}`}
              value={index}
              onCommit={setIndex}
            />
            <ArrowRight
              aria-hidden="true"
              className="mx-1 size-5 text-muted-foreground"
            />
            <span className="sr-only">hasilnya</span>
            {read.kind === "ok" ? (
              <span className="text-memory-ink">{read.value}</span>
            ) : (
              <span className="flex items-center gap-1 text-destructive">
                <TriangleAlert aria-hidden="true" className="size-5" />?
                <span className="sr-only"> (di luar array)</span>
              </span>
            )}
          </ExpressionBar>
        </>
      }
      narration={
        read.kind === "ok" ? (
          <Narration>
            <RoleChip role="index">Index {index}</RoleChip> itu kotak ke-
            {index + 1}, soalnya ngitungnya mulai dari 0.
          </Narration>
        ) : (
          <Narration isWarning>
            <strong>
              <RoleChip role="variable">{name}</RoleChip>[{index}] di luar
              array!
            </strong>{" "}
            Index yang ada cuma {validRange}; C nggak ngelarang, tapi hasilnya
            bisa ngaco atau crash: <em>undefined behavior</em>.
          </Narration>
        )
      }
    />
  );
}
