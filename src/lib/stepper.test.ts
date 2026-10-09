import assert from "node:assert/strict";
import { test } from "node:test";

import { INITIAL_STEPPER_STATE, stepperReducer } from "./stepper.ts";

const stepCount = 3;

test("next and prev stay inside the run", () => {
  let state = INITIAL_STEPPER_STATE;
  state = stepperReducer(state, { type: "prev" });
  assert.equal(state.step, 0);
  for (let n = 0; n < 5; n++) {
    state = stepperReducer(state, { type: "next", stepCount });
  }
  assert.equal(state.step, stepCount - 1);
});

test("reset returns to the first step and stops playing", () => {
  const playing = { step: 2, isPlaying: true };
  assert.deepEqual(
    stepperReducer(playing, { type: "reset" }),
    INITIAL_STEPPER_STATE,
  );
});

test("auto-play stops by itself on the last step", () => {
  let state = stepperReducer(INITIAL_STEPPER_STATE, {
    type: "play",
    stepCount,
  });
  state = stepperReducer(state, { type: "tick", stepCount });
  assert.deepEqual(state, { step: 1, isPlaying: true });
  state = stepperReducer(state, { type: "tick", stepCount });
  assert.deepEqual(state, { step: 2, isPlaying: false });
});

test("play on the last step restarts; manual stepping pauses", () => {
  const atEnd = { step: stepCount - 1, isPlaying: false };
  assert.deepEqual(stepperReducer(atEnd, { type: "play", stepCount }), {
    step: 0,
    isPlaying: true,
  });
  const playing = { step: 0, isPlaying: true };
  assert.equal(
    stepperReducer(playing, { type: "next", stepCount }).isPlaying,
    false,
  );
});
