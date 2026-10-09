"use client";

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
 */
export function StepControls({ stepper }: { stepper: Stepper }) {
  const { step, stepCount, isPlaying } = stepper;
  const isFirst = step === 0;
  const isLast = step >= stepCount - 1;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button onClick={stepper.prev} aria-disabled={isFirst}>
        ← Sebelumnya
      </Button>
      <Button variant="primary" onClick={stepper.next} aria-disabled={isLast}>
        Berikutnya →
      </Button>
      <Button onClick={stepper.togglePlay}>
        {isPlaying ? "Jeda" : "Putar otomatis"}
      </Button>
      <Button onClick={stepper.reset} aria-disabled={isFirst && !isPlaying}>
        Ulang
      </Button>
      <p className="text-sm text-muted-foreground tabular-nums sm:ml-auto">
        Langkah {step + 1} dari {stepCount}
      </p>
    </div>
  );
}
