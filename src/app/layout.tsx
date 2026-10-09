import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";

import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Array & Pointer Playground",
    template: "%s · Array & Pointer Playground",
  },
  description:
    "Belajar array dan pointer di bahasa C lewat simulasi interaktif, khusus untuk pemula.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="id" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="flex min-h-svh flex-col">
        <a
          href="#konten"
          className="sr-only rounded-xl bg-primary px-4 py-2 text-primary-foreground focus:not-sr-only focus:absolute focus:top-2 focus:left-2"
        >
          Langsung ke isi
        </a>
        <header className="border-b bg-card">
          <div className="mx-auto flex max-w-content items-baseline gap-3 px-4 py-3 sm:px-6">
            <Link href="/" className="font-semibold">
              Array &amp; Pointer Playground
            </Link>
            <span className="hidden text-sm text-muted-foreground sm:inline">
              Belajar array &amp; pointer di bahasa C
            </span>
          </div>
        </header>
        <main id="konten" className="flex-1">
          {children}
        </main>
        <footer className="border-t bg-surface">
          <p className="mx-auto max-w-content px-4 py-4 text-sm text-muted-foreground sm:px-6">
            Simulasi di browser, bukan eksekusi C sungguhan. Semua alamat memori
            hanya ilustrasi.
          </p>
        </footer>
      </body>
    </html>
  );
}
