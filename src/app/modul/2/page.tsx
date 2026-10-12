import type { Metadata } from "next";

import { ModuleFrame, moduleMetadata } from "@/components/module-frame";

import { LoopInputDemo } from "./loop-input-demo";

export const metadata: Metadata = moduleMetadata(2);

export default function LoopInputPage() {
  return (
    <ModuleFrame
      number={2}
      analogy={
        <>
          Kayak petugas yang ngisi loker satu per satu dari nomor 0, terus
          berhenti pas nomornya sama dengan jumlah loker.
        </>
      }
    >
      <LoopInputDemo />
    </ModuleFrame>
  );
}
