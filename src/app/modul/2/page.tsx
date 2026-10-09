import type { Metadata } from "next";

import { ModuleFrame, moduleMetadata } from "@/components/module-frame";

import { LoopInputDemo } from "./loop-input-demo";

export const metadata: Metadata = moduleMetadata(2);

export default function LoopInputPage() {
  return (
    <ModuleFrame
      number={2}
      question="Array-nya 5 kotak. scanf bakal jalan berapa kali, dan kapan loop-nya berhenti?"
      analogy={
        <>
          Kayak petugas yang ngisi loker satu per satu dari nomor 0. Begitu
          nomornya sama dengan jumlah loker, dia berhenti, soalnya loker itu
          emang nggak ada.
        </>
      }
      roles={["index", "value", "active"]}
    >
      <LoopInputDemo />
    </ModuleFrame>
  );
}
