import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";

import { ThemeToggle } from "@/components/theme-toggle";

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
    "Belajar array dan pointer di C lewat simulasi interaktif. Cocok buat pemula.",
};

// Runs in <head> before the first paint, so a saved (or system) dark theme
// never flashes light first. Falls back to light if storage is blocked.
const THEME_SCRIPT = `try{var t=localStorage.getItem("theme");if(t==="dark"||(t!=="light"&&matchMedia("(prefers-color-scheme: dark)").matches))document.documentElement.dataset.theme="dark"}catch(e){}`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // The script above may change `data-theme` before hydration; the DOM wins.
    <html
      lang="id"
      data-theme="light"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="flex min-h-svh flex-col">
        <a
          href="#konten"
          className="sr-only rounded-xl bg-primary px-4 py-2 text-primary-foreground focus:not-sr-only focus:absolute focus:top-2 focus:left-2"
        >
          Lompat ke konten
        </a>
        <header className="border-b bg-card">
          <div className="mx-auto flex max-w-content items-center justify-between gap-3 px-4 py-1.5 sm:px-6">
            <Link
              href="/"
              className="flex items-center gap-2.5 rounded-lg py-1.5 font-semibold"
            >
              <span
                aria-hidden="true"
                className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary font-mono text-sm font-bold text-primary-foreground"
              >
                *p
              </span>
              Array &amp; Pointer Playground
            </Link>
            <ThemeToggle />
          </div>
        </header>
        <main id="konten" className="flex-1">
          {children}
        </main>
        <footer className="border-t bg-surface">
          <p className="mx-auto max-w-content px-4 py-4 text-sm text-muted-foreground sm:px-6">
            Ini simulasi di browser, bukan program C beneran. Alamat memorinya
            juga cuma ilustrasi.
          </p>
        </footer>
      </body>
    </html>
  );
}
