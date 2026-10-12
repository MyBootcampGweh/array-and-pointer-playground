import type { Metadata } from "next";

import { ModuleFrame, moduleMetadata } from "@/components/module-frame";

import { ArrayIndexingDemo } from "./array-indexing-demo";

export const metadata: Metadata = moduleMetadata(1);

export default function ArrayIndexingPage() {
  return (
    <ModuleFrame
      number={1}
      analogy={
        <>
          Index itu nomor loker yang mulai dari 0, Value itu barang di dalamnya.
        </>
      }
    >
      <ArrayIndexingDemo />
    </ModuleFrame>
  );
}
