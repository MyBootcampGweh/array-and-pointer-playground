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
          Lokernya lebar 4 ubin. Maju 1 loker berarti loncat 4 ubin, bukan 1.{" "}
          <code>ptr + 1</code> juga gitu: maju 1 elemen, alias 4 byte.
        </>
      }
    >
      <PointerArrayDemo />
    </ModuleFrame>
  );
}
