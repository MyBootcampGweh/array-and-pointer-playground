import { useState } from "react";

import { useStepper } from "@/components/run-controls";
import { type EditResult, type Run, type Step, withInput } from "@/lib/program";

/**
 * The state every module's run is made of, kept apart: the program (what the
 * editor changes), the inputs typed for scanf (part of the run's history),
 * and the step being shown. The snapshots are derived from the first two,
 * so stepping back shows an older one and never undoes anything.
 */
export function useSimulation<P, E extends { kind: string }, S extends Step>({
  example,
  edit,
  run,
}: {
  example: P;
  /** `null` for an edit that is invalid or changes nothing. */
  edit: (program: P, change: E) => EditResult<P> | null;
  run: (program: P, inputs: readonly number[]) => Run<S>;
}) {
  const [program, setProgram] = useState(example);
  const [inputs, setInputs] = useState<readonly number[]>([]);
  const [notice, setNotice] = useState<string | null>(null);
  // Bumped by Pulihkan Contoh, so half-typed drafts go too.
  const [editorKey, setEditorKey] = useState(0);
  const snapshots = run(program, inputs);
  const stepper = useStepper(snapshots.length);
  const now = snapshots[stepper.step] ?? snapshots[0];
  const slot = now.inputSlot;

  function handleEdit(change: E) {
    if (change.kind === "restore") {
      setEditorKey((key) => key + 1);
      setNotice(null);
    }
    const result = edit(program, change);
    // Same program as before: the run carries on where it was.
    if (result === null) {
      return;
    }
    setProgram(result.program);
    setNotice(result.notice);
    // A new program means the old run, and what was typed in it, no longer
    // applies: back to its start, paused.
    setInputs([]);
    stepper.reset();
  }

  function handleInput(value: number) {
    if (slot === null) {
      return;
    }
    setInputs(withInput(inputs, slot, value));
    // The step after a scanf is always the one that stores what it read.
    stepper.goTo(stepper.step + 1);
  }

  return {
    program,
    notice,
    editorKey,
    stepper,
    now,
    /** What this step's scanf read last time, if it already ran. */
    answered: slot === null ? null : (inputs[slot] ?? null),
    isAwaitingInput: slot !== null && inputs[slot] === undefined,
    isOpenEnded: snapshots[snapshots.length - 1]?.inputSlot !== null,
    /** Terminal pieces from here on are what the current step wrote. */
    freshFrom: snapshots[stepper.step - 1]?.terminal.length ?? 0,
    handleEdit,
    handleInput,
  };
}
