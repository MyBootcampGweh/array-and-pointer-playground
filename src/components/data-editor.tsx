"use client";

import { ChevronDown, Minus, Pencil, Plus, Undo2 } from "lucide-react";
import { type ReactNode, useId, useState } from "react";

import { Button } from "@/components/ui";
import { MAX_ARRAY_LENGTH, MIN_ARRAY_LENGTH, clamp } from "@/lib/memory";
import {
  INT_MAX,
  INT_MIN,
  type ParseResult,
  parseIntInput,
  validateIdentifier,
} from "@/lib/validation";

/** Collapsed by default so the projected view stays uncluttered. */
export function DataEditor({
  children,
  onRestore,
}: {
  children: ReactNode;
  onRestore: () => void;
}) {
  return (
    <details className="group rounded-2xl bg-card shadow-subtle ring-1 ring-foreground/10">
      <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 rounded-2xl px-4 py-3 font-medium select-none">
        <Pencil aria-hidden="true" className="size-4 text-accent-foreground" />
        Ganti nama &amp; nilai
        <ChevronDown
          aria-hidden="true"
          className="ml-auto size-5 text-muted-foreground transition-transform group-open:rotate-180"
        />
      </summary>
      <div className="flex flex-col gap-4 border-t px-4 py-4">
        {children}
        <Button onClick={onRestore} className="self-start">
          <Undo2 aria-hidden="true" />
          Balikin contoh awal
        </Button>
      </div>
    </details>
  );
}

type FieldProps<T> = {
  label: string;
  value: T;
  format: (value: T) => string;
  parse: (raw: string) => ParseResult<T>;
  onCommit: (value: T) => void;
  inputMode: "text" | "numeric";
};

/**
 * A text input that only commits valid values. While the draft is invalid the
 * error shows and the code keeps the last valid value; leaving the field
 * restores that value.
 */
function Field<T>({
  label,
  value,
  format,
  parse,
  onCommit,
  inputMode,
}: FieldProps<T>) {
  const id = useId();
  const errorId = `${id}-error`;
  const [draft, setDraft] = useState<string | null>(null);
  const result = draft === null ? null : parse(draft);
  const error = result && !result.ok ? result.error : null;

  return (
    <div className="flex min-w-0 flex-col gap-1">
      <label htmlFor={id} className="font-mono text-sm">
        {label}
      </label>
      <input
        id={id}
        value={draft ?? format(value)}
        inputMode={inputMode}
        autoComplete="off"
        autoCapitalize="off"
        spellCheck={false}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        onChange={(event) => {
          const raw = event.target.value;
          setDraft(raw);
          const parsed = parse(raw);
          if (parsed.ok && parsed.value !== value) {
            onCommit(parsed.value);
          }
        }}
        onBlur={() => setDraft(null)}
        className="h-11 w-full min-w-0 rounded-xl border border-input bg-background px-3 font-mono text-base transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20"
      />
      {error ? (
        <p id={errorId} role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function NameField({
  label,
  value,
  taken,
  onCommit,
}: {
  label: string;
  value: string;
  /** Other names in the snippet; the field's own name is not included. */
  taken: readonly string[];
  onCommit: (name: string) => void;
}) {
  return (
    <Field
      label={label}
      value={value}
      format={(name) => name}
      parse={(raw) => validateIdentifier(raw, taken)}
      onCommit={onCommit}
      inputMode="text"
    />
  );
}

export function IntField({
  label,
  value,
  onCommit,
}: {
  label: string;
  value: number;
  onCommit: (value: number) => void;
}) {
  return (
    <Field
      label={label}
      value={value}
      format={String}
      parse={parseIntInput}
      onCommit={onCommit}
      inputMode="numeric"
    />
  );
}

export function ArrayValuesField({
  name,
  values,
  onChange,
  legend = "Isi array",
}: {
  name: string;
  values: readonly number[];
  onChange: (values: number[]) => void;
  legend?: string;
}) {
  const canAdd = values.length < MAX_ARRAY_LENGTH;
  const canRemove = values.length > MIN_ARRAY_LENGTH;
  // A new element continues the pattern of the last one (10, 20, 30, …).
  const nextValue = clamp((values.at(-1) ?? 0) + 10, INT_MIN, INT_MAX);

  return (
    <fieldset className="flex min-w-0 flex-col gap-3">
      <legend className="mb-2 text-sm font-medium">
        {legend}{" "}
        <span className="text-muted-foreground">
          ({values.length} dari maks. {MAX_ARRAY_LENGTH})
        </span>
      </legend>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {values.map((value, index) => (
          <IntField
            key={index}
            label={`${name}[${index}]`}
            value={value}
            onCommit={(next) =>
              onChange(values.map((old, i) => (i === index ? next : old)))
            }
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        <Button
          onClick={() => onChange([...values, nextValue])}
          disabled={!canAdd}
        >
          <Plus aria-hidden="true" />
          Tambah
        </Button>
        <Button
          onClick={() => onChange(values.slice(0, -1))}
          disabled={!canRemove}
        >
          <Minus aria-hidden="true" />
          Kurangi
        </Button>
      </div>
    </fieldset>
  );
}
