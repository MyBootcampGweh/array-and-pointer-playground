import type { Metadata } from "next";

import { ModuleFrame, moduleMetadata } from "@/components/module-frame";

import { ArrayIndexingDemo } from "./array-indexing-demo";

export const metadata: Metadata = moduleMetadata(1);

export default function ArrayIndexingPage() {
  return (
    <ModuleFrame
      number={1}
      question="Kalau kamu menulis nilai[2], yang kamu dapat itu angka 2, atau isi kotak ketiga?"
      analogy={
        <>
          Indeks itu nomor loker, nilai itu barang di dalam loker. Loker nomor 2
          boleh berisi apa saja; nomornya tetap 2. Dan karena nomor loker
          dimulai dari 0, loker nomor 2 adalah loker ketiga.
        </>
      }
      quiz={{
        question:
          "Dari int skor[4] = {7, 8, 9, 10}; berapa skor[3]? Bolehkah menulis skor[4]?",
        answer: (
          <>
            <code className="font-mono">skor[3]</code> bernilai 10, karena
            indeks 3 adalah elemen keempat.{" "}
            <code className="font-mono">skor[4]</code> tidak boleh: indeks yang
            sah hanya 0 sampai 3, jadi itu sudah di luar batas array.
          </>
        ),
      }}
    >
      <ArrayIndexingDemo />
    </ModuleFrame>
  );
}
