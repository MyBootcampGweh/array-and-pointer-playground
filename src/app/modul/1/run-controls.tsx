"use client";

import { Pause, Play, RotateCcw, StepBack, StepForward } from "lucide-react";

import { type Stepper } from "@/components/step-controls";
import { Button } from "@/components/ui";

/**
 * The run's controls in one bar above the workspace. It sticks to the top
 * while the workspace scrolls, so on a phone Berikutnya stays in reach under
 * the code and the picture. The ends use `aria-disabled`, so a keyboard user
 * pressing Berikutnya repeatedly keeps focus; below `sm` buttons show icons.
 */
export function RunControls({ stepper }: { stepper: Stepper }) {
  const { step, stepCount, isPlaying } = stepper;
  const isFirst = step === 0;
  const isDone = step >= stepCount - 1;
  const word = "max-sm:sr-only";
  const iconOnPhone = "max-sm:px-3";

  return (
    <div
      role="toolbar"
      aria-label="Kontrol simulasi"
      className="sticky top-0 z-20 -mx-4 flex flex-wrap items-center gap-2 border-b bg-background/90 px-4 py-1.5 backdrop-blur-sm sm:-mx-6 sm:px-6"
    >
      <Button
        onClick={stepper.reset}
        aria-disabled={isFirst && !isPlaying}
        className={iconOnPhone}
      >
        <RotateCcw aria-hidden="true" />
        <span className={word}>Ulangi Simulasi</span>
      </Button>
      <Button
        onClick={stepper.prev}
        aria-disabled={isFirst}
        className={iconOnPhone}
      >
        <StepBack aria-hidden="true" />
        <span className={word}>Sebelumnya</span>
      </Button>
      {/* At the end Play really starts over, so it says so. */}
      <Button
        variant="primary"
        onClick={stepper.togglePlay}
        className={iconOnPhone}
      >
        {isPlaying ? <Pause aria-hidden="true" /> : <Play aria-hidden="true" />}
        <span className={word}>
          {isPlaying ? "Jeda" : isDone ? "Putar Ulang" : "Putar"}
        </span>
      </Button>
      <Button
        onClick={stepper.next}
        aria-disabled={isDone}
        className={iconOnPhone}
      >
        <span className={word}>Berikutnya</span>
        <StepForward aria-hidden="true" />
      </Button>
      <p
        aria-live="polite"
        className="ml-auto text-sm text-muted-foreground tabular-nums"
      >
        {isDone ? (
          <>
            <span className="max-sm:hidden">Simulasi selesai</span>
            <span className="sm:hidden">Selesai</span>
          </>
        ) : (
          <>
            <span className="max-sm:sr-only">Langkah </span>
            {step + 1} dari {stepCount}
          </>
        )}
      </p>
    </div>
  );
}
