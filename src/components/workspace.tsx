"use client";

import {
  ArrowRight,
  CornerDownLeft,
  Info,
  MousePointerClick,
  Terminal,
} from "lucide-react";
import { type ReactNode, type SubmitEvent, useId, useState } from "react";

import { INPUT_CLASS } from "@/components/program-editor";
import { RunControls, type Stepper } from "@/components/run-controls";
import { SplitView } from "@/components/split-view";
import { Button } from "@/components/ui";
import { type TerminalPiece } from "@/lib/program";
import { parseIntInput } from "@/lib/validation";

/**
 * A module's workspace: the control bar, then the editor and code beside one
 * card that holds the whole picture. The card is a size container, so what is
 * inside grows with its pane, not with the screen.
 */
export function Workspace({
  stepper,
  isAwaitingInput = false,
  isOpenEnded = false,
  editor,
  code,
  children,
}: {
  stepper: Stepper;
  isAwaitingInput?: boolean;
  isOpenEnded?: boolean;
  editor: ReactNode;
  code: ReactNode;
  /** The card's content: narration, picture, expression, Output. */
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col">
      <RunControls
        stepper={stepper}
        isAwaitingInput={isAwaitingInput}
        isOpenEnded={isOpenEnded}
      />
      <SplitView
        editor={editor}
        code={code}
        visual={
          <section
            aria-label="Visualisasi"
            className="@container flex min-w-0 flex-col gap-4 rounded-2xl bg-card p-3 shadow-elevated ring-1 ring-foreground/10 sm:p-5"
          >
            {children}
          </section>
        }
      />
    </div>
  );
}

/** One short line on what the student can do with the picture. */
export function Hint({ children }: { children: ReactNode }) {
  return (
    <p className="flex gap-2 text-sm text-muted-foreground">
      <MousePointerClick
        aria-hidden="true"
        className="mt-0.5 size-4 shrink-0"
      />
      <span>{children}</span>
    </p>
  );
}

/** One line of fine print at the card's foot, such as a simulation caveat. */
export function Footnote({ children }: { children: ReactNode }) {
  return (
    <p className="flex gap-2 text-sm text-muted-foreground">
      <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
      <span>{children}</span>
    </p>
  );
}

/**
 * The expression the current line evaluates, big and right under the
 * picture, such as `nilai[2] → 78`. The caption always holds a line, so the
 * box never grows when a result lands.
 */
export function ExpressionBox({
  children,
  caption,
}: {
  children: ReactNode;
  caption: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5 rounded-xl bg-muted px-4 py-3">
      <p className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-xl font-semibold @md:text-2xl @lg:text-3xl">
        {children}
      </p>
      <p aria-live="polite" className="text-base">
        {caption}
      </p>
    </div>
  );
}

/** The `→` between an expression and what it gives. */
export function ExpressionArrow() {
  return (
    <ArrowRight
      aria-hidden="true"
      className="size-6 shrink-0 text-muted-foreground"
    />
  );
}

/** `nilai[2]`: a long name may wrap, but never away from its `[2]`. */
export function ElementName({
  name,
  index,
}: {
  name: string;
  index: ReactNode;
}) {
  return (
    <span className="min-w-0 wrap-anywhere">
      <span className="text-variable-ink">{name}</span>
      <span className="whitespace-nowrap">
        [<span className="text-index-ink">{index}</span>]
      </span>
    </span>
  );
}

/** Text that waits for something to happen. */
export function Muted({ children }: { children: ReactNode }) {
  return <span className="text-muted-foreground">{children}</span>;
}

/**
 * The terminal, kept small and apart from the expression. What the student
 * typed for scanf gets a `›`; pieces from `freshFrom` on are what the current
 * step wrote and get a ring. `children` is where a waiting scanf asks.
 */
export function Output({
  pieces,
  freshFrom = null,
  title = "Output",
  emptyText = "Belum ada output.",
  children,
}: {
  pieces: readonly TerminalPiece[];
  freshFrom?: number | null;
  title?: string;
  emptyText?: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <p className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <Terminal aria-hidden="true" className="size-4" />
        {title}
      </p>
      <div className="flex flex-col gap-2 rounded-xl bg-muted px-3 py-2">
        {/* Capped, so eight scanf answers keep it small; `flex-col-reverse`
            keeps a scrolled box on its newest line. */}
        <div className="flex max-h-36 flex-col-reverse overflow-y-auto">
          <samp className="block min-h-6 font-mono text-base wrap-anywhere whitespace-pre-wrap">
            {pieces.length === 0 ? (
              <span className="font-sans text-muted-foreground">
                {emptyText}
              </span>
            ) : (
              pieces.map((piece, index) => (
                <TerminalText
                  key={index}
                  piece={piece}
                  isFresh={freshFrom !== null && index >= freshFrom}
                />
              ))
            )}
          </samp>
        </div>
        {children}
      </div>
    </div>
  );
}

function TerminalText({
  piece,
  isFresh,
}: {
  piece: TerminalPiece;
  isFresh: boolean;
}) {
  // Line breaks and trailing spaces stay outside the ring.
  const text = piece.text.trimEnd();
  const rest = piece.text.slice(text.length);
  const content =
    piece.kind === "input" ? (
      <>
        <span aria-hidden="true" className="text-muted-foreground">
          ›{" "}
        </span>
        <span className="sr-only">kamu ngetik </span>
        {text}
      </>
    ) : (
      text
    );
  return (
    <>
      {isFresh ? (
        <mark className="rounded-sm bg-transparent px-0.5 text-foreground ring-2 ring-foreground/35">
          {content}
        </mark>
      ) : (
        content
      )}
      {rest}
    </>
  );
}

/**
 * Where a waiting scanf reads from. Typing never touches the run, and
 * neither does leaving the field; the number goes in only on Enter or the
 * button, and only once it is a valid int, after which the run plays on by
 * itself. A scanf still waiting takes the focus, so the student can type
 * straight away. When the student comes back to a scanf they already
 * answered, the old answer is filled in: Enter keeps the rest of the run, a
 * new number replays it.
 */
export function ScanfInput({
  label,
  answered,
  onSubmit,
}: {
  label: ReactNode;
  /** What the student typed here last time, if this scanf already ran. */
  answered: number | null;
  onSubmit: (value: number) => void;
}) {
  const id = useId();
  const errorId = `${id}-error`;
  const [draft, setDraft] = useState(answered === null ? "" : String(answered));
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = parseIntInput(draft);
    if (!parsed.ok) {
      setError(parsed.error);
      return;
    }
    setError(null);
    onSubmit(parsed.value);
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="flex flex-col gap-1 border-t border-foreground/10 pt-2"
    >
      <label htmlFor={id} className="text-sm text-muted-foreground">
        {label}
      </label>
      <div className="flex gap-2">
        <input
          id={id}
          // Mounted per step, so this fires each time a scanf starts waiting.
          autoFocus={answered === null}
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
          className={`${INPUT_CLASS} max-w-40 placeholder:text-muted-foreground`}
        />
        <Button type="submit" variant="primary" className="max-sm:px-3">
          <CornerDownLeft aria-hidden="true" />
          Enter
        </Button>
      </div>
      {error ? (
        <p id={errorId} role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : (
        <p className="text-sm text-muted-foreground">
          {answered === null
            ? "Enter buat simpan dan lanjut."
            : "Ganti angkanya buat ngulang dari sini."}
        </p>
      )}
    </form>
  );
}
