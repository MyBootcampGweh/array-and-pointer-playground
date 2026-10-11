import { Info, MousePointerClick, Terminal, TriangleAlert } from "lucide-react";
import { type ComponentProps, type ReactNode } from "react";

import { SplitView } from "@/components/split-view";

type ButtonVariant = "primary" | "outline" | "ghost";

const BUTTON_VARIANTS: Record<ButtonVariant, string> = {
  primary: "bg-primary text-primary-foreground hover:bg-primary/85",
  outline: "border border-border bg-background hover:bg-muted",
  ghost: "text-muted-foreground hover:bg-muted hover:text-foreground",
};

/**
 * MBG's `xl` button size: the prominent control height, at least 44px. Icons
 * inside get one size here, so call sites only pick the glyph.
 */
export function buttonClass(variant: ButtonVariant = "outline"): string {
  return `inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-base font-medium transition-colors duration-200 ease-interaction select-none active:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-disabled:cursor-not-allowed aria-disabled:opacity-50 [&_svg]:size-5 [&_svg]:shrink-0 ${BUTTON_VARIANTS[variant]}`;
}

type ButtonProps = ComponentProps<"button"> & { variant?: ButtonVariant };

export function Button({
  variant = "outline",
  className = "",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`${buttonClass(variant)} ${className}`}
      {...props}
    />
  );
}

/** The five teaching roles, plus a warning for unsafe access. */
export type Role =
  "variable" | "index" | "value" | "address" | "pointer" | "danger";

/** Text in a role's ink; the same look in code, diagrams and narration. */
export const ROLE_TEXT: Record<Role, string> = {
  variable: "text-variable-ink",
  index: "text-index-ink",
  value: "text-memory-ink",
  address: "text-address-ink",
  pointer: "text-pointer-ink",
  danger: "text-destructive",
};

const ROLE_CHIP: Record<Role, string> = {
  variable: "bg-variable/12",
  index: "bg-index/12",
  value: "bg-memory/12",
  address: "bg-address/12",
  pointer: "bg-pointer/12",
  danger: "bg-destructive/10",
};

/**
 * A value in its role's colour, e.g. an Address inside a sentence. Plain
 * inline, not inline-flex, so a following full stop never wraps on its own.
 */
export function RoleChip({
  role,
  children,
}: {
  role: Role;
  children: ReactNode;
}) {
  return (
    <span
      className={`rounded-md box-decoration-clone px-1.5 py-0.5 font-mono font-semibold wrap-anywhere ${ROLE_CHIP[role]} ${ROLE_TEXT[role]}`}
    >
      {children}
    </span>
  );
}

/**
 * Live region for the explanation of what just happened. It stays mounted and
 * only its content and tone change, which is what screen readers announce.
 */
export function Narration({
  children,
  isWarning = false,
}: {
  children: ReactNode;
  /** Something unsafe just happened, such as an out-of-bounds read. */
  isWarning?: boolean;
}) {
  return (
    <p
      aria-live="polite"
      className={`flex gap-3 border-l-4 py-1 pl-4 text-base leading-relaxed sm:text-lg ${isWarning ? "border-destructive" : "border-foreground/15"}`}
    >
      {isWarning ? (
        <TriangleAlert
          aria-hidden="true"
          className="mt-1 size-5 shrink-0 text-destructive"
        />
      ) : null}
      <span className="min-w-0">{children}</span>
    </p>
  );
}

/**
 * Code-like controls, such as `nilai[ 2 ] → 30`: the student edits the
 * expression itself and the diagram answers.
 */
export function ExpressionBar({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-x-1.5 gap-y-2 rounded-xl bg-muted px-3 py-3 font-mono text-lg font-semibold sm:px-4 sm:text-2xl">
      {children}
    </div>
  );
}

/**
 * The module stage. Code and its editor on the left; on the right one card
 * holds the whole visualisation: what to do, the diagram, its controls and
 * the explanation, so the eye never has to hunt between panels.
 */
export function Stage({
  code,
  editor,
  hint,
  visual,
  controls,
  narration,
  footnote,
}: {
  code: ReactNode;
  editor: ReactNode;
  /** One short instruction: what the student can do here. */
  hint: ReactNode;
  visual: ReactNode;
  controls?: ReactNode;
  narration: ReactNode;
  /** Fine print under the narration, such as that the Addresses are made up. */
  footnote?: ReactNode;
}) {
  return (
    <SplitView
      code={code}
      editor={editor}
      visual={
        <section
          aria-label="Visualisasi"
          className="flex min-w-0 flex-col gap-5 rounded-2xl bg-card p-3 shadow-elevated ring-1 ring-foreground/10 sm:p-5"
        >
          <p className="flex gap-2 text-sm text-muted-foreground">
            <MousePointerClick
              aria-hidden="true"
              className="mt-0.5 size-4 shrink-0"
            />
            <span>{hint}</span>
          </p>
          {visual}
          {controls}
          {narration}
          {footnote ? (
            <p className="flex gap-2 text-sm text-muted-foreground">
              <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
              <span>{footnote}</span>
            </p>
          ) : null}
        </section>
      }
    />
  );
}

/**
 * The simulated console. Text from `freshFrom` on is what the current step
 * just printed and gets a ring; trailing spaces stay outside the ring.
 */
export function Screen({
  output,
  freshFrom = null,
}: {
  output: string;
  freshFrom?: number | null;
}) {
  const fresh = freshFrom === null ? "" : output.slice(freshFrom);
  const freshText = fresh.trimEnd();
  return (
    <div>
      <p className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <Terminal aria-hidden="true" className="size-4" />
        Layar (output)
      </p>
      <samp className="mt-2 block min-h-12 rounded-xl bg-muted px-4 py-2 font-mono text-lg leading-8 whitespace-pre-wrap sm:text-xl">
        {output.slice(0, output.length - fresh.length)}
        {freshText ? (
          <>
            <mark className="rounded-sm bg-transparent px-0.5 text-memory-ink ring-2 ring-memory">
              {freshText}
            </mark>
            {fresh.slice(freshText.length)}
          </>
        ) : null}
        <span
          aria-hidden="true"
          className="inline-block h-5 w-2.5 bg-foreground/60 align-middle motion-safe:animate-pulse"
        />
        {output === "" ? <span className="sr-only">masih kosong</span> : null}
      </samp>
    </div>
  );
}
