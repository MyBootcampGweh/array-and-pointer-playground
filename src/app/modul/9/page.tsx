import type { Metadata } from "next";

import { ModuleFrame, moduleMetadata } from "@/components/module-frame";

import { PointerArrayDemo } from "./pointer-array-demo";

export const metadata: Metadata = moduleMetadata(9);

export default function PointerArrayPage() {
  return (
    <ModuleFrame
      number={9}
      analogy={
        <>
          Pointer maju per elemen, dan di simulasi ini satu elemen int itu 4
          byte.
        </>
      }
    >
      <PointerArrayDemo />
    </ModuleFrame>
  );
}
