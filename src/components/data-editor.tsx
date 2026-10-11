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

/** Open from the start: renaming and retyping is half of each module. */
export function DataEditor({
  children,
  onRestore,
}: {
  children: ReactNode;
  onRestore: () => void;
}) {
  return (
    <details
      open
      className="group rounded-2xl bg-card shadow-subtle ring-1 ring-foreground/10"
    >
      <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 rounded-2xl px-4 py-3 font-medium select-none">
        <Pencil aria-hidden="true" className="size-4 text-accent-foreground" />
        Ganti nama &amp; Value
        <ChevronDown
          aria-hidden="true"
          className="ml-auto size-5 text-muted-foreground transition-transform group-open:rotate-180"
        />
      </summary>
      <div className="flex flex-col gap-3 border-t px-4 py-3">
        {children}
        <Button variant="ghost" onClick={onRestore} className="self-start">
          <Undo2 aria-hidden="true" />
          Balikin contoh awal
        </Button>
      </div>
    </details>
  );
}

/** MBG's input look, shared with inputs outside this editor. */
export const INPUT_CLASS =
  "h-11 w-full min-w-0 rounded-xl border border-input bg-background px-3 font-mono text-base transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20";

/**
 * A text draft that only commits valid values. While the draft is invalid the
 * error shows and the code keeps the last valid value; leaving the field
 * restores that value.
 */
function useDraft<T>(
  value: T,
  format: (value: T) => string,
  parse: (raw: string) => ParseResult<T>,
  onCommit: (value: T) => void,
) {
  const [draft, setDraft] = useState<string | null>(null);
  const result = draft === null ? null : parse(draft);
  return {
    text: draft ?? format(value),
    error: result && !result.ok ? result.error : null,
    change(raw: string) {
      setDraft(raw);
      const parsed = parse(raw);
      if (parsed.ok && parsed.value !== value) {
        onCommit(parsed.value);
      }
    },
    blur() {
      setDraft(null);
    },
  };
}

type FieldProps<T> = {
  label: ReactNode;
  value: T;
  format: (value: T) => string;
  parse: (raw: string) => ParseResult<T>;
  onCommit: (value: T) => void;
  inputMode: "text" | "numeric";
};

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
  const draft = useDraft(value, format, parse, onCommit);

  return (
    <div className="flex min-w-0 flex-col gap-1">
      <label htmlFor={id} className="font-mono text-sm wrap-anywhere">
        {label}
      </label>
      <input
        id={id}
        value={draft.text}
        inputMode={inputMode}
        autoComplete="off"
        autoCapitalize="off"
        spellCheck={false}
        aria-invalid={draft.error ? true : undefined}
        aria-describedby={draft.error ? errorId : undefined}
        onChange={(event) => draft.change(event.target.value)}
        onBlur={draft.blur}
        className={INPUT_CLASS}
      />
      {draft.error ? (
        <p id={errorId} role="alert" className="text-sm text-destructive">
          {draft.error}
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
  label: ReactNode;
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
  legend = "Value",
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
    <fieldset className="min-w-0">
      <legend className="mb-2 text-sm font-medium wrap-anywhere">
        {legend} <span className="font-mono text-variable-ink">{name}</span>{" "}
        <span className="text-muted-foreground">
          ({values.length} dari maks. {MAX_ARRAY_LENGTH})
        </span>
      </legend>
      {/* One wrapping row of small boxes, like the strip it edits. Labels are
          just the Index: the array name is in the legend once. */}
      <div className="flex flex-wrap items-end gap-2">
        {values.map((value, index) => (
          <ValueCell
            key={index}
            index={index}
            value={value}
            onCommit={(next) =>
              onChange(values.map((old, i) => (i === index ? next : old)))
            }
          />
        ))}
        <Button
          onClick={() => onChange(values.slice(0, -1))}
          disabled={!canRemove}
          title="Kurangi elemen"
        >
          <Minus aria-hidden="true" />
          <span className="sr-only">Kurangi</span>
        </Button>
        <Button
          onClick={() => onChange([...values, nextValue])}
          disabled={!canAdd}
          title="Tambah elemen"
        >
          <Plus aria-hidden="true" />
          <span className="sr-only">Tambah</span>
        </Button>
      </div>
    </fieldset>
  );
}

/**
 * One Value of the row. The fragment puts the box and its error straight into
 * the row's wrap, so `order-last basis-full` drops the error onto its own line
 * under the row instead of squeezing it into a 56px box.
 */
function ValueCell({
  index,
  value,
  onCommit,
}: {
  index: number;
  value: number;
  onCommit: (value: number) => void;
}) {
  const id = useId();
  const errorId = `${id}-error`;
  const draft = useDraft(value, String, parseIntInput, onCommit);
  return (
    <>
      <div className="flex w-14 flex-col gap-1 sm:w-16">
        <label htmlFor={id} className="font-mono text-sm text-index-ink">
          [{index}]
        </label>
        <input
          id={id}
          value={draft.text}
          inputMode="numeric"
          autoComplete="off"
          spellCheck={false}
          aria-invalid={draft.error ? true : undefined}
          aria-describedby={draft.error ? errorId : undefined}
          onChange={(event) => draft.change(event.target.value)}
          onBlur={draft.blur}
          className={`${INPUT_CLASS} text-center`}
        />
      </div>
      {draft.error ? (
        <p
          id={errorId}
          role="alert"
          className="order-last basis-full text-sm text-destructive"
        >
          [{index}] {draft.error}
        </p>
      ) : null}
    </>
  );
}
