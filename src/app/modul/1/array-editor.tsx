"use client";

import { Info, SlidersHorizontal, Undo2 } from "lucide-react";
import { type KeyboardEvent, type ReactNode, useId, useState } from "react";

import { INPUT_CLASS } from "@/components/data-editor";
import { Button } from "@/components/ui";
import {
  type ArrayIndexingProgram,
  type ProgramEdit,
  TAKEN_NAMES,
  parseIndex,
} from "@/lib/array-indexing";
import { MAX_ARRAY_LENGTH, MIN_ARRAY_LENGTH } from "@/lib/memory";
import {
  type ParseResult,
  parseIntInput,
  validateIdentifier,
} from "@/lib/validation";

const LENGTHS = Array.from(
  { length: MAX_ARRAY_LENGTH - MIN_ARRAY_LENGTH + 1 },
  (_, i) => MIN_ARRAY_LENGTH + i,
);

/**
 * What the student has typed but not applied yet. Typing never touches the
 * program, so half-typed text such as "" or "-" is fine; Enter or leaving the
 * field applies it once. An invalid draft keeps its text and error while the
 * code keeps the last valid program; Escape drops the draft.
 */
function useFieldDraft<T>(
  value: T,
  format: (value: T) => string,
  parse: (raw: string) => ParseResult<T>,
  onCommit: (value: T) => void,
) {
  const [draft, setDraft] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function commit() {
    // Nothing typed since the last apply: Enter followed by blur applies once.
    if (draft === null) {
      return;
    }
    const parsed = parse(draft);
    if (!parsed.ok) {
      setError(parsed.error);
      return;
    }
    setDraft(null);
    setError(null);
    onCommit(parsed.value);
  }

  return {
    text: draft ?? format(value),
    error,
    onChange(raw: string) {
      setDraft(raw);
      setError(null);
    },
    onBlur: commit,
    onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
      if (event.key === "Enter") {
        event.preventDefault();
        commit();
      } else if (event.key === "Escape") {
        setDraft(null);
        setError(null);
      }
    },
  };
}

type DraftInputProps<T> = {
  label: ReactNode;
  value: T;
  format: (value: T) => string;
  parse: (raw: string) => ParseResult<T>;
  onCommit: (value: T) => void;
  inputMode: "text" | "numeric";
  className: string;
  inputClassName?: string;
  /** Where the error goes, so a row of small inputs can share one line. */
  renderError?: (error: ReactNode) => ReactNode;
};

function DraftInput<T>({
  label,
  value,
  format,
  parse,
  onCommit,
  inputMode,
  className,
  inputClassName = "",
  renderError = (error) => error,
}: DraftInputProps<T>) {
  const id = useId();
  const errorId = `${id}-error`;
  const { text, error, ...handlers } = useFieldDraft(
    value,
    format,
    parse,
    onCommit,
  );
  return (
    <>
      <div className={`flex min-w-0 flex-col gap-1 ${className}`}>
        <label htmlFor={id} className="text-sm text-muted-foreground">
          {label}
        </label>
        <input
          id={id}
          value={text}
          inputMode={inputMode}
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          onChange={(event) => handlers.onChange(event.target.value)}
          onBlur={handlers.onBlur}
          onKeyDown={handlers.onKeyDown}
          className={`${INPUT_CLASS} ${inputClassName}`}
        />
      </div>
      {error
        ? renderError(
            <p id={errorId} role="alert" className="text-sm text-destructive">
              {error}
            </p>,
          )
        : null}
    </>
  );
}

// An error under a row of fields takes the row's full width, on its own line.
const ownLine = (error: ReactNode) => (
  <div className="order-last basis-full">{error}</div>
);

export function ArrayEditor({
  program,
  notice,
  onEdit,
}: {
  program: ArrayIndexingProgram;
  /** A short note on what the last edit adjusted, such as a moved Index. */
  notice: string | null;
  onEdit: (edit: ProgramEdit) => void;
}) {
  const headingId = useId();
  const lengthId = useId();
  const { arrayName, values, index } = program;

  return (
    <section
      aria-labelledby={headingId}
      className="flex flex-col gap-3 rounded-2xl bg-card p-3 shadow-subtle ring-1 ring-foreground/10 sm:p-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-x-2">
        <h2
          id={headingId}
          className="flex items-center gap-2 text-base font-semibold whitespace-nowrap"
        >
          <SlidersHorizontal
            aria-hidden="true"
            className="size-4 text-muted-foreground"
          />
          Atur Array
        </h2>
        <Button
          variant="ghost"
          onClick={() => onEdit({ kind: "restore" })}
          className="-mr-2 px-2 text-sm whitespace-nowrap"
        >
          <Undo2 aria-hidden="true" />
          Pulihkan Contoh
        </Button>
      </div>

      <div>
        <div className="flex flex-wrap items-end gap-3">
          <DraftInput
            label="Nama array"
            value={arrayName}
            format={(name) => name}
            parse={(raw) => validateIdentifier(raw, TAKEN_NAMES)}
            onCommit={(name) => onEdit({ kind: "rename", name })}
            inputMode="text"
            className="flex-1 basis-40"
            renderError={ownLine}
          />
          <div className="flex w-28 flex-col gap-1">
            <label htmlFor={lengthId} className="text-sm text-muted-foreground">
              Jumlah elemen
            </label>
            <select
              id={lengthId}
              value={values.length}
              onChange={(event) =>
                onEdit({ kind: "resize", length: Number(event.target.value) })
              }
              className={`${INPUT_CLASS} cursor-pointer`}
            >
              {LENGTHS.map((length) => (
                <option key={length} value={length}>
                  {length}
                </option>
              ))}
            </select>
          </div>
          <DraftInput
            label="Index yang diakses"
            value={index}
            format={String}
            parse={(raw) => parseIndex(raw, values.length)}
            onCommit={(next) => onEdit({ kind: "select", index: next })}
            inputMode="numeric"
            className="w-32"
            inputClassName="text-index-ink"
            renderError={ownLine}
          />
        </div>
        {/* Always mounted, so screen readers hear the note when it appears. */}
        <p
          aria-live="polite"
          className="mt-2 flex gap-2 text-sm text-muted-foreground empty:mt-0"
        >
          {notice ? (
            <>
              <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
              <span>{notice}</span>
            </>
          ) : null}
        </p>
      </div>

      <fieldset className="min-w-0">
        <legend className="mb-1 text-sm text-muted-foreground">
          Value tiap elemen{" "}
          <span className="max-sm:sr-only">(ketik, terus Enter)</span>
        </legend>
        <div className="flex flex-wrap items-end gap-2">
          {values.map((value, position) => (
            <DraftInput
              key={position}
              label={
                <span className="font-mono text-xs">
                  <span className="sr-only">Value {arrayName}</span>[{position}]
                </span>
              }
              value={value}
              format={String}
              parse={(raw) => {
                const parsed = parseIntInput(raw);
                return parsed.ok
                  ? parsed
                  : { ok: false, error: `[${position}] ${parsed.error}` };
              }}
              onCommit={(next) =>
                onEdit({ kind: "value", index: position, value: next })
              }
              inputMode="numeric"
              className="w-16 sm:w-18"
              inputClassName="px-1 text-center"
              renderError={ownLine}
            />
          ))}
        </div>
      </fieldset>
    </section>
  );
}
