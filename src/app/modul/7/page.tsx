import type { Metadata } from "next";

import { ModuleFrame, moduleMetadata } from "@/components/module-frame";

import { DereferenceDemo } from "./dereference-demo";

export const metadata: Metadata = moduleMetadata(7);

export default function DereferencePage() {
  return (
    <ModuleFrame
      number={7}
      analogy={
        <>
          <code>ptr</code> itu catatan Address-nya. <code>*ptr</code> itu dateng
          ke rumahnya: bisa liat Value-nya, bisa juga ganti.
        </>
      }
    >
      <DereferenceDemo />
    </ModuleFrame>
  );
}
