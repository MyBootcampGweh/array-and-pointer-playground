"use client";

import { type ReactNode, useState } from "react";

import { CodePanel } from "@/components/code-panel";
import { DataEditor, IntField, NameField } from "@/components/data-editor";
import { VariableDiagram } from "@/components/memory-diagram";
import { StepControls, useStepper } from "@/components/step-controls";
import { Narration, RoleChip, Screen, Stage } from "@/components/ui";
import { type CodeLine } from "@/lib/c-syntax";
import { BASE_ADDRESS } from "@/lib/memory";

const DEFAULT_NAME = "angka";
const DEFAULT_POINTER = "ptr";
const DEFAULT_VALUE = 10;
const DEFAULT_NEW_VALUE = 20;
const SNIPPET_NAMES = ["printf"];

/** `*ptr` takes two hops, so reading it gets two steps: Address, then Value. */
const STEPS = [
  "declare",
  "read-address",
  "read-value",
  "write",
  "done",
] as const;
type Step = (typeof STEPS)[number];

export function DereferenceDemo() {
  const [name, setName] = useState(DEFAULT_NAME);
  const [pointer, setPointer] = useState(DEFAULT_POINTER);
  const [value, setValue] = useState(DEFAULT_VALUE);
  const [newValue, setNewValue] = useState(DEFAULT_NEW_VALUE);
  const stepper = useStepper(STEPS.length);
  const step: Step = STEPS[stepper.step] ?? "declare";

  const deref = `*${pointer}`;
  const lines: CodeLine[] = [
    [
      "int ",
      { text: name, role: "variable" },
      " = ",
      { text: String(value), role: "value" },
      ";",
    ],
    [
      "int *",
      { text: pointer, role: "pointer" },
      " = ",
      { text: `&${name}`, role: "address" },
      ";",
    ],
    "",
    ['printf("%d", ', { text: deref, role: "pointer" }, ");"],
    [
      { text: deref, role: "pointer" },
      " = ",
      { text: String(newValue), role: "value" },
      ";",
    ],
  ];
  const focus: Record<Step, { line: number | null; part: string | null }> = {
    declare: { line: 1, part: `int *${pointer}` },
    "read-address": { line: 3, part: deref },
    "read-value": { line: 3, part: deref },
    write: { line: 4, part: `${deref} = ${newValue}` },
    done: { line: null, part: null },
  };
  const hasWritten = step === "write" || step === "done";
  const isAtTarget = step === "read-value" || step === "write";
  const printed =
    stepper.step >= STEPS.indexOf("read-value") ? String(value) : "";

  // Any edit starts the run over, so the code and the diagram always agree.
  function changeName(next: string) {
    setName(next);
    stepper.reset();
  }
  function changePointer(next: string) {
    setPointer(next);
    stepper.reset();
  }
  function changeValue(next: number) {
    setValue(next);
    stepper.reset();
  }
  function changeNewValue(next: number) {
    setNewValue(next);
    stepper.reset();
  }
  function restoreExample() {
    changeName(DEFAULT_NAME);
    changePointer(DEFAULT_POINTER);
    changeValue(DEFAULT_VALUE);
    changeNewValue(DEFAULT_NEW_VALUE);
  }

  return (
    <Stage
      code={
        <CodePanel
          lines={lines}
          activeLine={focus[step].line}
          activePart={focus[step].part}
        />
      }
      editor={
        <DataEditor onRestore={restoreExample}>
          <div className="grid gap-4 sm:grid-cols-2">
            <NameField
              label="Nama variabel"
              value={name}
              taken={[pointer, ...SNIPPET_NAMES]}
              onCommit={changeName}
            />
            <NameField
              label="Nama Pointer"
              value={pointer}
              taken={[name, ...SNIPPET_NAMES]}
              onCommit={changePointer}
            />
            <IntField
              label={`Value ${name}`}
              value={value}
              onCommit={changeValue}
            />
            <IntField
              label="Value baru"
              value={newValue}
              onCommit={changeNewValue}
            />
          </div>
        </DataEditor>
      }
      hint={
        <>
          Tekan Lanjut, terus liat <code>*</code> ngikutin panah Pointer-nya.
        </>
      }
      visual={
        <>
          <VariableDiagram
            variables={[
              {
                name,
                value: hasWritten ? newValue : value,
                address: BASE_ADDRESS,
                isActive: isAtTarget,
                isAddressActive: step === "read-address" || isAtTarget,
                alias: isAtTarget || step === "done" ? deref : undefined,
              },
            ]}
            marks={[
              {
                kind: "pointer",
                column: 0,
                name: pointer,
                value: BASE_ADDRESS,
                isActive: step === "declare" || step === "read-address",
              },
            ]}
          />
          <Screen
            output={printed}
            freshFrom={step === "read-value" ? 0 : null}
          />
        </>
      }
      controls={<StepControls stepper={stepper} />}
      narration={
        <Narration>
          {describe(step, { name, pointer, value, newValue })}
        </Narration>
      }
    />
  );
}

function describe(
  step: Step,
  {
    name,
    pointer,
    value,
    newValue,
  }: { name: string; pointer: string; value: number; newValue: number },
): ReactNode {
  switch (step) {
    case "declare":
      return (
        <>
          <strong>* di deklarasi</strong> cuma tanda kalau{" "}
          <RoleChip role="pointer">{pointer}</RoleChip> itu Pointer, isinya{" "}
          <RoleChip role="address">Address {BASE_ADDRESS}</RoleChip>.
        </>
      );
    case "read-address":
      return (
        <>
          <strong>* di depan {pointer}</strong> artinya “buka Address-nya”: cek
          dulu isi <RoleChip role="pointer">{pointer}</RoleChip>, dapet{" "}
          <RoleChip role="address">{BASE_ADDRESS}</RoleChip>.
        </>
      );
    case "read-value":
      return (
        <>
          Ikutin panahnya ke Address {BASE_ADDRESS}: Value di situ{" "}
          <RoleChip role="value">{value}</RoleChip>, itu yang ditampilin printf.
        </>
      );
    case "write":
      return (
        <>
          <code>
            *{pointer} = {newValue}
          </code>{" "}
          nulis <RoleChip role="value">{newValue}</RoleChip> ke Address{" "}
          {BASE_ADDRESS}, jadi <RoleChip role="variable">{name}</RoleChip> ikut
          berubah tanpa{" "}
          <code>
            {name} = {newValue}
          </code>
          .
        </>
      );
    case "done":
      return (
        <>
          Beres! <RoleChip role="pointer">{pointer}</RoleChip> = Address,{" "}
          <RoleChip role="pointer">*{pointer}</RoleChip> = Value di Address itu.
        </>
      );
  }
}
