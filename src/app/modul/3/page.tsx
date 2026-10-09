import type { Metadata } from "next";

import { ModuleFrame, moduleMetadata } from "@/components/module-frame";

import { LoopOutputDemo } from "./loop-output-demo";

export const metadata: Metadata = moduleMetadata(3);

export default function LoopOutputPage() {
  return (
    <ModuleFrame
      number={3}
      question="Isi array-nya ada 5. Gimana nampilin semuanya tanpa nulis printf 5 kali?"
      analogy={
        <>
          Kali ini petugasnya buka loker satu per satu dari nomor 0, terus
          nyebutin isinya. Abis loker terakhir, dia berhenti.
        </>
      }
      roles={["index", "value", "active"]}
    >
      <LoopOutputDemo />
    </ModuleFrame>
  );
}
