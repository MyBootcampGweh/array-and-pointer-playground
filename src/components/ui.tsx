import { Lightbulb, TriangleAlert } from "lucide-react";
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

export function Panel({
  title,
  children,
  className = "",
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`min-w-0 rounded-2xl bg-card p-4 shadow-subtle ring-1 ring-foreground/10 sm:p-5 ${className}`}
    >
      <h2 className="mb-3 text-sm font-semibold tracking-wide text-muted-foreground uppercase">
        {title}
      </h2>
      {children}
    </section>
  );
}

export type Role =
  "index" | "value" | "address" | "pointer" | "active" | "danger";

const ROLE_CHIP: Record<Role, string> = {
  index: "border-index/40 text-index",
  value: "border-value/40 text-value",
  address: "border-address/50 text-address",
  pointer: "border-pointer/40 text-pointer",
  active: "border-active/40 text-active",
  danger: "border-destructive/40 text-destructive",
};

export function RoleChip({
  role,
  children,
}: {
  role: Role;
  children: ReactNode;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-4xl border bg-card px-2.5 py-0.5 font-mono text-sm font-medium ${ROLE_CHIP[role]}`}
    >
      {children}
    </span>
  );
}

const LEGEND: readonly { role: Role; label: ReactNode }[] = [
  { role: "index", label: "indeks = posisi" },
  { role: "value", label: "nilai = isi" },
  { role: "address", label: "alamat (ilustrasi)" },
  { role: "pointer", label: "pointer" },
  { role: "active", label: "aktif" },
  {
    role: "danger",
    label: (
      <>
        <TriangleAlert aria-hidden="true" className="size-3.5" />
        di luar batas
      </>
    ),
  },
];

/** Only the roles a page actually draws, so the key never lists noise. */
export function Legend({ roles }: { roles?: readonly Role[] }) {
  return (
    <ul aria-label="Arti warna" className="flex flex-wrap gap-2">
      {LEGEND.filter(({ role }) => !roles || roles.includes(role)).map(
        ({ role, label }) => (
          <li key={role}>
            <RoleChip role={role}>{label}</RoleChip>
          </li>
        ),
      )}
    </ul>
  );
}

/** A short aside, such as the analogy that opens each module. */
export function Callout({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="flex gap-3 rounded-xl border border-primary/20 bg-accent p-4 text-base leading-relaxed">
      <Lightbulb
        aria-hidden="true"
        className="mt-0.5 size-5 shrink-0 text-accent-foreground"
      />
      <div>
        <p className="font-semibold text-accent-foreground">{title}</p>
        <div>{children}</div>
      </div>
    </div>
  );
}

/**
 * Live region for the step-by-step explanation. It stays mounted and only its
 * content and tone change, which is what screen readers need to announce it.
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
      className={`flex gap-3 rounded-xl p-4 text-base leading-relaxed sm:text-lg ${isWarning ? "bg-destructive/5 ring-1 ring-destructive/30" : "bg-surface-muted"}`}
    >
      {isWarning ? (
        <TriangleAlert
          aria-hidden="true"
          className="mt-1 size-5 shrink-0 text-destructive"
        />
      ) : null}
      <span>{children}</span>
    </p>
  );
}

/**
 * The module stage: code and editor on the left, the diagram and its controls
 * on the right from `lg` up; stacked in reading order below that.
 */
export function Stage({
  code,
  editor,
  visual,
  controls,
  narration,
}: {
  code: ReactNode;
  editor: ReactNode;
  visual: ReactNode;
  controls?: ReactNode;
  narration: ReactNode;
}) {
  return (
    // Equal columns: the longest line, the `for` header, then fits at full
    // size on a 1280px projector instead of scrolling.
    <div className="grid gap-6 lg:grid-cols-2 lg:gap-8">
      <div className="flex min-w-0 flex-col gap-4">
        {code}
        {editor}
      </div>
      <div className="flex min-w-0 flex-col gap-4">
        {visual}
        {controls}
        {narration}
      </div>
    </div>
  );
}
