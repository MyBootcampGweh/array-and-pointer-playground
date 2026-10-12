import type { Metadata } from "next";

import { ModuleFrame, moduleMetadata } from "@/components/module-frame";

import { PointerVariableDemo } from "./pointer-variable-demo";

export const metadata: Metadata = moduleMetadata(6);

export default function PointerVariablePage() {
  return (
    <ModuleFrame
      number={6}
      analogy={
        <>
          Pointer itu kayak catatan di HP yang isinya Address rumah temen, bukan
          rumahnya.
        </>
      }
    >
      <PointerVariableDemo />
    </ModuleFrame>
  );
}
