"use client";

import { Columns2 } from "lucide-react";
import {
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";

const DEFAULT_SPLIT = 50;
const MIN_SPLIT = 30;
const MAX_SPLIT = 70;
const KEY_STEP = 5;
const STORAGE_KEY = "split";

function clampSplit(value: number): number {
  return Math.min(MAX_SPLIT, Math.max(MIN_SPLIT, Math.round(value)));
}

// The width is a per-viewer convenience: if storage is blocked, the default
// simply comes back on the next page.
function readSavedSplit(): number {
  try {
    const saved = Number(localStorage.getItem(STORAGE_KEY));
    return saved > 0 ? clampSplit(saved) : DEFAULT_SPLIT;
  } catch {
    return DEFAULT_SPLIT;
  }
}

function saveSplit(value: number) {
  try {
    localStorage.setItem(STORAGE_KEY, String(value));
  } catch {
    // Storage blocked: the width still holds on this page.
  }
}

const noSubscription = () => () => {};

/**
 * The editor and code beside the visualisation, full width, with a 1px
 * divider a teacher can drag, or move with the arrow keys, to give either
 * side more room on a projector. The width carries over to the next module.
 * Below `lg` the sides stack: code, visualisation, then the editor.
 */
export function SplitView({
  code,
  editor,
  visual,
}: {
  code: ReactNode;
  editor: ReactNode;
  visual: ReactNode;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const saved = useSyncExternalStore(
    noSubscription,
    readSavedSplit,
    () => DEFAULT_SPLIT,
  );
  const [chosen, setChosen] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const split = chosen ?? saved;

  function choose(value: number) {
    const next = clampSplit(value);
    setChosen(next);
    saveSplit(next);
  }

  function splitAt(clientX: number): number {
    const box = containerRef.current?.getBoundingClientRect();
    return box ? ((clientX - box.left) / box.width) * 100 : split;
  }

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    if (event.button !== 0) {
      return;
    }
    // Keeps the drag from starting a text selection across the panels.
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    setIsDragging(true);
  }
  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    if (isDragging) {
      setChosen(clampSplit(splitAt(event.clientX)));
    }
  }
  function handlePointerUp(event: PointerEvent<HTMLDivElement>) {
    if (isDragging) {
      setIsDragging(false);
      choose(splitAt(event.clientX));
    }
  }
  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const next: Record<string, number> = {
      ArrowLeft: split - KEY_STEP,
      ArrowRight: split + KEY_STEP,
      Home: MIN_SPLIT,
      End: MAX_SPLIT,
      Enter: DEFAULT_SPLIT,
    };
    const value = next[event.key];
    if (value !== undefined) {
      event.preventDefault();
      choose(value);
    }
  }

  // Each side scrolls on its own and keeps 20px of room, so card shadows
  // and focus rings stay inside the scroller.
  const panel = "lg:overflow-y-auto lg:p-5";

  return (
    <div
      ref={containerRef}
      // The header scrolls away, so the panes may fill the screen less a
      // little air; they always take that height, so the divider runs top to
      // bottom, and anything taller scrolls inside its own side.
      className={`flex flex-col gap-6 px-4 py-4 sm:px-6 lg:h-[calc(100svh-4rem)] lg:flex-row lg:gap-0 lg:p-0 ${isDragging ? "lg:cursor-col-resize lg:select-none" : ""}`}
    >
      <div
        className={`max-lg:contents lg:flex lg:min-w-0 lg:shrink-0 lg:flex-col lg:gap-4 ${panel}`}
        // Half the divider's width comes off each side, so 50 is a true half.
        style={{ width: `calc(${split}% - 0.5px)` }}
      >
        <div className="min-w-0 max-lg:order-1 lg:order-last">{code}</div>
        <div className="min-w-0 max-lg:order-3">{editor}</div>
      </div>
      {/* Only the 1px line is drawn; its 16px grab area overlaps the panes'
          padding, so the divider stays easy to hit. */}
      <div className="relative hidden w-px shrink-0 lg:block">
        {split !== DEFAULT_SPLIT ? (
          <button
            type="button"
            onClick={() => choose(DEFAULT_SPLIT)}
            title="Balikin lebar panel jadi 50/50"
            className="absolute top-3 left-1/2 z-10 flex size-6 -translate-x-1/2 items-center justify-center rounded-md bg-background text-muted-foreground ring-1 ring-border transition-colors hover:bg-muted hover:text-foreground"
          >
            <Columns2 aria-hidden="true" className="size-3.5" />
            <span className="sr-only">Balikin lebar panel jadi 50/50</span>
          </button>
        ) : null}
        <div
          role="separator"
          tabIndex={0}
          aria-orientation="vertical"
          aria-label="Lebar panel kode"
          aria-valuemin={MIN_SPLIT}
          aria-valuemax={MAX_SPLIT}
          aria-valuenow={split}
          title="Geser buat ubah lebar panel. Klik dua kali buat 50/50."
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={() => setIsDragging(false)}
          onDoubleClick={() => choose(DEFAULT_SPLIT)}
          onKeyDown={handleKeyDown}
          className="group absolute inset-y-0 left-1/2 flex w-4 -translate-x-1/2 cursor-col-resize touch-none items-center justify-center"
        >
          <span
            aria-hidden="true"
            className={`absolute inset-y-0 w-px transition-colors ${isDragging ? "bg-primary" : "bg-border"}`}
          />
          <span
            aria-hidden="true"
            className={`relative h-10 w-1.5 rounded-full transition-colors ${isDragging ? "bg-primary" : "bg-muted-foreground group-hover:bg-foreground"}`}
          />
        </div>
      </div>
      <div className={`min-w-0 max-lg:order-2 lg:flex-1 ${panel}`}>
        {visual}
      </div>
    </div>
  );
}
