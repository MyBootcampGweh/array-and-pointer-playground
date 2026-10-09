import type { Metadata } from "next";
import Link from "next/link";
import { type ReactNode } from "react";

import { Callout, Legend, buttonClass } from "@/components/ui";
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
  /** Opening question that frames the module. */
  question: string;
  analogy: ReactNode;
  quiz: { question: string; answer: ReactNode };
  /** The interactive simulation. */
  children: ReactNode;
};

export function ModuleFrame({
  number,
  question,
  analogy,
  quiz,
  children,
}: ModuleFrameProps) {
  const { title } = getModule(number);
  const previous = MODULES.find((entry) => entry.number === number - 1);
  const next = MODULES.find((entry) => entry.number === number + 1);

  return (
    <div className="mx-auto flex w-full max-w-content flex-col gap-6 px-4 py-6 sm:px-6 lg:gap-8 lg:py-10">
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

      <header className="flex flex-col gap-3">
        <p className="text-sm font-semibold tracking-wide text-accent-foreground">
          Modul {number} dari {MODULES.length}
        </p>
        <h1 className="text-display-sm text-balance sm:text-display-md">
          {title}
        </h1>
        <p className="max-w-3xl text-base leading-relaxed text-muted-foreground sm:text-lg">
          <span className="font-semibold text-foreground">
            Pertanyaan pemantik:
          </span>{" "}
          {question}
        </p>
        <Legend />
      </header>

      {children}

      <div className="grid gap-4 lg:grid-cols-2">
        <Callout title="Analogi">{analogy}</Callout>
        <details className="rounded-xl bg-card p-4 shadow-subtle ring-1 ring-foreground/10">
          <summary className="cursor-pointer font-semibold">
            Cek pemahaman: {quiz.question}
          </summary>
          <div className="mt-3 text-base leading-relaxed">{quiz.answer}</div>
        </details>
      </div>

      <nav
        aria-label="Modul sebelum dan sesudah"
        className="flex flex-col gap-3 border-t pt-6 sm:flex-row sm:justify-between"
      >
        {previous ? (
          <Link href={moduleHref(previous.number)} className={buttonClass()}>
            ← Modul {previous.number}: {previous.title}
          </Link>
        ) : (
          <Link href="/" className={buttonClass()}>
            ← Daftar modul
          </Link>
        )}
        {next ? (
          <Link
            href={moduleHref(next.number)}
            className={`${buttonClass("primary")} whitespace-normal`}
          >
            Berikutnya: Modul {next.number} · {next.title} →
          </Link>
        ) : (
          <Link href="/" className={buttonClass("primary")}>
            Selesai! Kembali ke beranda →
          </Link>
        )}
      </nav>
    </div>
  );
}
