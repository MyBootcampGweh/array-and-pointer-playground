"use client";

import { Moon, Sun } from "lucide-react";
import { useSyncExternalStore } from "react";

import { buttonClass } from "@/components/ui";

// The theme lives on <html>, where the script in `layout.tsx` sets it before
// the first paint, so the button reads it there instead of copying it to state.
function isDark(): boolean {
  return document.documentElement.dataset.theme === "dark";
}

function subscribe(onChange: () => void): () => void {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, {
    attributeFilter: ["data-theme"],
  });
  return () => observer.disconnect();
}

export function ThemeToggle() {
  const isDarkTheme = useSyncExternalStore(subscribe, isDark, () => false);

  function handleClick() {
    const next = isDark() ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem("theme", next);
    } catch {
      // Storage blocked (private mode): the switch still works for this visit.
    }
  }

  return (
    <button
      type="button"
      aria-pressed={isDarkTheme}
      title="Mode gelap"
      onClick={handleClick}
      className={`${buttonClass("ghost")} size-11 px-0`}
    >
      {/* Both icons render and CSS shows one, so even the server HTML matches. */}
      <Sun aria-hidden="true" className="dark:hidden" />
      <Moon aria-hidden="true" className="hidden dark:block" />
      <span className="sr-only">Mode gelap</span>
    </button>
  );
}
