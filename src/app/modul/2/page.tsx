import type { Metadata } from "next";

import { ModuleFrame, moduleMetadata } from "@/components/module-frame";

import { LoopInputDemo } from "./loop-input-demo";

export const metadata: Metadata = moduleMetadata(2);

export default function LoopInputPage() {
  return (
    <ModuleFrame
      number={2}
      question="Kalau array punya 5 kotak, berapa kali scanf dipanggil, dan dari mana for-loop tahu kapan harus berhenti?"
      analogy={
        <>
          Bayangkan petugas yang mengisi loker satu per satu. Ia mulai dari
          loker 0, mengisinya, lalu pindah ke loker berikutnya. Begitu nomor
          loker sama dengan jumlah loker, ia berhenti, karena loker dengan nomor
          itu memang tidak ada.
        </>
      }
      quiz={{
        question:
          "Apa yang terjadi kalau kondisinya ditulis i <= ukuran_array?",
        answer: (
          <>
            Loop jalan satu kali lagi saat i = 5, dan scanf menulis ke{" "}
            <code className="font-mono">nilai[5]</code>, yang ada di luar batas
            array. Itu <em>undefined behavior</em>: bisa menimpa data lain atau
            membuat program crash. Karena itu kondisinya{" "}
            <code className="font-mono">i &lt; ukuran_array</code>.
          </>
        ),
      }}
    >
      <LoopInputDemo />
    </ModuleFrame>
  );
}
