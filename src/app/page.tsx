import Link from "next/link";

import { Legend, RoleChip, buttonClass } from "@/components/ui";
import { MODULES, moduleHref } from "@/lib/modules";

export default function HomePage() {
  return (
    <div className="mx-auto flex max-w-content flex-col gap-12 px-4 py-10 sm:px-6 lg:py-16">
      <section className="flex max-w-3xl flex-col gap-5">
        <p className="text-sm font-semibold tracking-wide text-accent-foreground">
          Playground interaktif · bahasa C
        </p>
        <h1 className="text-display-md text-balance sm:text-display-lg">
          Array &amp; Pointer Playground
        </h1>
        <p className="text-base leading-relaxed text-muted-foreground sm:text-lg">
          Masih bingung bedanya indeks, nilai, dan alamat? Di sini kamu bisa
          klik, ganti angka, dan lihat langsung apa yang terjadi di memori,
          langkah demi langkah. Semuanya simulasi di browser, jadi aman
          dicoba-coba.
        </p>
        <Link
          href={moduleHref(1)}
          className={`${buttonClass("primary")} self-start`}
        >
          Mulai dari Modul 1 →
        </Link>
      </section>

      <section
        aria-labelledby="analogi-loker"
        className="flex flex-col gap-4 rounded-2xl bg-card p-5 shadow-subtle ring-1 ring-foreground/10 sm:p-6"
      >
        <h2 id="analogi-loker" className="text-xl font-semibold">
          Bayangkan deretan loker
        </h2>
        <p className="max-w-3xl text-base leading-relaxed sm:text-lg">
          Array itu seperti loker berjejer. Tiap loker punya{" "}
          <RoleChip role="index">nomor urut</RoleChip>, punya{" "}
          <RoleChip role="value">isi</RoleChip>, dan punya{" "}
          <RoleChip role="address">alamat</RoleChip> di gedung. Pointer adalah
          secarik kertas yang mencatat{" "}
          <RoleChip role="pointer">alamat sebuah loker</RoleChip>, bukan isinya.
        </p>
        <Legend />
      </section>

      <section aria-labelledby="daftar-modul" className="flex flex-col gap-4">
        <h2 id="daftar-modul" className="text-xl font-semibold">
          Sembilan modul, urut dari dasar
        </h2>
        <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {MODULES.map((entry) => (
            <li key={entry.number}>
              <Link
                href={moduleHref(entry.number)}
                className="flex h-full flex-col gap-1 rounded-2xl bg-card p-5 shadow-subtle ring-1 ring-foreground/10 transition-shadow duration-200 ease-interaction hover:shadow-elevated"
              >
                <span className="text-sm font-semibold text-accent-foreground">
                  Modul {entry.number}
                </span>
                <span className="text-lg font-semibold">{entry.title}</span>
                <span className="text-muted-foreground">{entry.summary}</span>
              </Link>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
