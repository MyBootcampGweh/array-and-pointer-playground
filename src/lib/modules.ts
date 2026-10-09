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
    summary: "Bedakan indeks (posisi) dan nilai (isi) di dalam array.",
  },
  {
    number: 2,
    title: "Looping Input Array",
    summary: "Lihat for-loop mengisi array satu per satu lewat scanf.",
  },
  {
    number: 3,
    title: "Looping Output Array",
    summary: "Ikuti for-loop membaca dan mencetak isi array.",
  },
  {
    number: 4,
    title: "Array di Memori",
    summary: "Elemen array berjejer di memori, tiap int memakai 4 byte.",
  },
  {
    number: 5,
    title: "Ampersand (&) di scanf",
    summary: "Kenapa scanf butuh alamat variabel, bukan nilainya.",
  },
  {
    number: 6,
    title: "Pointer ke Satu Variabel",
    summary: "Pointer menyimpan alamat, bukan nilai.",
  },
  {
    number: 7,
    title: "Dereferensi dan Mengubah Nilai",
    summary: "Pakai *ptr untuk membaca dan mengubah nilai lewat alamat.",
  },
  {
    number: 8,
    title: "Mengganti Target Pointer",
    summary: "Arahkan pointer ke variabel lain tanpa mengubah nilai apa pun.",
  },
  {
    number: 9,
    title: "Pointer dan Array",
    summary: "ptr + 1 maju satu elemen, dan nilai[1] sama dengan *(ptr + 1).",
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
