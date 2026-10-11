import { TriangleAlert } from "lucide-react";
import { type ComponentProps, type ReactNode } from "react";

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
