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
    default: "MyBootcampGweh - Array & Pointer Playground",
    template: "%s · Array & Pointer Playground",
  },
  description:
    "Belajar array dan pointer di C lewat simulasi interaktif. Cocok buat pemula.",
};

// Runs in <head> before the first paint, so a saved (or system) dark theme
// never flashes light first. Falls back to light if storage is blocked.
const THEME_SCRIPT = `try{var t=localStorage.getItem("theme");if(t==="dark"||(t!=="light"&&matchMedia("(prefers-color-scheme: dark)").matches))document.documentElement.dataset.theme="dark"}catch(e){}`;

/**
 * MBG's brand mark, a terminal prompt, copied from MBG's
 * `web/src/components/brand/logo.tsx`. Inline SVG, so it needs no asset path
 * under the Pages base path.
 */
function MbgLogo() {
  return (
    <svg
      viewBox="0 0 32 32"
      aria-hidden="true"
      focusable="false"
      className="size-8 shrink-0 text-brand-600"
    >
      <rect width="32" height="32" rx="9" fill="currentColor" />
      <path
        d="M10.5 12 14 16l-3.5 4"
        fill="none"
        stroke="white"
        strokeWidth="2.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M17 20.25h5"
        fill="none"
        stroke="white"
        strokeWidth="2.25"
        strokeLinecap="round"
        opacity="0.85"
      />
    </svg>
  );
}

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
              <MbgLogo />
              {/* Stacks on phones instead of squeezing the theme switch. */}
              <span className="flex flex-col text-sm leading-tight sm:flex-row sm:gap-1.5 sm:text-base">
                <span>
                  MyBootcampGweh<span className="max-sm:sr-only"> - </span>
                </span>
                <span>Array &amp; Pointer Playground</span>
              </span>
            </Link>
            <ThemeToggle />
          </div>
        </header>
        <main id="konten" className="flex-1">
          {children}
        </main>
      </body>
    </html>
  );
}
