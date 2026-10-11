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
    title: "Index Array",
    summary: "Index itu posisi, Value itu isinya.",
  },
  {
    number: 2,
    title: "Looping Input Array",
    summary: "for-loop ngisi array satu per satu pakai scanf.",
  },
  {
    number: 3,
    title: "Looping Output Array",
    summary: "for-loop baca Value array, terus nampilin satu per satu.",
  },
  {
    number: 4,
    title: "Array di Memory",
    summary:
      "Elemen array berjejer di Memory. Di simulasi ini, tiap int memakai 4 byte.",
  },
  {
    number: 5,
    title: "Ampersand (&) di scanf",
    summary: "scanf butuh Address variabel, makanya pakai &.",
  },
  {
    number: 6,
    title: "Pointer ke Satu Variabel",
    summary: "Pointer nyimpen Address, bukan Value.",
  },
  {
    number: 7,
    title: "Dereferensi & Ubah Value",
    summary: "Pakai *ptr buat baca dan ganti Value lewat Address-nya.",
  },
  {
    number: 8,
    title: "Ganti Target Pointer",
    summary: "Pindahin Pointer ke variabel lain, Value-nya nggak berubah.",
  },
  {
    number: 9,
    title: "Pointer & Array",
    summary:
      "*(ptr + 1) dan nilai[1] ngambil Value yang sama, asal ptr nunjuk ke elemen pertama.",
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
  return `/modul/${number}`;
}
