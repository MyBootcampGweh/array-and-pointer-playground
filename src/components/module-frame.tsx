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
  /** One or two short sentences; the diagram does the rest. */
  analogy: ReactNode;
  /** The interactive simulation. */
  children: ReactNode;
};

export function ModuleFrame({ number, analogy, children }: ModuleFrameProps) {
  const { title } = getModule(number);
  const previous = MODULES.find((entry) => entry.number === number - 1);
  const next = MODULES.find((entry) => entry.number === number + 1);

  return (
    <div className="mx-auto flex w-full max-w-content flex-col gap-6 px-4 py-6 sm:px-6 lg:py-8">
      <nav aria-label="Daftar modul">
        <ol className="flex flex-wrap gap-1.5">
          {MODULES.map((entry) => {
            const isCurrent = entry.number === number;
            return (
              <li key={entry.number}>
                <Link
                  href={moduleHref(entry.number)}
                  aria-current={isCurrent ? "page" : undefined}
                  title={entry.title}
                  className={`flex size-11 items-center justify-center rounded-xl text-sm font-semibold ring-1 transition-colors ${isCurrent ? "bg-primary text-primary-foreground ring-primary" : "bg-card ring-foreground/10 hover:bg-muted"}`}
                >
                  <span aria-hidden="true">{entry.number}</span>
                  <span className="sr-only">
                    Modul {entry.number}: {entry.title}
                  </span>
                </Link>
              </li>
            );
          })}
        </ol>
      </nav>

      <header className="flex max-w-3xl flex-col gap-3">
        <p className="text-sm font-semibold tracking-wide text-accent-foreground">
          Modul {number} dari {MODULES.length}
        </p>
        <h1 className="text-display-sm text-balance sm:text-display-md">
          {title}
        </h1>
        <p className="flex gap-3 text-lg leading-relaxed text-muted-foreground">
          <Lightbulb
            aria-hidden="true"
            className="mt-1 size-5 shrink-0 text-accent-foreground"
          />
          <span>
            <span className="font-semibold text-foreground">
              Bayangin aja:{" "}
            </span>
            {analogy}
          </span>
        </p>
      </header>

      {children}

      <nav
        aria-label="Modul sebelum dan sesudah"
        className="flex flex-col gap-3 border-t pt-6 sm:flex-row sm:justify-between"
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
            className={`${buttonClass("primary")} whitespace-normal`}
          >
            Lanjut ke Modul {next.number}: {next.title}
            <ArrowRight aria-hidden="true" />
          </Link>
        ) : (
          <Link href="/" className={buttonClass("primary")}>
            Beres! Balik ke awal
            <ArrowRight aria-hidden="true" />
          </Link>
        )}
      </nav>
    </div>
  );
}
