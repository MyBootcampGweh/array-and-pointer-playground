import type { Metadata } from "next";

import { ModuleFrame, moduleMetadata } from "@/components/module-frame";

import { ArrayMemoryDemo } from "./array-memory-demo";

export const metadata: Metadata = moduleMetadata(4);

export default function ArrayMemoryPage() {
  return (
    <ModuleFrame
      number={4}
      question="Indeks 2 itu alamatnya 2 juga, nggak?"
      analogy={
        <>
          Tiap loker lebarnya 4 ubin: loker 0 mulai di ubin 1000, loker 1 di
          ubin 1004, dan seterusnya. Jadi nomor loker (indeks) beda sama nomor
          ubin (alamat).
        </>
      }
      roles={["index", "value", "address", "active"]}
    >
      <ArrayMemoryDemo />
    </ModuleFrame>
  );
}
