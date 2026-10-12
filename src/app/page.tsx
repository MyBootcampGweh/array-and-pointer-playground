import { ArrowRight, Info } from "lucide-react";
import Link from "next/link";

import { ArrayDiagram } from "@/components/memory-diagram";
import { type Role, RoleChip, buttonClass } from "@/components/ui";
import { INT_SIZE_BYTES, addressOf } from "@/lib/memory";
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
            Belajar array dan Pointer di C lewat simulasi. Klik, ganti angkanya,
            terus lihat perubahan di Memory.
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

/** The colour key, in the palette's own words. */
const KEY: readonly { role: Role; term: string; meaning: string }[] = [
  { role: "variable", term: "Variabel", meaning: "tempat nyimpen Value" },
  { role: "index", term: "Index", meaning: "posisi di array, mulai dari 0" },
  { role: "value", term: "Memory", meaning: "tempat data program disimpan" },
  { role: "address", term: "Address", meaning: "lokasi kotaknya" },
  { role: "pointer", term: "Pointer", meaning: "nyimpen Address kotak lain" },
];

/** The whole site in one picture: an array in Memory and a Pointer to it. */
function MemoryFigure() {
  return (
    <figure className="flex flex-col gap-5 rounded-2xl bg-card p-4 shadow-elevated ring-1 ring-foreground/10 sm:p-6">
      <ArrayDiagram
        name="nilai"
        values={FIGURE_VALUES}
        showAddresses
        marks={[
          {
            kind: "pointer",
            column: FIGURE_TARGET,
            name: "ptr",
            value: addressOf(FIGURE_TARGET),
          },
        ]}
      />
      <figcaption className="flex flex-col gap-4">
        <p className="flex gap-2 text-sm text-muted-foreground">
          <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          Address di gambar ini simulasi: mulai {addressOf(0)}, tiap int memakai{" "}
          {INT_SIZE_BYTES} byte.
        </p>
        <ul aria-label="Arti warna" className="grid gap-2 sm:grid-cols-2">
          {KEY.map(({ role, term, meaning }) => (
            <li key={role} className="flex items-center gap-2">
              <span className="shrink-0">
                <RoleChip role={role}>{term}</RoleChip>
              </span>
              <span className="text-sm text-muted-foreground">{meaning}</span>
            </li>
          ))}
        </ul>
      </figcaption>
    </figure>
  );
}
