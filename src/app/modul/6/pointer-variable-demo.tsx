"use client";

import { type ReactNode, useState } from "react";

import { CodePanel } from "@/components/code-panel";
import { DataEditor, IntField, NameField } from "@/components/data-editor";
import { VariableDiagram } from "@/components/memory-diagram";
import { StepControls, useStepper } from "@/components/step-controls";
import { Narration, RoleChip, Stage } from "@/components/ui";
import { type CodeLine } from "@/lib/c-syntax";
import { BASE_ADDRESS } from "@/lib/memory";

const DEFAULT_NAME = "angka";
const DEFAULT_POINTER = "ptr";
const DEFAULT_VALUE = 10;

/** One idea per step: the Variable, `&`, the stored Address, the arrow. */
const STEPS = ["declare", "address-of", "store", "point"] as const;
type Step = (typeof STEPS)[number];

export function PointerVariableDemo() {
  const [name, setName] = useState(DEFAULT_NAME);
  const [pointer, setPointer] = useState(DEFAULT_POINTER);
  const [value, setValue] = useState(DEFAULT_VALUE);
  const stepper = useStepper(STEPS.length);
  const step: Step = STEPS[stepper.step] ?? "declare";

  const addressOfName = `&${name}`;
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
      { text: addressOfName, role: "address" },
      ";",
    ],
  ];
  const focus: Record<Step, { line: number | null; part: string | null }> = {
    declare: { line: 0, part: null },
    "address-of": { line: 1, part: addressOfName },
    store: { line: 1, part: `int *${pointer}` },
    point: { line: null, part: null },
  };

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
  function restoreExample() {
    changeName(DEFAULT_NAME);
    changePointer(DEFAULT_POINTER);
    changeValue(DEFAULT_VALUE);
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
              taken={[pointer]}
              onCommit={changeName}
            />
            <NameField
              label="Nama Pointer"
              value={pointer}
              taken={[name]}
              onCommit={changePointer}
            />
          </div>
          <IntField
            label={`Value ${name}`}
            value={value}
            onCommit={changeValue}
          />
        </DataEditor>
      }
      hint="Tekan Lanjut buat bikin Pointer-nya selangkah demi selangkah."
      visual={
        <VariableDiagram
          variables={[
            {
              name,
              value,
              address: BASE_ADDRESS,
              isActive: step === "declare",
              isAddressActive: step !== "declare",
            },
          ]}
          marks={[
            {
              kind: "pointer",
              column: 0,
              name: pointer,
              value: BASE_ADDRESS,
              isActive: step === "store",
              hasArrow: step === "point",
              isHidden: step === "declare" || step === "address-of",
            },
          ]}
        />
      }
      controls={<StepControls stepper={stepper} />}
      narration={<Narration>{describe(step, name, pointer, value)}</Narration>}
    />
  );
}

function describe(
  step: Step,
  name: string,
  pointer: string,
  value: number,
): ReactNode {
  switch (step) {
    case "declare":
      return (
        <>
          Variabel <RoleChip role="variable">{name}</RoleChip> nyimpen {value}{" "}
          di <RoleChip role="address">Address {BASE_ADDRESS}</RoleChip>.
        </>
      );
    case "address-of":
      return (
        <>
          <RoleChip role="address">&amp;{name}</RoleChip> artinya Address-nya{" "}
          {name}: <RoleChip role="address">{BASE_ADDRESS}</RoleChip>, bukan
          Value-nya.
        </>
      );
    case "store":
      return (
        <>
          Pointer <RoleChip role="pointer">{pointer}</RoleChip> nyimpen{" "}
          <RoleChip role="address">{BASE_ADDRESS}</RoleChip>: isinya Address,
          bukan Value {value}.
        </>
      );
    case "point":
      return (
        <>
          <RoleChip role="pointer">{pointer}</RoleChip> nyimpen Address-nya{" "}
          {name}, jadi {pointer} <strong>nunjuk</strong> ke{" "}
          <RoleChip role="variable">{name}</RoleChip>; panahnya cuma gambaran
          dari Address itu.
        </>
      );
  }
}
