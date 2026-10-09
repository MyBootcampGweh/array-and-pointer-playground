"use client";

import { useState } from "react";

import { CodePanel } from "@/components/code-panel";
import { DataEditor, IntField, NameField } from "@/components/data-editor";
import { VariableDiagram } from "@/components/memory-diagram";
import { ExpressionBar, Narration, RoleChip, Stage } from "@/components/ui";
import { type CodeLine } from "@/lib/c-syntax";
import { addressOf } from "@/lib/memory";

type Target = "a" | "b";
const TARGETS: readonly Target[] = ["a", "b"];

const DEFAULT_NAMES = { a: "angkaA", b: "angkaB", pointer: "ptr" };
const DEFAULT_VALUES: Record<Target, number> = { a: 10, b: 25 };

/** Two ints declared one after the other, 4 bytes apart (illustrative). */
const ADDRESSES: Record<Target, number> = { a: addressOf(0), b: addressOf(1) };

export function PointerTargetDemo() {
  const [names, setNames] = useState(DEFAULT_NAMES);
  const [values, setValues] = useState(DEFAULT_VALUES);
  const [target, setTarget] = useState<Target>("a");

  const { pointer } = names;
  const lines: CodeLine[] = [
    ...TARGETS.map((key): CodeLine => [
      "int ",
      { text: names[key], role: "variable" },
      " = ",
      { text: String(values[key]), role: "value" },
      ";",
    ]),
    [
      "int *",
      { text: pointer, role: "pointer" },
      " = ",
      { text: `&${names.a}`, role: "address" },
      ";",
    ],
    // Redirecting adds one line; pointing back at A is the original program.
    ...(target === "b"
      ? [
          [
            { text: pointer, role: "pointer" },
            " = ",
            { text: `&${names.b}`, role: "address" },
            ";",
          ] as const,
        ]
      : []),
  ];

  function rename(key: keyof typeof DEFAULT_NAMES, next: string) {
    setNames((current) => ({ ...current, [key]: next }));
  }
  function restoreExample() {
    setNames(DEFAULT_NAMES);
    setValues(DEFAULT_VALUES);
    setTarget("a");
  }

  return (
    <Stage
      code={<CodePanel lines={lines} activeLine={lines.length - 1} />}
      editor={
        <DataEditor onRestore={restoreExample}>
          <div className="grid gap-4 sm:grid-cols-2">
            {TARGETS.map((key) => (
              <NameField
                key={key}
                label={`Nama Variable ${key.toUpperCase()}`}
                value={names[key]}
                taken={[names[key === "a" ? "b" : "a"], pointer]}
                onCommit={(next) => rename(key, next)}
              />
            ))}
            {TARGETS.map((key) => (
              <IntField
                key={key}
                label={`Value ${names[key]}`}
                value={values[key]}
                onCommit={(next) =>
                  setValues((current) => ({ ...current, [key]: next }))
                }
              />
            ))}
            <NameField
              label="Nama Pointer"
              value={pointer}
              taken={[names.a, names.b]}
              onCommit={(next) => rename("pointer", next)}
            />
          </div>
        </DataEditor>
      }
      hint="Pilih target Pointer-nya langsung di baris kode di bawah."
      visual={
        <>
          <VariableDiagram
            variables={TARGETS.map((key) => ({
              name: names[key],
              value: values[key],
              address: ADDRESSES[key],
              isAddressActive: key === target,
            }))}
            marks={[
              {
                kind: "pointer",
                column: TARGETS.indexOf(target),
                name: pointer,
                value: ADDRESSES[target],
              },
            ]}
          />
          <ExpressionBar>
            <span className="min-w-0 wrap-anywhere text-pointer-ink">
              {pointer}
            </span>
            <span>=</span>
            <span className="text-address-ink">&amp;</span>
            <span
              role="group"
              aria-label={`Target ${pointer}`}
              className="flex min-w-0 flex-wrap gap-1 rounded-xl bg-card p-1 ring-1 ring-border"
            >
              {TARGETS.map((key) => (
                <button
                  key={key}
                  type="button"
                  aria-pressed={key === target}
                  onClick={() => setTarget(key)}
                  className={`min-h-11 min-w-0 rounded-lg px-3 wrap-anywhere transition-colors duration-200 ease-interaction ${key === target ? "bg-variable/12 text-variable-ink ring-2 ring-variable" : "text-muted-foreground hover:bg-muted"}`}
                >
                  {names[key]}
                </button>
              ))}
            </span>
            <span>;</span>
          </ExpressionBar>
        </>
      }
      narration={
        <Narration>
          {target === "a" ? (
            <>
              <RoleChip role="pointer">{pointer}</RoleChip> nyimpen{" "}
              <RoleChip role="address">Address {ADDRESSES.a}</RoleChip>,
              Address-nya <RoleChip role="variable">{names.a}</RoleChip>.
              Makanya panahnya ke <RoleChip role="variable">{names.a}</RoleChip>
              .
            </>
          ) : (
            <>
              <code>
                {pointer} = &amp;{names.b}
              </code>{" "}
              (tanpa *) cuma ganti isi{" "}
              <RoleChip role="pointer">{pointer}</RoleChip> jadi{" "}
              <RoleChip role="address">{ADDRESSES.b}</RoleChip>. Panahnya
              pindah, tapi Value <RoleChip role="variable">{names.a}</RoleChip>{" "}
              tetep {values.a} dan{" "}
              <RoleChip role="variable">{names.b}</RoleChip> tetep {values.b}.
            </>
          )}
        </Narration>
      }
    />
  );
}
