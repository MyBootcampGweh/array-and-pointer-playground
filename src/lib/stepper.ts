export type StepperState = { step: number; isPlaying: boolean };

export type StepperAction =
  | { type: "next"; stepCount: number }
  | { type: "prev" }
  | { type: "reset" }
  | { type: "play"; stepCount: number }
  | { type: "pause" }
  | { type: "tick"; stepCount: number };

export const INITIAL_STEPPER_STATE: StepperState = {
  step: 0,
  isPlaying: false,
};

/**
 * Manual Next/Previous pause auto-play: once a presenter steps by hand, the
 * simulation should not keep moving under them.
 */
export function stepperReducer(
  state: StepperState,
  action: StepperAction,
): StepperState {
  switch (action.type) {
    case "next":
      return {
        step: Math.min(state.step + 1, action.stepCount - 1),
        isPlaying: false,
      };
    case "prev":
      return { step: Math.max(state.step - 1, 0), isPlaying: false };
    case "reset":
      return INITIAL_STEPPER_STATE;
    case "play":
      // Playing from the last step restarts, which is what "play" means there.
      return {
        step: state.step >= action.stepCount - 1 ? 0 : state.step,
        isPlaying: true,
      };
    case "pause":
      return { ...state, isPlaying: false };
    case "tick": {
      const step = Math.min(state.step + 1, action.stepCount - 1);
      return { step, isPlaying: step < action.stepCount - 1 };
    }
  }
}
