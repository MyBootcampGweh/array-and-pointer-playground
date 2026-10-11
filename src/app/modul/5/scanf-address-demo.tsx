"use client";

import { CornerDownLeft, Keyboard, RotateCcw } from "lucide-react";
import { type SubmitEvent, useId, useState } from "react";

import { CodePanel } from "@/components/code-panel";
import { DataEditor, INPUT_CLASS, NameField } from "@/components/data-editor";
import { VariableDiagram } from "@/components/memory-diagram";
import { Button, Narration, RoleChip, Stage } from "@/components/ui";
import { type CodeLine } from "@/lib/c-syntax";
import { BASE_ADDRESS } from "@/lib/memory";
import { parseIntInput } from "@/lib/validation";

const DEFAULT_NAME = "angka";

export function ScanfAddressDemo() {
  const inputId = useId();
  const errorId = `${inputId}-error`;
  const [name, setName] = useState(DEFAULT_NAME);
  // `null` until scanf stores something, like the "?" of a fresh `int`.
  const [stored, setStored] = useState<number | null>(null);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);

  const destination = `&${name}`;
  const lines: CodeLine[] = [
    ["int ", { text: name, role: "variable" }, ";"],
    ['scanf("%d", ', { text: destination, role: "address" }, ");"],
  ];

  // scanf only reads once Enter is pressed, so validation waits for it too.
  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = parseIntInput(draft);
    if (!parsed.ok) {
      setError(parsed.error);
      return;
    }
    setStored(parsed.value);
    setDraft("");
    setError(null);
  }
  function reset() {
    setStored(null);
    setDraft("");
    setError(null);
  }
  function changeName(next: string) {
    setName(next);
    reset();
  }

  return (
    <Stage
      code={<CodePanel lines={lines} activeLine={1} />}
      editor={
        <DataEditor onRestore={() => changeName(DEFAULT_NAME)}>
          <NameField
            label="Nama variabel"
            value={name}
            taken={["scanf"]}
            onCommit={changeName}
          />
        </DataEditor>
      }
      hint="Ketik angka, terus Enter. Liat ke Address mana angkanya masuk."
      visual={
        <>
          <VariableDiagram
            variables={[
              {
                name,
                value: stored,
                address: BASE_ADDRESS,
                isActive: stored !== null,
                isAddressActive: true,
              },
            ]}
            marks={[
              { kind: "label", role: "address", column: 0, label: destination },
            ]}
          />
          <form onSubmit={handleSubmit} noValidate>
            <label
              htmlFor={inputId}
              className="flex items-center gap-2 text-sm font-medium text-muted-foreground"
            >
              <Keyboard aria-hidden="true" className="size-4" />
              Input keyboard buat scanf
            </label>
            <div className="mt-2 flex gap-2">
              <input
                id={inputId}
                value={draft}
                onChange={(event) => {
                  setDraft(event.target.value);
                  setError(null);
                }}
                inputMode="numeric"
                autoComplete="off"
                spellCheck={false}
                placeholder="Contoh: 42"
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? errorId : undefined}
                className={`${INPUT_CLASS} placeholder:text-muted-foreground`}
              />
              <Button type="submit" variant="primary">
                <CornerDownLeft aria-hidden="true" />
                {/* Icon only on phones, so the input keeps room beside Ulang. */}
                <span className="max-sm:sr-only">Enter</span>
              </Button>
              <Button
                onClick={reset}
                aria-disabled={stored === null}
                title="Ulang"
              >
                <RotateCcw aria-hidden="true" />
                <span className="sr-only">Ulang</span>
              </Button>
            </div>
            {error ? (
              <p
                id={errorId}
                role="alert"
                className="mt-1 text-sm text-destructive"
              >
                {error}
              </p>
            ) : null}
          </form>
        </>
      }
      narration={
        <Narration>
          {stored === null ? (
            <>
              <RoleChip role="address">{destination}</RoleChip> ngasih tau scanf
              harus naruh angkanya di{" "}
              <RoleChip role="address">Address {BASE_ADDRESS}</RoleChip>.
            </>
          ) : (
            <>
              scanf baca <RoleChip role="value">{stored}</RoleChip>, terus naruh
              di <RoleChip role="address">Address {BASE_ADDRESS}</RoleChip>,
              alias kotak {name}.
            </>
          )}
        </Narration>
      }
      footnote="Cuma simulasi, nggak ada program C yang jalan."
    />
  );
}
