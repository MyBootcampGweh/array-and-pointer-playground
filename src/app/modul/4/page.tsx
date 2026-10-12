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
          Tiap loker lebarnya 4 ubin, jadi loker nomor 1 mulai di ubin 1004,
          bukan 1001.
        </>
      }
    >
      <ArrayMemoryDemo />
    </ModuleFrame>
  );
}
