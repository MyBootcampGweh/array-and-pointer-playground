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
};

export function useStepper(stepCount: number): Stepper {
  const [state, dispatch] = useReducer(stepperReducer, INITIAL_STEPPER_STATE);

  useEffect(() => {
    if (!state.isPlaying) {
      return;
    }
    const timer = setTimeout(
      () => dispatch({ type: "tick", stepCount }),
      AUTO_PLAY_DELAY_MS,
    );
    return () => clearTimeout(timer);
  }, [state.isPlaying, state.step, stepCount]);

  return {
    // Guards the render between a shorter run and the reset that follows it.
    step: Math.min(state.step, stepCount - 1),
    stepCount,
    isPlaying: state.isPlaying,
    next: () => dispatch({ type: "next", stepCount }),
    prev: () => dispatch({ type: "prev" }),
    reset: () => dispatch({ type: "reset" }),
    togglePlay: () =>
      dispatch(
        state.isPlaying ? { type: "pause" } : { type: "play", stepCount },
      ),
  };
}

/**
 * Prev/Next/Reset use `aria-disabled` rather than `disabled` at the ends of the
 * run, so a keyboard user pressing Next repeatedly keeps focus on the button.
 * Below `sm` the buttons shrink to their icons; the words stay for screen
 * readers.
 */
export function StepControls({ stepper }: { stepper: Stepper }) {
  const { step, stepCount, isPlaying } = stepper;
  const isFirst = step === 0;
  const isLast = step >= stepCount - 1;
  const label = "max-sm:sr-only";

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        <Button onClick={stepper.prev} aria-disabled={isFirst}>
          <StepBack aria-hidden="true" />
          <span className={label}>Mundur</span>
        </Button>
        <Button variant="primary" onClick={stepper.next} aria-disabled={isLast}>
          <span className={label}>Lanjut</span>
          <StepForward aria-hidden="true" />
        </Button>
        <Button onClick={stepper.togglePlay}>
          {isPlaying ? (
            <Pause aria-hidden="true" />
          ) : (
            <Play aria-hidden="true" />
          )}
          <span className={label}>{isPlaying ? "Jeda" : "Putar"}</span>
        </Button>
        <Button onClick={stepper.reset} aria-disabled={isFirst && !isPlaying}>
          <RotateCcw aria-hidden="true" />
          <span className={label}>Ulang</span>
        </Button>
      </div>
      <div className="flex items-center gap-3">
        <div
          aria-hidden="true"
          className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted"
        >
          <div
            className="h-full rounded-full bg-primary transition-all duration-300 ease-interaction"
            style={{ width: `${((step + 1) / stepCount) * 100}%` }}
          />
        </div>
        <p className="text-sm text-muted-foreground tabular-nums">
          <span aria-hidden="true">
            {step + 1} / {stepCount}
          </span>
          <span className="sr-only">
            Langkah {step + 1} dari {stepCount}
          </span>
        </p>
      </div>
    </div>
  );
}
