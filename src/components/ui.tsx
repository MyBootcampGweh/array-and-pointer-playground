import { type ComponentProps, type ReactNode } from "react";

type ButtonVariant = "primary" | "outline";

const BUTTON_VARIANTS: Record<ButtonVariant, string> = {
  primary: "bg-primary text-primary-foreground hover:bg-primary/85",
  outline: "border border-border bg-background hover:bg-muted",
};

/** MBG's `xl` button size: the prominent control height, at least 44px. */
export function buttonClass(variant: ButtonVariant = "outline"): string {
  return `inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-base font-medium transition-colors duration-200 ease-interaction select-none active:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-disabled:cursor-not-allowed aria-disabled:opacity-50 ${BUTTON_VARIANTS[variant]}`;
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
      className={`inline-flex items-center rounded-4xl border bg-card px-2.5 py-0.5 font-mono text-sm font-medium ${ROLE_CHIP[role]}`}
    >
      {children}
    </span>
  );
}

const LEGEND: readonly { role: Role; label: string }[] = [
  { role: "index", label: "indeks = posisi" },
  { role: "value", label: "nilai = isi" },
  { role: "address", label: "alamat (ilustrasi)" },
  { role: "pointer", label: "pointer" },
  { role: "active", label: "aktif" },
  { role: "danger", label: "⚠ di luar batas" },
];

export function Legend() {
  return (
    <ul aria-label="Arti warna" className="flex flex-wrap gap-2">
      {LEGEND.map(({ role, label }) => (
        <li key={role}>
          <RoleChip role={role}>{label}</RoleChip>
        </li>
      ))}
    </ul>
  );
}

const CALLOUT_TONES = {
  info: { box: "border-primary/20 bg-accent", title: "text-accent-foreground" },
  danger: {
    box: "border-destructive/30 bg-destructive/5",
    title: "text-destructive",
  },
} as const;

export function Callout({
  tone = "info",
  title,
  children,
  isAlert = false,
}: {
  tone?: keyof typeof CALLOUT_TONES;
  title: string;
  children: ReactNode;
  /** Announce immediately; for warnings caused by what the student just did. */
  isAlert?: boolean;
}) {
  const styles = CALLOUT_TONES[tone];
  return (
    <div
      role={isAlert ? "alert" : undefined}
      className={`rounded-xl border p-4 text-base leading-relaxed ${styles.box}`}
    >
      <p className={`mb-1 font-semibold ${styles.title}`}>{title}</p>
      <div>{children}</div>
    </div>
  );
}

/** Live region for the step-by-step explanation. */
export function Narration({ children }: { children: ReactNode }) {
  return (
    <p
      aria-live="polite"
      className="rounded-xl bg-surface-muted p-4 text-base leading-relaxed sm:text-lg"
    >
      {children}
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
    <div className="grid gap-6 lg:grid-cols-12 lg:gap-8">
      <div className="flex min-w-0 flex-col gap-4 lg:col-span-5">
        {code}
        {editor}
      </div>
      <div className="flex min-w-0 flex-col gap-4 lg:col-span-7">
        {visual}
        {controls}
        {narration}
      </div>
    </div>
  );
}
