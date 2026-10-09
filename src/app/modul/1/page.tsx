import type { Metadata } from "next";

import { ModuleFrame, moduleMetadata } from "@/components/module-frame";

import { ArrayIndexingDemo } from "./array-indexing-demo";

export const metadata: Metadata = moduleMetadata(1);

export default function ArrayIndexingPage() {
  return (
    <ModuleFrame
      number={1}
      question="nilai[2] itu angka 2, atau isi kotak ketiga?"
      analogy={
        <>
          Indeks itu nomor loker, nilai itu barang di dalamnya. Nomornya mulai
          dari 0, jadi loker nomor 2 itu loker ketiga.
        </>
      }
      roles={["index", "value", "active", "danger"]}
    >
      <ArrayIndexingDemo />
    </ModuleFrame>
  );
}
