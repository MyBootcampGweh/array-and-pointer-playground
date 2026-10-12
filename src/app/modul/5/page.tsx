import type { Metadata } from "next";

import { ModuleFrame, moduleMetadata } from "@/components/module-frame";

import { ScanfAddressDemo } from "./scanf-address-demo";

export const metadata: Metadata = moduleMetadata(5);

export default function ScanfAddressPage() {
  return (
    <ModuleFrame
      number={5}
      analogy={
        <>
          Kurir butuh Address rumah buat nganter paket, scanf juga butuh{" "}
          <code>&amp;angka</code> biar tau angkanya ditaruh di mana.
        </>
      }
    >
      <ScanfAddressDemo />
    </ModuleFrame>
  );
}
