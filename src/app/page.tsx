import { ArrowDown, ArrowRight } from "lucide-react";
import Link from "next/link";

import { Legend, buttonClass } from "@/components/ui";
import { addressOf } from "@/lib/memory";
import { MODULES, moduleHref } from "@/lib/modules";

export default function HomePage() {
  return (
    <div className="mx-auto flex max-w-content flex-col gap-12 px-4 py-10 sm:px-6 lg:py-16">
      <section className="grid items-center gap-10 lg:grid-cols-2">
        <div className="flex flex-col gap-5">
          <p className="text-sm font-semibold tracking-wide text-accent-foreground">
            Bahasa C · interaktif
          </p>
          <h1 className="text-display-md text-balance sm:text-display-lg">
            Array &amp; Pointer Playground
          </h1>
          <p className="text-lg leading-relaxed text-muted-foreground">
            Indeks, nilai, alamat, pointer. Klik, ganti angkanya, terus lihat
            sendiri apa yang kejadian di memori.
          </p>
          <Link
            href={moduleHref(1)}
            className={`${buttonClass("primary")} self-start`}
          >
            Mulai dari Modul 1
            <ArrowRight aria-hidden="true" />
          </Link>
        </div>
        <MemoryFigure />
      </section>

      <section aria-labelledby="daftar-modul" className="flex flex-col gap-4">
        <h2 id="daftar-modul" className="text-xl font-semibold">
          9 modul, urut dari dasar
        </h2>
        <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {MODULES.map((entry) => (
            <li key={entry.number}>
              <Link
                href={moduleHref(entry.number)}
                className="flex h-full items-start gap-4 rounded-2xl bg-card p-5 shadow-subtle ring-1 ring-foreground/10 transition duration-200 ease-interaction hover:shadow-elevated hover:ring-primary/40"
              >
                <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-accent font-mono text-lg font-semibold text-accent-foreground">
                  <span className="sr-only">Modul </span>
                  {entry.number}
                </span>
                <span className="flex flex-col gap-1">
                  <span className="text-lg font-semibold">{entry.title}</span>
                  <span className="text-muted-foreground">{entry.summary}</span>
                </span>
              </Link>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}

const FIGURE_VALUES = [10, 20, 30];
const FIGURE_TARGET = 1;

/** The whole site in one picture: an array in memory and a pointer to it. */
function MemoryFigure() {
  const row = "grid grid-cols-3 justify-items-center gap-x-3";
  return (
    <figure className="flex flex-col gap-5 rounded-2xl bg-card p-5 shadow-subtle ring-1 ring-foreground/10 sm:p-6">
      <div aria-hidden="true" className="flex flex-col gap-1.5 font-mono">
        <div className={row}>
          <div className="col-start-2 flex flex-col items-center gap-1">
            <span className="text-sm">
              <span className="text-muted-foreground">int *</span>
              <span className="font-semibold text-pointer">ptr</span>
            </span>
            <span className="rounded-xl border-2 border-pointer/60 px-3 py-1 text-xl font-semibold text-address">
              {addressOf(FIGURE_TARGET)}
            </span>
            <ArrowDown className="size-6 text-pointer" />
          </div>
        </div>
        <div className={`${row} text-sm text-index`}>
          {FIGURE_VALUES.map((_, index) => (
            <span key={index}>[{index}]</span>
          ))}
        </div>
        <div className={row}>
          {FIGURE_VALUES.map((value, index) => (
            <span
              key={index}
              className={`flex min-h-14 w-full max-w-24 items-center justify-center rounded-xl border-2 text-2xl font-semibold text-value ${index === FIGURE_TARGET ? "border-pointer/60" : "border-border"}`}
            >
              {value}
            </span>
          ))}
        </div>
        <div className={`${row} text-sm text-address`}>
          {FIGURE_VALUES.map((_, index) => (
            <span key={index}>{addressOf(index)}</span>
          ))}
        </div>
      </div>
      <figcaption className="flex flex-col gap-3">
        <span className="sr-only">
          Array berisi {FIGURE_VALUES.join(", ")} di alamat{" "}
          {FIGURE_VALUES.map((_, index) => addressOf(index)).join(", ")}, dan
          pointer ptr yang nyimpen alamat {addressOf(FIGURE_TARGET)}.
        </span>
        <span className="text-base text-muted-foreground">
          Array itu kayak loker berjejer. Pointer itu kertas yang nyatet alamat
          salah satu loker.
        </span>
        <Legend roles={["index", "value", "address", "pointer"]} />
      </figcaption>
    </figure>
  );
}
