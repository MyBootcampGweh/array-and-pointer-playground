import type { Metadata } from "next";

import { ModuleFrame, moduleMetadata } from "@/components/module-frame";

import { LoopOutputDemo } from "./loop-output-demo";

export const metadata: Metadata = moduleMetadata(3);

export default function LoopOutputPage() {
  return (
    <ModuleFrame
      number={3}
      analogy={
        <>
          Kali ini petugasnya buka loker satu per satu dari nomor 0, terus
          nyebutin Value-nya. Abis loker terakhir, dia berhenti.
        </>
      }
    >
      <LoopOutputDemo />
    </ModuleFrame>
  );
}
