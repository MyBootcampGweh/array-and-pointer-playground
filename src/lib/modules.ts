import type { Route } from "next";

export type ModuleNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

export type ModuleInfo = {
  number: ModuleNumber;
  title: string;
  summary: string;
};

export const MODULES: readonly ModuleInfo[] = [
  {
    number: 1,
    title: "Indeks Array",
    summary: "Indeks itu posisi, nilai itu isinya.",
  },
  {
    number: 2,
    title: "Looping Input Array",
    summary: "for-loop ngisi array satu per satu pakai scanf.",
  },
  {
    number: 3,
    title: "Looping Output Array",
    summary: "for-loop baca isi array, terus nampilin satu per satu.",
  },
  {
    number: 4,
    title: "Array di Memori",
    summary: "Elemen array berjejer di memori, tiap int makan 4 byte.",
  },
  {
    number: 5,
    title: "Ampersand (&) di scanf",
    summary: "scanf butuh alamat variabel, makanya pakai &.",
  },
  {
    number: 6,
    title: "Pointer ke Satu Variabel",
    summary: "Pointer nyimpen alamat, bukan nilai.",
  },
  {
    number: 7,
    title: "Dereferensi & Ubah Nilai",
    summary: "Pakai *ptr buat baca dan ganti nilai lewat alamatnya.",
  },
  {
    number: 8,
    title: "Ganti Target Pointer",
    summary: "Pindahin pointer ke variabel lain, nilainya nggak berubah.",
  },
  {
    number: 9,
    title: "Pointer & Array",
    summary: "ptr + 1 maju satu elemen, nilai[1] sama dengan *(ptr + 1).",
  },
];

export function getModule(number: ModuleNumber): ModuleInfo {
  const entry = MODULES.find((candidate) => candidate.number === number);
  if (!entry) {
    throw new Error(`Modul ${number} belum terdaftar di MODULES.`);
  }
  return entry;
}

export function moduleHref(number: ModuleNumber): Route {
  // Module pages land one at a time, so not every route exists yet for the
  // typed-routes check; the build output and the browser check confirm them.
  return `/modul/${number}` as Route;
}
