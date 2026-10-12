"use client";

import { ChevronUp, Info, SlidersHorizontal, Undo2 } from "lucide-react";
import { type KeyboardEvent, type ReactNode, useId, useState } from "react";

import { Button } from "@/components/ui";
import { arrayLengths } from "@/lib/program";
import {
  type ParseResult,
  parseIntInput,
  validateIdentifier,
} from "@/lib/validation";

/** MBG's input look, shared with inputs outside the editor. */
export const INPUT_CLASS =
  "h-11 w-full min-w-0 rounded-xl border border-input bg-background px-3 font-mono text-base transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20";

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
};

/**
 * A labelled field that applies on Enter or blur. Its error goes on its own
 * line under the whole row of fields (`order-last basis-full` in the row's
 * wrap), so a row of small inputs never squeezes a sentence into one box.
 */
export function DraftInput<T>({
  label,
  value,
  format,
  parse,
  onCommit,
  inputMode,
  className,
  inputClassName = "",
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
      {error ? (
        <div className="order-last basis-full">
          <p id={errorId} role="alert" className="text-sm text-destructive">
            {error}
          </p>
        </div>
      ) : null}
    </>
  );
}

/** A C name; `taken` holds every other name the program already uses. */
export function NameInput({
  label,
  value,
  taken,
  onCommit,
  className = "flex-1 basis-40",
}: {
  label: string;
  value: string;
  taken: readonly string[];
  onCommit: (name: string) => void;
  className?: string;
}) {
  return (
    <DraftInput
      label={label}
      value={value}
      format={(name) => name}
      parse={(raw) => validateIdentifier(raw, taken)}
      onCommit={onCommit}
      inputMode="text"
      className={className}
    />
  );
}

/** A direct int field: no spinner, applied on Enter or blur. */
export function IntInput({
  label,
  value,
  onCommit,
  className = "w-32",
}: {
  label: ReactNode;
  value: number;
  onCommit: (value: number) => void;
  className?: string;
}) {
  return (
    <DraftInput
      label={label}
      value={value}
      format={String}
      parse={parseIntInput}
      onCommit={onCommit}
      inputMode="numeric"
      className={className}
    />
  );
}

/**
 * The editor card: a heading, Pulihkan Contoh, and the fields. The student
 * may fold the fields away to see more code; they start open. Folded fields
 * stay mounted, so a half-typed draft is still there when they come back.
 */
export function EditorCard({
  title,
  onRestore,
  children,
}: {
  title: string;
  onRestore: () => void;
  children: ReactNode;
}) {
  const headingId = useId();
  const bodyId = useId();
  const [isOpen, setIsOpen] = useState(true);
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
          {title}
        </h2>
        <div className="-mr-2 flex flex-wrap justify-end">
          {isOpen ? (
            <Button
              variant="ghost"
              onClick={onRestore}
              className="px-2 text-sm whitespace-nowrap"
            >
              <Undo2 aria-hidden="true" />
              Pulihkan Contoh
            </Button>
          ) : null}
          <Button
            variant="ghost"
            aria-expanded={isOpen}
            aria-controls={bodyId}
            onClick={() => setIsOpen((open) => !open)}
            title={isOpen ? "Sembunyikan pengaturan" : "Tampilkan pengaturan"}
            className="px-2 text-sm whitespace-nowrap max-sm:min-w-11"
          >
            <ChevronUp
              aria-hidden="true"
              className={`transition-transform ${isOpen ? "" : "rotate-180"}`}
            />
            {/* A phone has room for Pulihkan Contoh and an icon, not both
                words; the name stays whole for screen readers. */}
            <span className="max-sm:sr-only">
              {isOpen ? "Sembunyikan" : "Tampilkan"}
            </span>
            <span className="sr-only"> pengaturan</span>
          </Button>
        </div>
      </div>
      <div id={bodyId} hidden={!isOpen} className="flex flex-col gap-3">
        {children}
      </div>
    </section>
  );
}

/** A row of fields that wraps; errors drop to their own line under it. */
export function FieldRow({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap items-end gap-3">{children}</div>;
}

/** An initial Value's label; screen readers also hear whose it is. */
export function ValueLabel({ name }: { name: string }) {
  return (
    <>
      Value awal<span className="sr-only"> {name}</span>
    </>
  );
}

/** The Value a later `*ptr = …` writes, told apart from the initial ones. */
export function LaterLabel({ pointer }: { pointer: string }) {
  // A long Pointer name breaks anywhere rather than widen a narrow field.
  return <span className="wrap-anywhere">Value baru (*{pointer} = …)</span>;
}

/** A variable's name and its initial Value: they wrap as one, never apart. */
export function FieldPair({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-1 basis-56 flex-wrap items-end gap-2">
      {children}
    </div>
  );
}

/** What the last edit adjusted, such as a moved Index. */
export function EditorNotice({ notice }: { notice: string | null }) {
  // Always mounted, so screen readers hear the note when it appears.
  return (
    <p
      aria-live="polite"
      className="-mt-1 flex gap-2 text-sm text-muted-foreground empty:hidden"
    >
      {notice ? (
        <>
          <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          <span>{notice}</span>
        </>
      ) : null}
    </p>
  );
}

export function LengthSelect({
  value,
  min,
  onChange,
}: {
  value: number;
  /** The smallest length the program still makes sense with. */
  min?: number;
  onChange: (length: number) => void;
}) {
  const id = useId();
  return (
    <div className="flex w-28 flex-col gap-1">
      <label htmlFor={id} className="text-sm text-muted-foreground">
        Jumlah elemen
      </label>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className={`${INPUT_CLASS} cursor-pointer`}
      >
        {arrayLengths(min).map((length) => (
          <option key={length} value={length}>
            {length}
          </option>
        ))}
      </select>
    </div>
  );
}

/** One small field per element, labelled with its Index. */
export function ValuesRow({
  arrayName,
  values,
  onCommit,
}: {
  arrayName: string;
  values: readonly number[];
  onCommit: (index: number, value: number) => void;
}) {
  return (
    <fieldset className="min-w-0">
      <legend className="mb-1 text-sm text-muted-foreground">
        Value awal tiap elemen{" "}
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
            onCommit={(next) => onCommit(position, next)}
            inputMode="numeric"
            className="w-16 sm:w-18"
            inputClassName="px-1 text-center"
          />
        ))}
      </div>
    </fieldset>
  );
}
