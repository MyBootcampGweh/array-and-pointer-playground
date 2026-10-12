import type { Metadata } from "next";

import { ModuleFrame, moduleMetadata } from "@/components/module-frame";

import { PointerTargetDemo } from "./pointer-target-demo";

export const metadata: Metadata = moduleMetadata(8);

export default function PointerTargetPage() {
  return (
    <ModuleFrame
      number={8}
      analogy={
        <>
          Ganti Address di catatan nggak bikin rumahnya pindah, catatannya aja
          yang sekarang nunjuk ke rumah lain.
        </>
      }
    >
      <PointerTargetDemo />
    </ModuleFrame>
  );
}
