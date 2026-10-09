import type { Metadata } from "next";

import { ModuleFrame, moduleMetadata } from "@/components/module-frame";

import { ArrayMemoryDemo } from "./array-memory-demo";

export const metadata: Metadata = moduleMetadata(4);

export default function ArrayMemoryPage() {
  return (
    <ModuleFrame
      number={4}
      analogy={
        <>
          Tiap loker lebarnya 4 ubin: loker 0 mulai di ubin 1000, loker 1 di
          ubin 1004, dan seterusnya. Jadi nomor loker (Index) beda sama nomor
          ubin (Address).
        </>
      }
    >
      <ArrayMemoryDemo />
    </ModuleFrame>
  );
}
