"use client";

import { Pause, Play, RotateCcw, StepBack, StepForward } from "lucide-react";
import { useEffect, useReducer } from "react";

import { Button } from "@/components/ui";
import { INITIAL_STEPPER_STATE, stepperReducer } from "@/lib/stepper";

/** Long enough to read a step aloud in class before the next one arrives. */
const AUTO_PLAY_DELAY_MS = 1400;

export type Stepper = {
  step: number;
  stepCount: number;
  isPlaying: boolean;
  next: () => void;
  prev: () => void;
  reset: () => void;
  togglePlay: () => void;
  resume: (step: number) => void;
};

export function useStepper(stepCount: number): Stepper {
  const [state, dispatch] = useReducer(stepperReducer, INITIAL_STEPPER_STATE);
  // Guards the render between a shorter run and the reset that follows it.
  const step = Math.min(state.step, stepCount - 1);
  // Nothing left to play, such as a resume that lands on the last step or a
  // run that stops at a scanf waiting for its answer.
  const isPlaying = state.isPlaying && step < stepCount - 1;

  // One timer at a time: the cleanup clears it on pause, on every step and on
  // unmount, so leaving the module never leaves a tick behind.
  useEffect(() => {
    if (!isPlaying) {
      return;
    }
    const timer = setTimeout(
      () => dispatch({ type: "tick", stepCount }),
      AUTO_PLAY_DELAY_MS,
    );
    return () => clearTimeout(timer);
  }, [isPlaying, step, stepCount]);

  return {
    step,
    stepCount,
    isPlaying,
    next: () => dispatch({ type: "next", stepCount }),
    prev: () => dispatch({ type: "prev" }),
    reset: () => dispatch({ type: "reset" }),
    togglePlay: () =>
      dispatch(isPlaying ? { type: "pause" } : { type: "play", stepCount }),
    resume: (to) => dispatch({ type: "resume", step: to }),
  };
}

/**
 * The run's controls in one bar above the workspace. It sticks to the top
 * while the workspace scrolls, so on a phone Berikutnya stays in reach under
 * the code and the picture. The ends use `aria-disabled`, so a keyboard user
 * pressing Berikutnya repeatedly keeps focus; below `sm` buttons show icons.
 */
export function RunControls({
  stepper,
  isAwaitingInput = false,
  isOpenEnded = false,
}: {
  stepper: Stepper;
  /** scanf waits on this step: nothing runs until the student types. */
  isAwaitingInput?: boolean;
  /** The run so far stops at an unanswered scanf, so its length is unknown. */
  isOpenEnded?: boolean;
}) {
  const { step, stepCount, isPlaying } = stepper;
  const isFirst = step === 0;
  const isDone = step >= stepCount - 1 && !isAwaitingInput;
  const word = "max-sm:sr-only";
  const iconOnPhone = "max-sm:px-3";

  return (
    <div
      role="toolbar"
      aria-label="Kontrol simulasi"
      className="sticky top-0 z-20 flex flex-wrap items-center gap-2 border-y bg-background/90 px-4 py-1.5 backdrop-blur-sm sm:px-6"
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
      {/* At the end Play really starts over, so it says so. While scanf
          waits there is nothing to play: the student types first. */}
      <Button
        variant="primary"
        onClick={isAwaitingInput ? undefined : stepper.togglePlay}
        aria-disabled={isAwaitingInput || undefined}
        className={iconOnPhone}
      >
        {isPlaying ? <Pause aria-hidden="true" /> : <Play aria-hidden="true" />}
        <span className={word}>
          {isPlaying ? "Jeda" : isDone ? "Putar Ulang" : "Putar"}
        </span>
      </Button>
      <Button
        onClick={stepper.next}
        aria-disabled={isDone || isAwaitingInput}
        className={iconOnPhone}
      >
        <span className={word}>Berikutnya</span>
        <StepForward aria-hidden="true" />
      </Button>
      <p
        aria-live="polite"
        className="ml-auto text-sm text-muted-foreground tabular-nums"
      >
        {isAwaitingInput ? (
          <span className="font-medium text-foreground">Nunggu input</span>
        ) : isDone ? (
          <>
            <span className="max-sm:hidden">Simulasi selesai</span>
            <span className="sm:hidden">Selesai</span>
          </>
        ) : (
          <>
            <span className="max-sm:sr-only">Langkah </span>
            {step + 1}
            {isOpenEnded ? null : ` dari ${stepCount}`}
          </>
        )}
      </p>
    </div>
  );
}
