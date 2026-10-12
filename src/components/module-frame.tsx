import { ArrowLeft, ArrowRight, Lightbulb } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { type ReactNode } from "react";

import { buttonClass } from "@/components/ui";
import {
  MODULES,
  type ModuleNumber,
  getModule,
  moduleHref,
} from "@/lib/modules";

export function moduleMetadata(number: ModuleNumber): Metadata {
  const { title, summary } = getModule(number);
  return { title: `Modul ${number}: ${title}`, description: summary };
}

type ModuleFrameProps = {
  number: ModuleNumber;
  /** One short sentence; the diagram does the rest. */
  analogy: ReactNode;
  /** The interactive simulation. */
  children: ReactNode;
};

/**
 * A module page: full width, with a compact header so the workspace gets the
 * height, and a quiet link to the next module.
 */
export function ModuleFrame({ number, analogy, children }: ModuleFrameProps) {
  const { title } = getModule(number);
  return (
    <div className="flex w-full flex-col">
      <div className="flex flex-col gap-3 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:gap-8 lg:py-3">
        <ModuleNav
          current={number}
          className="lg:order-last lg:ml-auto lg:shrink-0"
        />
        <header className="flex min-w-0 flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight text-balance">
            {title}
          </h1>
          <Analogy>{analogy}</Analogy>
        </header>
      </div>
      {children}
      <Pager current={number} />
    </div>
  );
}

function Analogy({ children }: { children: ReactNode }) {
  return (
    <p className="flex gap-2 text-sm leading-relaxed text-muted-foreground">
      <Lightbulb
        aria-hidden="true"
        className="mt-0.5 size-4 shrink-0 text-accent-foreground"
      />
      <span>
        <span className="font-semibold text-foreground">Bayangin aja: </span>
        {children}
      </span>
    </p>
  );
}

/**
 * The numbered module buttons. Hovering or focusing one shows its title in a
 * tooltip under the row; it hangs from the nav rather than the button, so it
 * never runs off a phone screen. Screen readers get the title from the link.
 */
function ModuleNav({
  current,
  className = "",
}: {
  current: ModuleNumber;
  className?: string;
}) {
  return (
    <nav aria-label="Daftar modul" className={`relative ${className}`}>
      <ol className="flex flex-wrap gap-1.5">
        {MODULES.map((entry) => {
          const isCurrent = entry.number === current;
          const name = `Modul ${entry.number}: ${entry.title}`;
          return (
            <li key={entry.number}>
              <Link
                href={moduleHref(entry.number)}
                aria-current={isCurrent ? "page" : undefined}
                className={`peer flex size-11 items-center justify-center rounded-xl text-sm font-semibold ring-1 transition-colors ${isCurrent ? "bg-primary text-primary-foreground ring-primary" : "bg-card ring-foreground/10 hover:bg-muted"}`}
              >
                <span aria-hidden="true">{entry.number}</span>
                <span className="sr-only">{name}</span>
              </Link>
              <span
                aria-hidden="true"
                className="pointer-events-none absolute top-full left-0 z-30 mt-1.5 hidden w-max max-w-full rounded-lg bg-foreground px-2.5 py-1 text-sm text-background shadow-elevated peer-hover:block peer-focus-visible:block"
              >
                {name}
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/** Outline links, so they never compete with the run's controls. */
function Pager({ current }: { current: ModuleNumber }) {
  const previous = MODULES.find((entry) => entry.number === current - 1);
  const next = MODULES.find((entry) => entry.number === current + 1);

  return (
    <nav
      aria-label="Modul sebelum dan sesudah"
      className="flex flex-col gap-3 border-t px-4 py-6 sm:flex-row sm:justify-between sm:px-6"
    >
      {previous ? (
        <Link href={moduleHref(previous.number)} className={buttonClass()}>
          <ArrowLeft aria-hidden="true" />
          Modul {previous.number}: {previous.title}
        </Link>
      ) : (
        <Link href="/" className={buttonClass()}>
          <ArrowLeft aria-hidden="true" />
          Semua modul
        </Link>
      )}
      {next ? (
        <Link
          href={moduleHref(next.number)}
          className={`${buttonClass()} whitespace-normal`}
        >
          Lanjut ke Modul {next.number}: {next.title}
          <ArrowRight aria-hidden="true" />
        </Link>
      ) : (
        <Link href="/" className={buttonClass()}>
          Beres! Balik ke awal
          <ArrowRight aria-hidden="true" />
        </Link>
      )}
    </nav>
  );
}
